import { prisma } from '../config/database';
import { Prisma, UserRole } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  disabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

export async function getUsers(role?: UserRole): Promise<SafeUser[]> {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    select: USER_SELECT,
    orderBy: { name: 'asc' },
  });
}

export async function getUserById(id: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function createUser(data: CreateUserInput): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
      disabled: false,
    },
    select: USER_SELECT,
  });
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  if (data.email && data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailTaken) {
      throw new Error('An account with this email already exists');
    }
  }

  const updateData: {
    name?: string;
    email?: string;
    role?: typeof data.role;
    disabled?: boolean;
    passwordHash?: string;
  } = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.disabled !== undefined) updateData.disabled = data.disabled;

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No fields provided for update');
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT,
  });
}

export async function disableUser(id: string): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  return prisma.user.update({
    where: { id },
    data: { disabled: true },
    select: USER_SELECT,
  });
}
