import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../middleware/schemas';

const router = Router();
router.post('/login', authLimiter, validate(loginSchema), authCtrl.login);
router.post('/register', authLimiter, validate(registerSchema), authCtrl.register);
router.post('/refresh', authCtrl.refresh);
router.get('/me', authenticate, authCtrl.me);
export default router;
