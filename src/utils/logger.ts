import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.json()
  ),
  transports: [
    new transports.Console({
      fmt: format.combine(
        format.colorize(),
        format.timestamp({
          format: 'HH:mm:ss'
        }),
        format.printf(info => `${info.timestamp} [${info.level}] ${info.message}`)
      )),
    ]
  })
});

// Add file logging for production
const fileTransport = new transports.File({
  filename: 'logs/ephant-log.log',
  maxsize: '20m',
  maxFiles: 5
});

// Easy logger methods
const customLogger = {
  debug: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args)
};

export default customLogger;