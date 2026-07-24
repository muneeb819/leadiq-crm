import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { validate } from '../middleware/validate.middleware';
import { createCompanySchema } from '../middleware/schemas';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({ include: { _count: { select: { leads: true } } }, orderBy: { name: 'asc' } });
    sendSuccess(res, companies);
  } catch (err: any) { sendError(res, err.message); }
});

router.post('/', validate(createCompanySchema), async (req, res) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    sendSuccess(res, company, 201);
  } catch (err: any) { sendError(res, err.message); }
});

router.get('/:id', async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { id: req.params.id }, include: { leads: true } });
    if (!company) return sendError(res, 'Company not found', 404);
    sendSuccess(res, company);
  } catch (err: any) { sendError(res, err.message); }
});

router.put('/:id', validate(createCompanySchema.partial()), async (req, res) => {
  try {
    const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
    sendSuccess(res, company);
  } catch (err: any) { sendError(res, err.message); }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: 'Company deleted' });
  } catch (err: any) { sendError(res, err.message); }
});

export default router;
