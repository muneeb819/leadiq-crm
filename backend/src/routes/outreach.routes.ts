import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import axios from 'axios';
import { env } from '../config/env';
import { validate } from '../middleware/validate.middleware';
import { draftEmailSchema, sendEmailSchema } from '../middleware/schemas';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const outreaches = await prisma.outreach.findMany({
      include: { lead: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, outreaches);
  } catch (err: any) { sendError(res, err.message); }
});

router.post('/draft', validate(draftEmailSchema), async (req: AuthRequest, res) => {
  try {
    const { leadId } = req.body;
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { company: true } });
    if (!lead) return sendError(res, 'Lead not found', 404);
    const response = await axios.post(`${env.AI_AGENTS_URL}/outreach/draft`, { lead }, { timeout: 30000 });
    sendSuccess(res, response.data);
  } catch (err: any) { sendError(res, err.message); }
});

router.post('/send', validate(sendEmailSchema), async (req: AuthRequest, res) => {
  try {
    const { leadId, subject, body } = req.body;
    const outreach = await prisma.outreach.create({
      data: { leadId, subject, body, status: 'SENT', sentAt: new Date(), sentById: req.user!.id },
    });
    sendSuccess(res, outreach, 201);
  } catch (err: any) { sendError(res, err.message); }
});

export default router;
