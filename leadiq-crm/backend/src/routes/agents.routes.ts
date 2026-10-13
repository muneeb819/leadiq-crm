import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../config/database';
import axios from 'axios';
import { env } from '../config/env';

const router = Router();
router.use(authenticate);

/**
 * Kept as literals rather than importing the generated enum, so this module
 * typechecks whether or not `prisma generate` has run. Must stay in sync with
 * the LeadSource enum in prisma/schema.prisma.
 */
const VALID_SOURCES = [
  'MANUAL', 'GITHUB', 'PRODUCT_HUNT', 'LINKEDIN', 'SERP', 'REFERRAL',
  'WEBSITE', 'HACKERNEWS', 'REDDIT', 'FREELANCER', 'JOB_BOARD', 'OTHER',
] as const;

const VALID_VERTICALS = [
  'IT_SERVICES', 'AI_AUTOMATION', 'MARKETING', 'GRAPHIC_DESIGN', 'BUY_SELL', 'OTHER',
] as const;

/** AI-service source names -> LeadSource enum. */
const SOURCE_MAP: Record<string, string> = {
  HACKERNEWS: 'HACKERNEWS',
  GITHUB: 'GITHUB',
  REDDIT: 'REDDIT',
  FREELANCER: 'FREELANCER',
  REMOTIVE: 'JOB_BOARD',
  REMOTEOK: 'JOB_BOARD',
  PRODUCT_HUNT: 'PRODUCT_HUNT',
};

const toStr = (v: any): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

const toEmail = (v: any): string | null =>
  typeof v === 'string' && v.includes('@') ? v.trim().toLowerCase() : null;

/** Which sources exist, what they cost, and whether they are configured. */
router.get('/sources', async (req, res) => {
  try {
    const response = await axios.get(`${env.AI_AGENTS_URL}/discover/sources`, { timeout: 10000 });
    sendSuccess(res, response.data?.data ?? []);
  } catch (err: any) { sendError(res, 'AI agents unavailable', 503); }
});

router.post('/discover', async (req: AuthRequest, res) => {
  try {
    const payload = {
      query: typeof req.body?.query === 'string' && req.body.query.trim() ? req.body.query.trim() : null,
      sources: Array.isArray(req.body?.sources) ? req.body.sources.filter((s: any) => typeof s === 'string') : undefined,
      limit: Math.min(50, Math.max(1, Number(req.body?.limit) || 20)),
      use_llm: req.body?.useLlm !== false,
    };

    const response = await axios.post(`${env.AI_AGENTS_URL}/discover`, payload, { timeout: 120000 });

    if (response.data?.success !== true || !response.data?.data) {
      return sendError(res, 'AI agents returned no data', 502);
    }

    const report = response.data.data;
    const discovered: any[] = Array.isArray(report.leads) ? report.leads : [];
    const ownerId = req.user!.id;

    const created: any[] = [];
    let skippedDuplicates = 0;

    for (const d of discovered) {
      const firstName = toStr(d.first_name) || toStr(d.organisation) || 'Unknown';
      const lastName = toStr(d.last_name) || '';
      const email = toEmail(d.contact_email);
      const intentUrl = toStr(d.source_url) || toStr(d.contact_url);

      // Dedupe: email first (strongest), then the source's own deep link, which
      // is unique per post/project and stops re-importing the same listing.
      const existing = email
        ? await prisma.lead.findFirst({ where: { email } })
        : intentUrl
          ? await prisma.lead.findFirst({ where: { intentUrl } })
          : null;
      if (existing) { skippedDuplicates++; continue; }

      // Company link — Company.name is not @unique (only `domain` is), so
      // upsert-by-name is impossible; find first, then create.
      const orgName = toStr(d.organisation);
      let companyId: string | undefined;
      if (orgName) {
        const existingCompany = await prisma.company.findFirst({ where: { name: orgName } });
        const company = existingCompany ?? await prisma.company.create({ data: { name: orgName } });
        companyId = company.id;
      }

      const mapped = SOURCE_MAP[String(d.source || '').toUpperCase()] || 'OTHER';
      const source = (VALID_SOURCES as readonly string[]).includes(mapped) ? mapped : 'OTHER';
      const vertical = (VALID_VERTICALS as readonly string[]).includes(d.vertical) ? d.vertical : null;

      // Build a note that is actually actionable: what they want, the budget,
      // the AI's reasoning, and the link to respond.
      const noteParts = [
        d.intent_summary ? `Ask: ${d.intent_summary}` : null,
        d.budget_hint ? `Budget: ${d.budget_hint}` : null,
        toStr(d.notes),
        intentUrl ? `Respond at: ${intentUrl}` : null,
      ].filter(Boolean);

      const tags = Array.isArray(d.tags) ? d.tags.map(String) : [];
      if (vertical) tags.push(vertical.toLowerCase());
      if (typeof d.confidence === 'number') tags.push(`conf:${Math.round(d.confidence * 100)}`);

      const lead = await prisma.lead.create({
        data: {
          firstName: firstName.slice(0, 100),
          lastName: lastName.slice(0, 100),
          email,
          title: toStr(d.title)?.slice(0, 200) ?? null,
          githubUrl: toStr(d.github_url),
          linkedinUrl: toStr(d.linkedin_url),
          intentUrl,
          budget: toStr(d.budget_hint)?.slice(0, 100) ?? null,
          vertical,
          notes: noteParts.join('\n').slice(0, 4000) || null,
          tags: Array.from(new Set(tags)).slice(0, 20),
          source: source as any,
          score: typeof d.confidence === 'number'
            ? Math.max(0, Math.min(100, Math.round(d.confidence * 100)))
            : 0,
          scoreReason: typeof d.confidence === 'number'
            ? `Intent confidence from ${d.source}` + (Array.isArray(d.matched_terms) && d.matched_terms.length
                ? ` (matched: ${d.matched_terms.slice(0, 5).join(', ')})` : '')
            : null,
          companyId,
          ownerId,
        },
        include: { company: true },
      });
      created.push(lead);
    }

    sendSuccess(res, {
      discovered: discovered.length,
      created: created.length,
      skippedDuplicates,
      llmUsed: report.llm_used === true,
      llmError: report.llm_error ?? null,
      // Surfaced so the UI can say *why* a source produced nothing — that
      // distinction (no key vs rate-limited vs down) is the whole game.
      sources: report.sources ?? [],
      notAttempted: report.not_attempted ?? [],
      leads: created,
    }, 201);
  } catch (err: any) { sendError(res, err.message, err.status || 500); }
});

router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${env.AI_AGENTS_URL}/health`, { timeout: 5000 });
    sendSuccess(res, response.data);
  } catch (err: any) { sendError(res, 'AI agents unavailable', 503); }
});

export default router;
