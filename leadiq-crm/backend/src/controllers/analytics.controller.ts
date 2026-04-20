import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLeads, newLeadsThisWeek, wonLeads, byStage, bySource, recentActivities] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.lead.count({ where: { status: 'WON' } }),
      prisma.lead.groupBy({ by: ['pipelineStage'], _count: true }),
      prisma.lead.groupBy({ by: ['source'], _count: true }),
      prisma.activity.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { lead: { select: { firstName: true, lastName: true } }, user: { select: { name: true } } } }),
    ]);

    const avgScore = await prisma.lead.aggregate({ _avg: { score: true } });

    sendSuccess(res, {
      kpis: { totalLeads, newLeadsThisWeek, wonLeads, avgScore: Math.round(avgScore._avg.score || 0) },
      byStage,
      bySource,
      recentActivities,
    });
  } catch (err: any) { sendError(res, err.message); }
};
