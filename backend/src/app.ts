import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { httpLogger } from './middleware/logger.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFound } from './middleware/errorHandler.middleware';
import routes from './routes/index';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);
app.use('/api', apiLimiter);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
