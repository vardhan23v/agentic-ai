import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { UserRole } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeUser = Omit<
  Awaited<ReturnType<typeof prisma.user.findUnique>>,
  'passwordHash'
>;

export async function register(data: RegisterInput): Promise<SafeUser> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role || UserRole.TEAM_MEMBER,
    },
    select: USER_SELECT,
  });

  return user;
}

export async function login(
  data: LoginInput
): Promise<{ token: string; user: SafeUser }> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  if (user.disabled) {
    throw new Error('Account has been disabled. Please contact an administrator.');
  }

  const token = generateToken({ sub: user.id, email: user.email, role: user.role });

  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: USER_SELECT,
  });

  if (!safeUser) {
    throw new Error('User not found');
  }

  return { token, user: safeUser };
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
