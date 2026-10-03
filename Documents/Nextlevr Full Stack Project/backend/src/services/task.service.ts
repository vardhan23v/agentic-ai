import { prisma } from '../config/database';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
} from '../validators/task.validator';
import { Prisma, TaskStatus } from '@prisma/client';
import * as activityService from './activity.service';
import * as notificationService from './notification.service';

const TASK_INCLUDE = {
  assignedUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  client: {
    select: {
      id: true,
      name: true,
      company: true,
    },
  },
  campaign: {
    select: {
      id: true,
      name: true,
      type: true,
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
      entityType: 'TASK',
      entityId,
      metadata,
    });
  } catch {
    // Activity logging should not break the main operation
  }
}

async function notifyAssignment(
  taskId: string,
  taskTitle: string,
  assignedUserId: string
): Promise<void> {
  try {
    await notificationService.createNotification({
      userId: assignedUserId,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${taskTitle}"`,
      type: 'TASK_ASSIGNED',
      relatedId: taskId,
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

export async function getTasks(filters: TaskFilters) {
  const {
    search,
    status,
    priority,
    assignedUserId,
    clientId,
    campaignId,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const where: Prisma.TaskWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assignedUserId) {
    where.assignedUserId = assignedUserId;
  }

  if (clientId) {
    where.clientId = clientId;
  }

  if (campaignId) {
    where.campaignId = campaignId;
  }

  const skip = (page - 1) * limit;

  const allowedSortFields = [
    'title',
    'priority',
    'status',
    'dueDate',
    'createdAt',
    'updatedAt',
  ];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      skip,
      take: limit,
      orderBy: { [sortField]: orderDirection },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: TASK_INCLUDE,
  });
}

export async function createTask(data: CreateTaskInput, userId?: string) {
  // Validate assigned user exists
  const user = await prisma.user.findUnique({
    where: { id: data.assignedUserId },
  });

  if (!user) {
    throw new Error('Assigned user not found');
  }

  // Validate client if provided
  if (data.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }
  }

  // Validate campaign if provided
  if (data.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      assignedUserId: data.assignedUserId,
      clientId: data.clientId ?? null,
      campaignId: data.campaignId ?? null,
      priority: data.priority ?? 'MEDIUM',
      dueDate: new Date(data.dueDate),
      status: data.status ?? 'TODO',
    },
    include: TASK_INCLUDE,
  });

  await logActivity(userId, 'CREATED', task.id, {
    title: task.title,
    priority: task.priority,
    status: task.status,
  });

  await notifyAssignment(task.id, task.title, task.assignedUserId);

  return task;
}

export async function updateTask(
  id: string,
  data: UpdateTaskInput,
  userId?: string
) {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    throw new Error('Task not found');
  }

  // Validate assigned user if being changed
  if (data.assignedUserId && data.assignedUserId !== task.assignedUserId) {
    const user = await prisma.user.findUnique({
      where: { id: data.assignedUserId },
    });

    if (!user) {
      throw new Error('Assigned user not found');
    }
  }

  // Validate client if being changed
  if (data.clientId && data.clientId !== task.clientId) {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }
  }

  // Validate campaign if being changed
  if (data.campaignId && data.campaignId !== task.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.assignedUserId !== undefined && { assignedUserId: data.assignedUserId }),
      ...(data.clientId !== undefined && { clientId: data.clientId }),
      ...(data.campaignId !== undefined && { campaignId: data.campaignId }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: TASK_INCLUDE,
  });

  await logActivity(userId, 'UPDATED', updatedTask.id, {
    title: updatedTask.title,
    updatedFields: Object.keys(data),
  });

  // Notify on status change
  if (data.status && data.status !== task.status) {
    const statusLabel = formatStatusLabel(data.status);
    try {
      await notificationService.createNotification({
        userId: updatedTask.assignedUserId,
        title: 'Task Status Updated',
        message: `Task "${updatedTask.title}" moved to ${statusLabel}`,
        type: 'TASK_STATUS_CHANGED',
        relatedId: updatedTask.id,
      });
    } catch {
      // Notification creation should not break the main operation
    }

    await logActivity(userId, 'STATUS_CHANGED', updatedTask.id, {
      title: updatedTask.title,
      oldStatus: task.status,
      newStatus: data.status,
    });
  }

  // Notify on assignment change
  if (
    data.assignedUserId &&
    data.assignedUserId !== task.assignedUserId
  ) {
    await notifyAssignment(
      updatedTask.id,
      updatedTask.title,
      updatedTask.assignedUserId
    );
  }

  return updatedTask;
}

export async function deleteTask(id: string, userId?: string) {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    throw new Error('Task not found');
  }

  await prisma.task.delete({ where: { id } });

  await logActivity(userId, 'DELETED', id, {
    title: task.title,
  });
}

export async function getTasksByStatus() {
  const tasks = await prisma.task.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return tasks.map((group) => ({
    status: group.status,
    count: group._count.id,
  }));
}

export async function getTasksByPriority() {
  const tasks = await prisma.task.groupBy({
    by: ['priority'],
    _count: { id: true },
  });

  return tasks.map((group) => ({
    priority: group.priority,
    count: group._count.id,
  }));
}
