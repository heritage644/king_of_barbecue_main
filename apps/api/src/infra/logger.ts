import pino from 'pino';
import { getApiConfig } from '@kob/config';

const config = getApiConfig();

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'trackingToken', '*.password', '*.token'],
    censor: '[REDACTED]'
  }
});
