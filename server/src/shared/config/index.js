// Global config

import dotenv from "dotenv";

dotenv.config();

const config = {
  // Server
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  // MongoDB
  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/api_monitoring",
    dbName: process.env.MONGO_DB_NAME || "api_monitoring",
  },

  // postgreSQL
  postgres: {
    host: process.env.PG_HOST || "localhost",
    port: parseInt(process.env.PG_PORT || "5432", 10),
    database: process.env.PG_DATABASE || "api_monitoring",
    user: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "postgres",
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    queue: process.env.RABBITMQ_QUEUE || "api_hits",
    puiblisherConfirms: process.env.RABBITMQ_PUBLISHER_CONFIRMS === "true" || false,
    retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || "1000", 10),
  },

  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "fcdd971a37c2b58799a8fdf9b05399d29fd3d285a31f3d6d627223d4a023dedc",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  // Rate limit
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10), // 100 req / 15 min per IP
  },

	// Cookie
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expiresIn: 24 * 60 * 60 * 1000,
  },
};

export default config;
