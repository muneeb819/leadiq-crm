import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { validate } from '../middleware/validate.middleware';
import { moveLeadSchema } from '../middleware/schemas';

const router = Router();
router.use(authenticate);

router.get('/stages', async (req, res) => {
  try {
    const stages = await prisma.pipelineStage.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
    sendSuccess(res, stages);
  } catch (err: any) { sendError(res, err.message); }
});

router.get('/', async (req, res) => {
  try {
    const stages = await prisma.pipelineStage.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
    const leads = await prisma.lead.findMany({ where: { pipelineStage: { not: null as any } }, include: { company: true }, orderBy: { updatedAt: 'desc' } });
    const pipeline: Record<string, typeof leads> = {};
    for (const stage of stages) {
      pipeline[stage.name] = leads.filter(l => l.pipelineStage === stage.name);
    }
    sendSuccess(res, { stages, pipeline });
  } catch (err: any) { sendError(res, err.message); }
});

router.put('/move', validate(moveLeadSchema), async (req, res) => {
  try {
    const { leadId, stage } = req.body;
    const lead = await prisma.lead.update({ where: { id: leadId }, data: { pipelineStage: stage } });
    sendSuccess(res, lead);
  } catch (err: any) { sendError(res, err.message); }
});

export default router;
