import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import axios from 'axios';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

router.post('/discover', async (req, res) => {
  try {
    const response = await axios.post(`${env.AI_AGENTS_URL}/discover`, req.body, { timeout: 60000 });
    sendSuccess(res, response.data);
  } catch (err: any) { sendError(res, err.message); }
});

router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${env.AI_AGENTS_URL}/health`, { timeout: 5000 });
    sendSuccess(res, response.data);
  } catch (err: any) { sendError(res, 'AI agents unavailable', 503); }
});

export default router;
