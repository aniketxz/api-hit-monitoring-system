import config from "./index.js";
import logger from "./logger.js";
import mongoose from "mongoose";

/**
 * MongoDB database manager/connector
 */
class MongoConnection {
  constructor() {
    this.connection = null;
  }

  /**
   * Funtion to connect to MongoDB
   * @returns { Promise<mongoose.Connection> }
   */
  async connect() {
    try {
      if (this.connection) {
        logger.info("Mongodb already connected");
        return this.connection;
      }

      await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName,
      });

      this.connection = mongoose.connection;

      logger.info(`MongoDB connected: ${config.mongo.uri}`);

      this.connection.on("error", (err) => {
        logger.error("MongoDB connection error", err);
      });

      this.connection.on("disconnected", () => {
        logger.error("MongoDB Disconnected");
      });
    } catch (error) {
      logger.error("Failed to connect to MongoDB: ", error);
      throw error;
    }
  }

  /**
   * This function helps to disconnect the active mongodb connection
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info("Mongodb disconnected!");
      }
    } catch (error) {
      logger.error("Failed to disconnect to MongoDB: ", error);
      throw error;
    }
  }

  /**
   * Get the active connection
   * @returns {mongoose.Connection}
   */
  getConnection() {
    return this.connection;
  }
}

export default new MongoConnection();
