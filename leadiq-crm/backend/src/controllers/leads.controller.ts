import { Request, Response } from 'express';
import * as leadService from '../services/lead.service';
import { sendSuccess, sendError, paginate } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';
import { env } from '../config/env';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const { leads, total, page, limit } = await leadService.getLeads(req.query);
    sendSuccess(res, leads, 200, paginate(page, limit, total));
  } catch (err: any) { sendError(res, err.message); }
};

export const getLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);
    sendSuccess(res, lead);
  } catch (err: any) { sendError(res, err.message); }
};

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await leadService.createLead(req.body, req.user!.id);
    sendSuccess(res, lead, 201);
  } catch (err: any) { sendError(res, err.message); }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body);
    sendSuccess(res, lead);
  } catch (err: any) { sendError(res, err.message); }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    await leadService.deleteLead(req.params.id);
    sendSuccess(res, { message: 'Lead deleted' });
  } catch (err: any) { sendError(res, err.message); }
};

export const enrichLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);
    const response = await axios.post(`${env.AI_AGENTS_URL}/enrich`, { lead }, { timeout: 30000 });
    const enriched = await leadService.updateLead(req.params.id, {
      ...response.data,
      enriched: true,
      enrichedAt: new Date(),
    });
    sendSuccess(res, enriched);
  } catch (err: any) { sendError(res, err.message); }
};

export const scoreLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);
    const response = await axios.post(`${env.AI_AGENTS_URL}/score`, { lead }, { timeout: 30000 });
    const updated = await leadService.updateLead(req.params.id, {
      score: response.data.score,
      scoreReason: response.data.reason,
    });
    sendSuccess(res, updated);
  } catch (err: any) { sendError(res, err.message); }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await leadService.getLeadStats();
    sendSuccess(res, stats);
  } catch (err: any) { sendError(res, err.message); }
};
