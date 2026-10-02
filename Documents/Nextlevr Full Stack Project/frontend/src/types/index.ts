export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  TEAM_MEMBER = "TEAM_MEMBER",
}

export enum ClientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PROSPECT = "PROSPECT",
}

export enum CampaignType {
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  SEO = "SEO",
  EMAIL_MARKETING = "EMAIL_MARKETING",
  PAID_ADVERTISING = "PAID_ADVERTISING",
  CONTENT_MARKETING = "CONTENT_MARKETING",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  PLANNED = "PLANNED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  CONVERTED = "CONVERTED",
  LOST = "LOST",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  COMPLETED = "COMPLETED",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  industry?: string | null;
  website?: string | null;
  status: ClientStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  clientId: string;
  description?: string | null;
  type: CampaignType;
  startDate: string;
  endDate: string;
  budget: string;
  status: CampaignStatus;
  targetAudience?: string | null;
  goals?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    company: string;
  };
  _count?: {
    leads: number;
    tasks: number;
  };
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  source: string;
  campaignId?: string | null;
  status: LeadStatus;
  value: string;
  assignedUserId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: string;
    name: string;
    type: CampaignType;
  } | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assignedUserId: string;
  clientId?: string | null;
  campaignId?: string | null;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithRelations extends Task {
  assignedUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  client?: {
    id: string;
    name: string;
    company: string;
  } | null;
  campaign?: {
    id: string;
    name: string;
    type: CampaignType;
  } | null;
}

export interface Activity {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  relatedId?: string | null;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}
