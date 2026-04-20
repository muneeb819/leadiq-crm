import { Router } from 'express';
import * as leadsCtrl from '../controllers/leads.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/stats', leadsCtrl.getStats);
router.get('/', leadsCtrl.getLeads);
router.post('/', leadsCtrl.createLead);
router.get('/:id', leadsCtrl.getLead);
router.put('/:id', leadsCtrl.updateLead);
router.delete('/:id', leadsCtrl.deleteLead);
router.post('/:id/enrich', leadsCtrl.enrichLead);
router.post('/:id/score', leadsCtrl.scoreLead);
export default router;
