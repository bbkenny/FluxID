import pinoImport from 'pino';

const pino = (pinoImport as any).default || pinoImport;

export const logger = (pino as any)({
  level: process.env.LOG_LEVEL || 'info',
});
