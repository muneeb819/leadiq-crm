import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'ok', service: 'leadiq-backend', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

export default router;
