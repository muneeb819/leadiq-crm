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

/**
 * The AI service wraps every payload as { success, data }. Unwrap it, and allowlist
 * the fields we accept — never spread an upstream body into a Prisma write.
 */
const unwrapAgent = (body: any): any => {
  if (!body || body.success !== true || !body.data) {
    throw Object.assign(new Error(body?.message || 'AI agent returned no data'), { status: 502 });
  }
  return body.data;
};

export const enrichLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);
    const response = await axios.post(`${env.AI_AGENTS_URL}/enrich`, { lead }, { timeout: 30000 });
    const result = unwrapAgent(response.data);

    if (result.error) return sendError(res, `Enrichment unavailable: ${result.error}`, 503);

    // Explicit allowlist — the Lead model has no `success`/`data` columns.
    const enriched = await leadService.updateLead(req.params.id, {
      notes: typeof result.notes === 'string' ? result.notes : lead.notes,
      tags: Array.isArray(result.tags) ? result.tags.map(String) : lead.tags,
      enriched: true,
      enrichedAt: new Date(),
    });
    sendSuccess(res, enriched);
  } catch (err: any) { sendError(res, err.message, err.status || 500); }
};

export const scoreLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) return sendError(res, 'Lead not found', 404);
    const response = await axios.post(`${env.AI_AGENTS_URL}/score`, { lead }, { timeout: 30000 });
    const result = unwrapAgent(response.data);

    if (result.error) return sendError(res, `Scoring unavailable: ${result.error}`, 503);

    const score = Number(result.score);
    if (!Number.isFinite(score)) {
      return sendError(res, 'AI agent returned a non-numeric score', 502);
    }

    const updated = await leadService.updateLead(req.params.id, {
      score: Math.max(0, Math.min(100, Math.round(score))),
      scoreReason: typeof result.reason === 'string' ? result.reason : null,
    });
    sendSuccess(res, updated);
  } catch (err: any) { sendError(res, err.message, err.status || 500); }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await leadService.getLeadStats();
    sendSuccess(res, stats);
  } catch (err: any) { sendError(res, err.message); }
};
