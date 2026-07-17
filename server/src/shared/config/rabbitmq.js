import amqp from 'amqplib';
import config from './index.js';
import logger from './logger.js';

class RabbitMQConnection {
	constructor() {
		this.connection = null;
		this.channel = null;
		this.reconnectAttempts = 0;
		this.maxReconnectDelay = 30000;
	}

	async connect() {
		if (this.channel) {
			return this.channel;
		}

		if (this.connectingPromise) {
			return this.connectingPromise;
		}

		this.connectingPromise = this._doConnect();

		try {
			const channel = await this.connectingPromise;
			return channel;
		} finally {
			this.connectingPromise = null;
		}
	}

	async _doConnect() {
		try {
			logger.info('Connecting to RabbitMQ', config.rabbitmq.url);
			this.connection = await amqp.connect(config.rabbitmq.url);
			this.channel = await this.connection.createChannel();
			const dlqName = `${config.rabbitmq.queue}.dlq`;

			// For API monitoring: consumers likely do network calls (pinging
			// endpoints) which can be slow/variable. prefetch(1) means each
			// consumer only gets the next job after acking the current one,
			// so slow checks don't hog a backlog of unrelated messages.
			// await this.channel.prefetch(1)

			// Dead Letter Queue
			await this.channel.assertQueue(dlqName, {
				durable: true,
			});

			// Normal Queue
			await this.channel.assertQueue(config.rabbitmq.queue, {
				durable: true,
				arguments: {
					'x-dead-letter-exchange': '',
					'x-dead-letter-routing-key': dlqName,
				},
			});

			logger.info('RabbitMQ connected, queue:', config.rabbitmq.queue);
			this.reconnectAttempts = 0;

			this.connection.on('close', () => {
				logger.warn('RabbitMQ connection closed');
				this.connection = null;
				this.channel = null;
				this._scheduleReconnect();
			});

			this.connection.on('error', (err) => {
				logger.error('RabbitMQ connection error', err);
				this.connection = null;
				this.channel = null;
				// "close" will also fire after "error" in amqplib, so we don't
				// need to call _scheduleReconnect() here too — avoids a double reconnect race.
			});

			return this.channel;
		} catch (error) {
			this.connection = null;
			this.channel = null;
			logger.error('Failed to connect to RabbitMQ', error);
			throw error;
		}
	}

	_scheduleReconnect() {
		this.reconnectAttempts += 1;
		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelay);

		logger.warn(
			`Reconnecting to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`,
		);

		setTimeout(() => {
			this.connect().catch((err) => {
				logger.error('Reconnect attempt failed', err);
				// connect() -> _doConnect() will have already cleared channel/connection,
				// and since "close" won't fire again on a failed .connect() call,
				// we need to explicitly schedule the next attempt here.
				this._scheduleReconnect();
			});
		}, delay);
	}

	getChannel() {
		return this.channel;
	}

	getStatus() {
		if (!this.connection || !this.channel) return 'disconnected';
		return 'connected';
	}

	async close() {
		try {
			if (this.channel) {
				await this.channel.close();
				this.channel = null;
			}
			if (this.connection) {
				// Prevent the "close" handler from trying to reconnect
				// when we're closing intentionally.
				this.connection.removeAllListeners('close');
				this.connection.removeAllListeners('error');
				await this.connection.close();
				this.connection = null;
			}

			logger.info('RabbitMQ connection closed');
		} catch (error) {
			logger.error('Error in closing RabbitMQ connection:', error);
		}
	}
}

export default new RabbitMQConnection();
