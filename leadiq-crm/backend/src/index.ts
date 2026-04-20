import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';

const PORT = parseInt(env.PORT, 10);

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');
    await redis.connect();
    logger.info('✅ Redis connected');
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 LeadIQ Backend running on port ${PORT}`);
      logger.info(`📖 API docs: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

bootstrap();
