import { prisma } from '../config/database';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignFilters,
} from '../validators/campaign.validator';
import { Prisma, CampaignStatus } from '@prisma/client';
import * as activityService from './activity.service';

const CAMPAIGN_INCLUDE = {
  client: {
    select: {
      id: true,
      name: true,
      company: true,
    },
  },
  _count: {
    select: {
      leads: true,
      tasks: true,
    },
  },
} as const;

const VALID_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['DRAFT', 'PLANNED', 'ACTIVE'],
  PLANNED: ['PLANNED', 'ACTIVE', 'DRAFT'],
  ACTIVE: ['ACTIVE', 'PAUSED', 'COMPLETED'],
  PAUSED: ['PAUSED', 'ACTIVE', 'COMPLETED'],
  COMPLETED: ['COMPLETED'],
};

async function logActivity(
  userId: string | undefined,
  action: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!userId) return;
  try {
    await activityService.createActivity({
      userId,
      action,
      entityType: 'CAMPAIGN',
      entityId,
      metadata,
    });
  } catch {
    // Activity logging should not break the main operation
  }
}

export function isValidStatusTransition(
  currentStatus: CampaignStatus,
  newStatus: CampaignStatus
): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

export async function getCampaigns(filters: CampaignFilters) {
  const {
    search,
    clientId,
    type,
    status,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: Prisma.CampaignWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { targetAudience: { contains: search, mode: 'insensitive' } },
      { goals: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (clientId) {
    where.clientId = clientId;
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) {
      where.startDate.gte = new Date(startDateFrom);
    }
    if (startDateTo) {
      where.startDate.lte = new Date(startDateTo);
    }
  }

  if (endDateFrom || endDateTo) {
    where.endDate = {};
    if (endDateFrom) {
      where.endDate.gte = new Date(endDateFrom);
    }
    if (endDateTo) {
      where.endDate.lte = new Date(endDateTo);
    }
  }

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    'name',
    'type',
    'status',
    'startDate',
    'endDate',
    'budget',
    'createdAt',
    'updatedAt',
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: CAMPAIGN_INCLUDE,
      skip,
      take: limit,
      orderBy: { [sortField]: orderDirection },
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: CAMPAIGN_INCLUDE,
  });
}

export async function createCampaign(data: CreateCampaignInput, userId?: string) {
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      clientId: data.clientId,
      description: data.description ?? null,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      budget: data.budget,
      status: data.status ?? 'DRAFT',
      targetAudience: data.targetAudience ?? null,
      goals: data.goals ?? null,
    },
    include: CAMPAIGN_INCLUDE,
  });

  await logActivity(userId, 'CREATED', campaign.id, {
    name: campaign.name,
    type: campaign.type,
    clientId: campaign.clientId,
  });

  return campaign;
}

export async function updateCampaign(id: string, data: UpdateCampaignInput, userId?: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (data.clientId && data.clientId !== campaign.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }
  }

  // Validate status transition if status is being changed
  if (data.status && data.status !== campaign.status) {
    if (!isValidStatusTransition(campaign.status, data.status)) {
      throw new Error(
        `Invalid status transition from ${campaign.status} to ${data.status}`
      );
    }
  }

  // Validate date range if both dates are provided (either in data or existing)
  const effectiveStartDate =
    data.startDate !== undefined ? new Date(data.startDate) : campaign.startDate;
  const effectiveEndDate =
    data.endDate !== undefined ? new Date(data.endDate) : campaign.endDate;

  if (effectiveEndDate < effectiveStartDate) {
    throw new Error('End date must be on or after start date');
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience }),
      ...(data.goals !== undefined && { goals: data.goals }),
    },
    include: CAMPAIGN_INCLUDE,
  });

  await logActivity(userId, 'UPDATED', updatedCampaign.id, {
    name: updatedCampaign.name,
    type: updatedCampaign.type,
    updatedFields: Object.keys(data),
  });

  return updatedCampaign;
}

export async function deleteCampaign(id: string, userId?: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id } });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  await prisma.campaign.delete({ where: { id } });

  await logActivity(userId, 'DELETED', id, {
    name: campaign.name,
    type: campaign.type,
  });
}

export async function getCampaignsForTeamMember(userId: string) {
  // Team members see campaigns linked to their assigned tasks or leads
  const [taskCampaignIds, leadCampaignIds] = await Promise.all([
    prisma.task.findMany({
      where: { assignedUserId: userId, campaignId: { not: null } },
      select: { campaignId: true },
      distinct: ['campaignId'],
    }),
    prisma.lead.findMany({
      where: { assignedUserId: userId, campaignId: { not: null } },
      select: { campaignId: true },
      distinct: ['campaignId'],
    }),
  ]);

  const campaignIds = [
    ...new Set([
      ...taskCampaignIds.map((t) => t.campaignId as string),
      ...leadCampaignIds.map((l) => l.campaignId as string),
    ]),
  ];

  if (campaignIds.length === 0) {
    return [];
  }

  return prisma.campaign.findMany({
    where: { id: { in: campaignIds } },
    include: CAMPAIGN_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}