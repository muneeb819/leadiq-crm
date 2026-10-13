import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import axios from 'axios';
import { env } from '../config/env';

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

router.post('/draft', async (req: AuthRequest, res) => {
  try {
    const { leadId } = req.body;
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { company: true } });
    if (!lead) return sendError(res, 'Lead not found', 404);
    const response = await axios.post(`${env.AI_AGENTS_URL}/outreach/draft`, { lead }, { timeout: 30000 });
    // The agent already wraps as { success, data } — unwrap once so the client
    // receives { success, data: { subject, body } }, not a double-wrapped body.
    const draft = response.data?.data ?? {};
    if (response.data?.success !== true || !draft.subject || !draft.body) {
      return sendError(res, 'AI agent could not produce a draft', 502);
    }
    sendSuccess(res, { subject: draft.subject, body: draft.body });
  } catch (err: any) { sendError(res, err.message, err.status || 500); }
});

router.post('/send', async (req: AuthRequest, res) => {
  try {
    const { leadId, subject, body } = req.body;
    const outreach = await prisma.outreach.create({
      data: { leadId, subject, body, status: 'SENT', sentAt: new Date(), sentById: req.user!.id },
    });
    sendSuccess(res, outreach, 201);
  } catch (err: any) { sendError(res, err.message); }
});

export default router;
