import { BaseClientRepository } from './BaseClientRepository.js';
import Client from '../../../shared/models/Client.js';
import logger from '../../../shared/config/logger.js';

class MongoClientRepository extends BaseClientRepository {
	constructor() {
		super(Client);
	}

	/**
	 * Creates a new client
	 * @param {Object} clientData
	 * @returns {Promise<Object>}
	 */
	async create(clientData) {
		try {
			const client = new this.model(clientData);
			await client.save();

			logger.info('Client created in MongoDB', {
				mongoId: client._id,
				slug: client.slug,
			});

			return client;
		} catch (error) {
			logger.debug('Error creating client in db:', error);
			throw error;
		}
	}

	/**
	 * Find client details using clientId
	 * @param {Object} clientId
	 * @returns {Promise<Object>}
	 */
	async findById(clientId) {
		try {
			const client = await this.model.findById(clientId);

			logger.info('Client details from mongodb', { clientId: client?._id });

			return client;
		} catch (error) {
			logger.debug('Error finding client in db by id:', error);
			throw error;
		}
	}

	/**
	 * Find client details using slug
	 * @param {string} slug
	 * @returns {Object}
	 */
	async findBySlug(slug) {
		try {
			const client = await this.model.findOne({ slug });
			return client;
		} catch (error) {
			logger.error('Error finding client by slug:', error);
			throw error;
		}
	}

	/**
	 * Find clients with filters and pagination
	 * @param {Object} filters - Query filters
	 * @param {Object} options - Query options (limit, skip, sort)
	 * @returns {Promise<Object>}
	 */
	async find(filters = {}, options = {}) {
		try {
			const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;

			const clients = await this.model
				.find(filters)
				.sort(sort)
				.skip(skip)
				.limit(limit)
				.select('__v');

			return clients;
		} catch (error) {
			logger.error('Error finding clients:', error);
			throw error;
		}
	}

	/**
	 * Count clients matching filters
	 * @param {Object} filters - Query filters
	 * @returns {Promise<number>}
	 */
	async count(filters = {}) {
		try {
			const count = await this.model.countDocuments(filters);
			return count;
		} catch (error) {
			logger.error('Error counting clients:', error);
			throw error;
		}
	}
}

export default new MongoClientRepository();
