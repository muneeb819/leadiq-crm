import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();
router.post('/login', authLimiter, authCtrl.login);
router.post('/register', authLimiter, authCtrl.register);
router.post('/refresh', authCtrl.refresh);
router.get('/me', authenticate, authCtrl.me);
export default router;
