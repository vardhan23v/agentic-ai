import { prisma } from '../config/database';
import {
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilters,
} from '../validators/lead.validator';
import { Prisma, LeadStatus } from '@prisma/client';
import * as activityService from './activity.service';
import * as notificationService from './notification.service';

const LEAD_INCLUDE = {
  campaign: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
  assignedUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

const VALID_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['NEW', 'CONTACTED', 'LOST'],
  CONTACTED: ['CONTACTED', 'QUALIFIED', 'LOST'],
  QUALIFIED: ['QUALIFIED', 'PROPOSAL', 'LOST'],
  PROPOSAL: ['PROPOSAL', 'CONVERTED', 'LOST'],
  CONVERTED: ['CONVERTED'],
  LOST: ['LOST', 'NEW'],
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
      entityType: 'LEAD',
      entityId,
      metadata,
    });
  } catch {
    // Activity logging should not break the main operation
  }
}

async function notifyAssignment(
  leadId: string,
  leadName: string,
  leadEmail: string,
  assignedUserId: string | null
): Promise<void> {
  if (!assignedUserId) return;
  try {
    await notificationService.createNotification({
      userId: assignedUserId,
      title: 'New Lead Assigned',
      message: `You have been assigned a new lead: ${leadName} (${leadEmail})`,
      type: 'LEAD_ASSIGNED',
      relatedId: leadId,
    });
  } catch {
    // Notification creation should not break the main operation
  }
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isValidStatusTransition(
  currentStatus: LeadStatus,
  newStatus: LeadStatus
): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

export async function getLeads(filters: LeadFilters) {
  const {
    search,
    status,
    source,
    campaignId,
    assignedUserId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: Prisma.LeadWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { source: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (source) {
    where.source = { equals: source, mode: 'insensitive' };
  }

  if (campaignId) {
    where.campaignId = campaignId;
  }

  if (assignedUserId) {
    where.assignedUserId = assignedUserId;
  }

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    'name',
    'email',
    'company',
    'source',
    'status',
    'value',
    'createdAt',
    'updatedAt',
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: LEAD_INCLUDE,
      skip,
      take: limit,
      orderBy: { [sortField]: orderDirection },
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: LEAD_INCLUDE,
  });
}

export async function createLead(data: CreateLeadInput, userId?: string) {
  if (data.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }
  }

  if (data.assignedUserId) {
    const user = await prisma.user.findUnique({
      where: { id: data.assignedUserId },
    });

    if (!user) {
      throw new Error('Assigned user not found');
    }
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
      source: data.source,
      campaignId: data.campaignId ?? null,
      status: data.status ?? 'NEW',
      value: data.value ?? 0,
      assignedUserId: data.assignedUserId ?? null,
      notes: data.notes ?? null,
    },
    include: LEAD_INCLUDE,
  });

  await logActivity(userId, 'CREATED', lead.id, {
    name: lead.name,
    email: lead.email,
    source: lead.source,
    status: lead.status,
  });

  await notifyAssignment(lead.id, lead.name, lead.email, lead.assignedUserId);

  return lead;
}

export async function updateLead(
  id: string,
  data: UpdateLeadInput,
  userId?: string
) {
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new Error('Lead not found');
  }

  if (data.campaignId && data.campaignId !== lead.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }
  }

  if (data.assignedUserId && data.assignedUserId !== lead.assignedUserId) {
    const user = await prisma.user.findUnique({
      where: { id: data.assignedUserId },
    });

    if (!user) {
      throw new Error('Assigned user not found');
    }
  }

  // Validate status transition if status is being changed
  if (data.status && data.status !== lead.status) {
    if (!isValidStatusTransition(lead.status, data.status)) {
      throw new Error(
        `Invalid status transition from ${lead.status} to ${data.status}`
      );
    }
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.campaignId !== undefined && { campaignId: data.campaignId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.assignedUserId !== undefined && { assignedUserId: data.assignedUserId }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: LEAD_INCLUDE,
  });

  await logActivity(userId, 'UPDATED', updatedLead.id, {
    name: updatedLead.name,
    email: updatedLead.email,
    updatedFields: Object.keys(data),
  });

  // Notify on status change
  if (data.status && data.status !== lead.status) {
    const statusLabel = formatStatusLabel(data.status);
    if (updatedLead.assignedUserId) {
      try {
        await notificationService.createNotification({
          userId: updatedLead.assignedUserId,
          title: 'Lead Status Updated',
          message: `Lead "${updatedLead.name}" moved to ${statusLabel}`,
          type: 'LEAD_STATUS_CHANGED',
          relatedId: updatedLead.id,
        });
      } catch {
        // Notification creation should not break the main operation
      }
    }
  }

  // Notify on assignment change
  if (
    data.assignedUserId &&
    data.assignedUserId !== lead.assignedUserId
  ) {
    await notifyAssignment(
      updatedLead.id,
      updatedLead.name,
      updatedLead.email,
      updatedLead.assignedUserId
    );
  }

  return updatedLead;
}

export async function deleteLead(id: string, userId?: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new Error('Lead not found');
  }

  await prisma.lead.delete({ where: { id } });

  await logActivity(userId, 'DELETED', id, {
    name: lead.name,
    email: lead.email,
  });
}

export async function getLeadsByStatus() {
  const leads = await prisma.lead.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { value: true },
  });

  return leads.map((group) => ({
    status: group.status,
    count: group._count.id,
    totalValue: Number(group._sum.value ?? 0),
  }));
}

export async function getDistinctSources() {
  const leads = await prisma.lead.findMany({
    select: { source: true },
    distinct: ['source'],
    orderBy: { source: 'asc' },
  });

  return leads.map((l) => l.source);
}
