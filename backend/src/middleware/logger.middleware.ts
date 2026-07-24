import morgan from 'morgan';
import { logger } from '../utils/logger';

const stream = { write: (msg: string) => logger.http(msg.trim()) };
export const httpLogger = morgan(':method :url :status :response-time ms', { stream });
