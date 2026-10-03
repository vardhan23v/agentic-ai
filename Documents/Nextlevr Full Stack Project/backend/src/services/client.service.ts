import { prisma } from '../config/database';
import { CreateClientInput, UpdateClientInput, ClientFilters } from '../validators/client.validator';
import { Prisma } from '@prisma/client';
import * as activityService from './activity.service';

const CLIENT_INCLUDE = {
  campaigns: {
    select: {
      id: true,
      name: true,
      status: true,
      type: true,
    },
  },
  _count: {
    select: {
      campaigns: true,
      tasks: true,
    },
  },
} as const;

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
      entityType: 'CLIENT',
      entityId,
      metadata,
    });
  } catch {
    // Activity logging should not break the main operation
  }
}

export async function getClients(filters: ClientFilters) {
  const {
    search,
    status,
    industry,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: Prisma.ClientWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { industry: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (industry) {
    where.industry = { equals: industry, mode: 'insensitive' };
  }

  const skip = (page - 1) * limit;

  const allowedSortFields = ['name', 'company', 'email', 'status', 'industry', 'createdAt', 'updatedAt'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: CLIENT_INCLUDE,
      skip,
      take: limit,
      orderBy: { [sortField]: orderDirection },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: CLIENT_INCLUDE,
  });
}

export async function createClient(data: CreateClientInput, userId?: string) {
  const existingClient = await prisma.client.findFirst({
    where: { email: data.email },
  });

  if (existingClient) {
    throw new Error('A client with this email already exists');
  }

  const client = await prisma.client.create({
    data: {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone ?? null,
      industry: data.industry ?? null,
      website: data.website ?? null,
      status: data.status ?? 'ACTIVE',
      notes: data.notes ?? null,
    },
    include: CLIENT_INCLUDE,
  });

  await logActivity(userId, 'CREATED', client.id, {
    name: client.name,
    company: client.company,
  });

  return client;
}

export async function updateClient(id: string, data: UpdateClientInput, userId?: string) {
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    throw new Error('Client not found');
  }

  if (data.email && data.email !== client.email) {
    const existingClient = await prisma.client.findFirst({
      where: { email: data.email },
    });

    if (existingClient) {
      throw new Error('A client with this email already exists');
    }
  }

  const updatedClient = await prisma.client.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.industry !== undefined && { industry: data.industry }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: CLIENT_INCLUDE,
  });

  await logActivity(userId, 'UPDATED', updatedClient.id, {
    name: updatedClient.name,
    company: updatedClient.company,
    updatedFields: Object.keys(data),
  });

  return updatedClient;
}

export async function deleteClient(id: string, userId?: string) {
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    throw new Error('Client not found');
  }

  await prisma.client.delete({ where: { id } });

  await logActivity(userId, 'DELETED', id, {
    name: client.name,
    company: client.company,
  });
}

export async function getDistinctIndustries() {
  const clients = await prisma.client.findMany({
    select: { industry: true },
    where: { industry: { not: null } },
    distinct: ['industry'],
    orderBy: { industry: 'asc' },
  });

  return clients.map((c) => c.industry).filter(Boolean) as string[];
}

export async function getClientCampaigns(clientId: string) {
  return prisma.campaign.findMany({
    where: { clientId },
    orderBy: { startDate: 'desc' },
  });
}
