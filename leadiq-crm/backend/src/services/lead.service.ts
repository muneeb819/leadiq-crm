import { prisma } from '../config/database';
import { getPaginationParams } from '../utils/pagination';

export const getLeads = async (query: any) => {
  const { page, limit, skip } = getPaginationParams(query);
  const { search, status, source, stage, minScore, maxScore } = query;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (status) where.status = status;
  if (source) where.source = source;
  if (stage) where.pipelineStage = stage;
  if (minScore) where.score = { ...where.score, gte: parseInt(minScore) };
  if (maxScore) where.score = { ...where.score, lte: parseInt(maxScore) };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where, skip, take: limit,
      include: { company: true, owner: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total, page, limit };
};

export const getLeadById = (id: string) =>
  prisma.lead.findUnique({
    where: { id },
    include: {
      company: true,
      owner: { select: { id: true, name: true, avatar: true } },
      outreaches: { orderBy: { createdAt: 'desc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

export const createLead = (data: any, ownerId: string) =>
  prisma.lead.create({
    data: { ...data, ownerId },
    include: { company: true },
  });

export const updateLead = (id: string, data: any) =>
  prisma.lead.update({ where: { id }, data, include: { company: true } });

export const deleteLead = (id: string) => prisma.lead.delete({ where: { id } });

export const getLeadStats = async () => {
  const [total, byStatus, bySource, avgScore, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ['status'], _count: true }),
    prisma.lead.groupBy({ by: ['source'], _count: true }),
    prisma.lead.aggregate({ _avg: { score: true } }),
    prisma.lead.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);
  return { total, byStatus, bySource, avgScore: avgScore._avg.score, recentLeads };
};
