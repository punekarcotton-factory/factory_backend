import '../config/env';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';
import { LOG_DIR, LOKI_HOST, LOKI_USERNAME, LOKI_PASSWORD, LOKI_APP_LABEL, NODE_ENV } from '@config';

// logs dir
const logDir: string = join(__dirname, LOG_DIR);

if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`);

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // debug log setting
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/debug', // log file /logs/debug/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      json: false,
      zippedArchive: true,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
  }),
);

// ─── Loki Transport ───────────────────────────────────────────────────────────
// Only enabled when LOKI_HOST is configured in the environment.
if (LOKI_HOST) {
  const lokiOptions: ConstructorParameters<typeof LokiTransport>[0] = {
    host: LOKI_HOST,
    labels: {
      app: LOKI_APP_LABEL || 'pc-factory-backend',
      env: NODE_ENV || 'development', // will be 'development' or 'staging'
    },
    json: true,
    format: winston.format.combine(winston.format.splat(), winston.format.json()),
    replaceTimestamp: true,
    onConnectionError: (err: Error) => console.error('[Loki] Connection error:', err),
  };

  // Add basic auth credentials if provided
  if (LOKI_USERNAME && LOKI_PASSWORD) {
    lokiOptions.basicAuth = `${LOKI_USERNAME}:${LOKI_PASSWORD}`;
  }

  logger.add(new LokiTransport(lokiOptions));
  console.info(`[Loki] Transport enabled → ${LOKI_HOST} (env=${NODE_ENV || 'development'})`);
}

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
