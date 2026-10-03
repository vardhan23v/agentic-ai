import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export interface CreateActivityInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityQuery {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
}

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function createActivity(data: CreateActivityInput) {
  return prisma.activity.create({
    data: {
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      metadata: data.metadata
        ? (data.metadata as unknown as Prisma.InputJsonValue)
        : undefined,
    },
    include: {
      user: {
        select: USER_SELECT,
      },
    },
  });
}

export async function getActivities(query: ActivityQuery = {}) {
  const {
    userId,
    entityType,
    entityId,
    action,
    limit = 50,
    offset = 0,
    orderBy = 'desc',
  } = query;

  const where: Prisma.ActivityWhereInput = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;

  return prisma.activity.findMany({
    where,
    include: {
      user: {
        select: USER_SELECT,
      },
    },
    take: limit,
    skip: offset,
    orderBy: { createdAt: orderBy },
  });
}
