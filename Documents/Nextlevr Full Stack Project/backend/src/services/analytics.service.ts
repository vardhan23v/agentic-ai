import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { AnalyticsFilters } from '../validators/analytics.validator';

export interface DashboardStats {
  totalClients: number;
  activeCampaigns: number;
  leadsGenerated: number;
  tasksPending: number;
  conversionRate: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  clientName: string;
  budget: number;
  leadsCount: number;
  totalLeadsValue: number;
  conversionRate: number;
  status: string;
}

export interface LeadTrend {
  month: string;
  leads: number;
  converted: number;
  conversionRate: number;
}

export interface RevenueStats {
  totalValue: number;
  convertedValue: number;
  averageValue: number;
}

export interface ClientGrowth {
  month: string;
  clients: number;
}

export interface LeadStatusDistribution {
  status: string;
  count: number;
}

function toDateRange(
  dateFrom?: string,
  dateTo?: string
): { gte?: Date; lte?: Date } | undefined {
  if (!dateFrom && !dateTo) return undefined;
  return {
    ...(dateFrom && { gte: new Date(dateFrom) }),
    ...(dateTo && { lte: new Date(dateTo) }),
  };
}

function buildLeadWhere(
  filters: AnalyticsFilters
): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  const dateRange = toDateRange(filters.dateFrom, filters.dateTo);

  if (dateRange) {
    where.createdAt = dateRange;
  }

  if (filters.campaignId) {
    where.campaignId = filters.campaignId;
  }

  if (filters.clientId) {
    where.campaign = { clientId: filters.clientId };
  }

  return where;
}

function buildTaskWhere(
  filters: AnalyticsFilters
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    status: { not: 'COMPLETED' },
  };
  const dateRange = toDateRange(filters.dateFrom, filters.dateTo);

  if (dateRange) {
    where.createdAt = dateRange;
  }

  if (filters.campaignId) {
    where.campaignId = filters.campaignId;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  return where;
}

function buildCampaignWhere(
  filters: AnalyticsFilters
): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = {};

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.campaignId) {
    where.id = filters.campaignId;
  }

  const dateConditions: Prisma.CampaignScalarWhereInput[] = [];
  if (filters.dateTo) {
    dateConditions.push({ startDate: { lte: new Date(filters.dateTo) } });
  }
  if (filters.dateFrom) {
    dateConditions.push({ endDate: { gte: new Date(filters.dateFrom) } });
  }
  if (dateConditions.length > 0) {
    where.AND = dateConditions;
  }

  return where;
}

export async function getDashboardStats(
  filters: AnalyticsFilters
): Promise<DashboardStats> {
  const clientWhere: Prisma.ClientWhereInput = {};
  if (filters.clientId) {
    clientWhere.id = filters.clientId;
  }
  const clientDateRange = toDateRange(filters.dateFrom, filters.dateTo);
  if (clientDateRange) {
    clientWhere.createdAt = clientDateRange;
  }

  const campaignWhere = buildCampaignWhere(filters);
  const leadWhere = buildLeadWhere(filters);
  const taskWhere = buildTaskWhere(filters);

  const [totalClients, activeCampaigns, leadsGenerated, tasksPending, leadStats] =
    await Promise.all([
      prisma.client.count({ where: clientWhere }),
      prisma.campaign.count({
        where: { ...campaignWhere, status: 'ACTIVE' },
      }),
      prisma.lead.count({ where: leadWhere }),
      prisma.task.count({ where: taskWhere }),
      prisma.lead.groupBy({
        by: ['status'],
        where: leadWhere,
        _count: { id: true },
      }),
    ]);

  const totalLeads = leadStats.reduce((sum, group) => sum + group._count.id, 0);
  const convertedLeads = leadStats
    .filter((group) => group.status === 'CONVERTED')
    .reduce((sum, group) => sum + group._count.id, 0);

  const conversionRate =
    totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

  return {
    totalClients,
    activeCampaigns,
    leadsGenerated,
    tasksPending,
    conversionRate,
  };
}

export async function getCampaignPerformance(
  filters: AnalyticsFilters
): Promise<CampaignPerformance[]> {
  const where = buildCampaignWhere(filters);

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true },
      },
      leads: {
        select: { id: true, status: true, value: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return campaigns.map((campaign) => {
    const leadsCount = campaign.leads.length;
    const convertedCount = campaign.leads.filter(
      (lead) => lead.status === 'CONVERTED'
    ).length;
    const totalLeadsValue = campaign.leads.reduce(
      (sum, lead) => sum + Number(lead.value),
      0
    );

    return {
      id: campaign.id,
      name: campaign.name,
      clientName: campaign.client.name,
      budget: Number(campaign.budget),
      leadsCount,
      totalLeadsValue,
      conversionRate:
        leadsCount > 0
          ? Math.round((convertedCount / leadsCount) * 1000) / 10
          : 0,
      status: campaign.status,
    };
  });
}

export async function getLeadTrends(
  filters: AnalyticsFilters
): Promise<LeadTrend[]> {
  const where = buildLeadWhere(filters);

  const leads = await prisma.lead.findMany({
    where,
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<
    string,
    { leads: number; converted: number }
  >();

  for (const lead of leads) {
    const date = new Date(lead.createdAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const current = grouped.get(month) ?? { leads: 0, converted: 0 };
    current.leads += 1;
    if (lead.status === 'CONVERTED') {
      current.converted += 1;
    }
    grouped.set(month, current);
  }

  return Array.from(grouped.entries())
    .map(([month, stats]) => ({
      month,
      leads: stats.leads,
      converted: stats.converted,
      conversionRate:
        stats.leads > 0
          ? Math.round((stats.converted / stats.leads) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function getRevenueStats(
  filters: AnalyticsFilters
): Promise<RevenueStats> {
  const where = buildLeadWhere(filters);

  const [aggregate, convertedAggregate] = await Promise.all([
    prisma.lead.aggregate({
      where,
      _sum: { value: true },
      _avg: { value: true },
      _count: { id: true },
    }),
    prisma.lead.aggregate({
      where: { ...where, status: 'CONVERTED' },
      _sum: { value: true },
    }),
  ]);

  return {
    totalValue: Number(aggregate._sum.value ?? 0),
    convertedValue: Number(convertedAggregate._sum.value ?? 0),
    averageValue:
      aggregate._count.id > 0
        ? Math.round((Number(aggregate._avg.value ?? 0) + Number.EPSILON) * 100) /
          100
        : 0,
  };
}

export async function getClientGrowth(
  filters: AnalyticsFilters
): Promise<ClientGrowth[]> {
  const where: Prisma.ClientWhereInput = {};

  if (filters.clientId) {
    where.id = filters.clientId;
  }

  const dateRange = toDateRange(filters.dateFrom, filters.dateTo);
  if (dateRange) {
    where.createdAt = dateRange;
  }

  const clients = await prisma.client.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<string, number>();

  for (const client of clients) {
    const date = new Date(client.createdAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    grouped.set(month, (grouped.get(month) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([month, clients]) => ({
      month,
      clients,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function getLeadStatusDistribution(
  filters: AnalyticsFilters
): Promise<LeadStatusDistribution[]> {
  const where = buildLeadWhere(filters);

  const grouped = await prisma.lead.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  });

  return grouped
    .map((group) => ({
      status: group.status,
      count: group._count.id,
    }))
    .sort((a, b) => b.count - a.count);
}
