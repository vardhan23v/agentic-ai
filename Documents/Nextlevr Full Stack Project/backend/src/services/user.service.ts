import { prisma } from '../config/database';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeUser = Awaited<ReturnType<typeof listUsers>>[number];

export async function listUsers() {
  return prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { name: 'asc' },
  });
}
