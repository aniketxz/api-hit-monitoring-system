import logger from "../../../shared/config/logger.js";
import ApiKey from "../../../shared/models/ApiKey.js";
import { BaseApiKeyRepository } from "./BaseApiKeyRepository.js";

class MongoApiKeyRepository extends BaseApiKeyRepository {
  constructor() {
    super(ApiKey);
  }

  /**
   * Creates a new API key
   * @param {Object} apiKeyData - Api Key Data
   * @returns {Promise<Object>}
   */
  async create(apiKeyData) {
    try {
      const apiKey = new this.model(apiKeyData);
      await apiKey.save();

      logger.info("Api key created in db", { keyId: apiKey.keyId });
      return apiKey;
    } catch (error) {
      logger.error("Error creating api key in db:", error);
      throw error;
    }
  }

  /**
   * Find API key by value
   * @param {String} keyValue - API key value
   * @param {boolean} includeInactive - Incluede inactive keys
   * @returns {Promise<Object>}
   */
  async findByKeyValue(keyValue, includeInactive) {
    try {
      const filter = { keyValue };
      if (!includeInactive) {
        filter.isActive = true;
      }

      const apiKey = await this.model.findOne(filter).populate("clientId");
      return apiKey;
    } catch (error) {
      logger.error("Error creating API key by value:", error);
      throw error;
    }
  }

  /**
   * Find API keys by client ID
   * @param {String} clientId - Client ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async findByClientId(clientId, filters) {
    try {
      const query = { clientId, ...filters };
      const apiKeys = await this.model
        .find(query)
        .populate("createdBy", "username email")
        .sort({ createdAt: -1 });

      return apiKeys;
    } catch (error) {
      logger.error("Error finding API keys by client ID:", error);
      throw error;
    }
  }

  /**
   * Count API keys by client ID
   * @param {String} clientId - Client ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<number>}
   */
  async countByClientId(clientId, filters) {
    try {
      const query = { clientId, ...filters };
      const count = await this.model.countDocuments(query);
      return count;
    } catch (error) {
      logger.error("Error counting API keys:", error);
      throw error;
    }
  }
}

export default new MongoApiKeyRepository();
