import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import cookieParser from 'cookie-parser';

import config from './shared/config/index.js';
import logger from './shared/config/logger.js';
import mongodb from './shared/config/mongodb.js';
import postgres from './shared/config/postgres.js';
import rabbitmq from './shared/config/rabbitmq.js';
import errorHandler from './shared/middlewares/errorHandler.js';
import ResponseFormatter from './shared/utils/responseFormatter.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';

// Routers
import authRouter from './services/auth/routes/authRouter.js';
import clientRouter from './services/client/routes/clientRoutes.js';

/**
 * Init express app
 */
const app = express();

/**
 * Middlewares
 */
app.use(helmet());
app.use(
	cors({
		origin: true,
		credentials: true,
	}),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Request logging middleware
 */
app.use(requestLogger);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
	res.status(200).json(
		ResponseFormatter.success(
			{
				status: 'healthy',
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
			},
			'Service is healthy',
		),
	);
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
	res.status(200).json(
		ResponseFormatter.success(
			{
				service: 'API Hit Monitoring System',
				version: '1.0.0',
				endpoints: {
					health: '/health',
					auth: '/api/auth',
					ingest: '/api/hit',
					analytics: '/api/analytics',
				},
			},
			'API Hit Monitoring System',
		),
	);
});

/**
 * API Routes
 */
app.use('/api/auth', authRouter);
app.use('/api', clientRouter);

/**
 * 404 Handler
 */
app.use((req, res) => {
	res.status(404).json(ResponseFormatter.error('Endpoint not found', 404));
});

/**
 * Global error handler
 */
app.use(errorHandler);

/**
 * Initialize database connections and start the server
 */
async function initializeConnection() {
	try {
		logger.info('Initializing database connections...');

		// Connect to MongoDB
		await mongodb.connect();

		// Connect to pg
		await postgres.testConnection();

		// Connect to rabbitmq
		await rabbitmq.connect();

		logger.info('All connections established successfully');
	} catch (error) {
		logger.error('Failed to initialize connections:', error);
		throw error;
	}
}

async function startServer() {
	try {
		await initializeConnection();

		const server = app.listen(config.port, () => {
			logger.info(`Server started on port ${config.port}`);
			logger.info(`Environment: ${config.node_env}`);
			logger.info(`API available at: http://localhost:${config.port}`);
		});

		let isShuttingDown = false;

		const gracefulShutdown = async (signal) => {
			if (isShuttingDown) {
				logger.warn(`${signal} received but shutdown already in progress`);
				return;
			}
			isShuttingDown = true;

			logger.info(`${signal} received, shutting down gracefully...`);

			server.close(async (err) => {
				if (err) {
					logger.error('Error closing HTTP server:', err);
				}
				logger.info('HTTP server closed');

				try {
					await mongodb.disconnect();
					await postgres.close();
					await rabbitmq.close();
					logger.info('All connections closed, exiting process');
					process.exit(0);
				} catch (error) {
					logger.error('Error during shutdown:', error);
					process.exit(1);
				}
			});

			setTimeout(() => {
				logger.error('Forced shutdown');
				process.exit(1);
			}, 10000);
		};

		process.on('SIGTERM', () => {
			gracefulShutdown('SIGTERM');
		});

		process.on('SIGINT', () => {
			gracefulShutdown('SIGINT');
		});

		// Handle uncaught exceptions
		process.on('uncaughtException', (error) => {
			logger.error('Uncaught Exception:', error);
			gracefulShutdown('uncaughtException');
		});

		process.on('unhandledRejection', (reason, promise) => {
			logger.error('Unhandled Rejection at:', promise, 'Reason:', reason);
			gracefulShutdown('unhandledRejection');
		});
	} catch (error) {
		logger.error(`Failed to start server:`, error);
		process.exit(1);
	}
}

/**
 * Start the server
 */
startServer();
