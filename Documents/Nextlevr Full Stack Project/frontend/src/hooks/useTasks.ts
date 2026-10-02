"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { TaskWithRelations, TaskPriority, TaskStatus } from "@/types";
import { z } from "zod";

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
  data: TaskWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TaskResponse {
  success: boolean;
  data: TaskWithRelations;
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

// --- Hook ---

export interface TaskHookResult {
  tasks: TaskWithRelations[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
  updateTaskStatus: (id: string, data: UpdateTaskStatusInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useTasks(): TaskHookResult {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchTasks = useCallback(async (filters?: TaskFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.priority) params.set("priority", filters.priority);
      if (filters?.assignedUserId)
        params.set("assignedUserId", filters.assignedUserId);
      if (filters?.clientId) params.set("clientId", filters.clientId);
      if (filters?.campaignId) params.set("campaignId", filters.campaignId);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.sortBy) params.set("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      const url = `/tasks${queryString ? `?${queryString}` : ""}`;

      const response = await api.get<TasksResponse>(url);

      setTasks(response.data.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch tasks";
      setError(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (data: CreateTaskInput) => {
    setError(null);

    const response = await api.post<TaskResponse>("/tasks", data);
    setTasks((prev) => [response.data.data, ...prev]);
  }, []);

  const updateTask = useCallback(
    async (id: string, data: UpdateTaskInput) => {
      setError(null);

      const response = await api.put<TaskResponse>(`/tasks/${id}`, data);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? response.data.data : t))
      );
    },
    []
  );

  const updateTaskStatus = useCallback(
    async (id: string, data: UpdateTaskStatusInput) => {
      setError(null);

      const response = await api.patch<TaskResponse>(`/tasks/${id}/status`, data);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? response.data.data : t))
      );
    },
    []
  );

  const deleteTask = useCallback(async (id: string) => {
    setError(null);

    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await fetchTasks();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  };
}
