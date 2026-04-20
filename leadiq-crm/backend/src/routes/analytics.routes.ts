import { Router } from 'express';
import * as analyticsCtrl from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/dashboard', analyticsCtrl.getDashboard);
export default router;
