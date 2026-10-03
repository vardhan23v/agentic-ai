"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { z } from "zod";
import { toast } from "sonner";

// --- Zod schemas matching backend validators ---

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .max(5000, "Description is too long")
    .optional()
    .or(z.literal("")),
  assignedUserId: z.string().min(1, "Assigned user is required"),
  clientId: z.string().optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")),
  priority: z.nativeEnum(TaskPriority, {
    errorMap: () => ({ message: "Priority is required" }),
  }),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .optional(),
  description: z
    .string()
    .max(5000, "Description is too long")
    .optional()
    .or(z.literal("")),
  assignedUserId: z.string().optional(),
  clientId: z.string().optional().or(z.literal("")),
  campaignId: z.string().optional().or(z.literal("")),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: "Invalid task status" }),
  }),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;

// --- API response types ---

interface TasksResponse {
  success: boolean;
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TaskResponse {
  success: boolean;
  data: Task;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string;
  clientId?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// --- Query keys ---

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// --- API helpers ---

function buildTasksUrl(filters?: TaskFilters): string {
  const params = new URLSearchParams();

  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.assignedUserId) params.set("assignedUserId", filters.assignedUserId);
  if (filters?.clientId) params.set("clientId", filters.clientId);
  if (filters?.campaignId) params.set("campaignId", filters.campaignId);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  return `/tasks${queryString ? `?${queryString}` : ""}`;
}

async function fetchTasks(filters?: TaskFilters): Promise<Task[]> {
  const response = await api.get<TasksResponse>(buildTasksUrl(filters));
  return response.data.data;
}

async function createTask(data: CreateTaskInput): Promise<Task> {
  const response = await api.post<TaskResponse>("/tasks", data);
  return response.data.data;
}

async function updateTask({
  id,
  data,
}: {
  id: string;
  data: UpdateTaskInput;
}): Promise<Task> {
  const response = await api.put<TaskResponse>(`/tasks/${id}`, data);
  return response.data.data;
}

async function updateTaskStatus({
  id,
  data,
}: {
  id: string;
  data: UpdateTaskStatusInput;
}): Promise<Task> {
  const response = await api.patch<TaskResponse>(`/tasks/${id}/status`, data);
  return response.data.data;
}

async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

// --- Hooks ---

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: () => fetchTasks(),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success("Task created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.id),
      });
      toast.success("Task updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task");
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.id),
      });
      toast.success("Task status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update task status");
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success("Task deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete task");
    },
  });
}
