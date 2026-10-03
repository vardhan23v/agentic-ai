"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { User, UserRole } from "@/types";
import { z } from "zod";
import { toast } from "sonner";

// --- Zod schemas matching backend validators ---

export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Invalid user role" }),
  }),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .optional()
    .or(z.literal("")),
  role: z
    .nativeEnum(UserRole, {
      errorMap: () => ({ message: "Invalid user role" }),
    })
    .optional(),
  disabled: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// --- API response types ---

interface UsersResponse {
  success: boolean;
  data: User[];
}

interface UserResponse {
  success: boolean;
  data: User;
}

// --- Query keys ---

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (role?: UserRole) => [...userKeys.lists(), { role }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// --- API helpers ---

async function fetchUsers(role?: UserRole): Promise<User[]> {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  const queryString = params.toString();
  const url = `/users${queryString ? `?${queryString}` : ""}`;
  const response = await api.get<UsersResponse>(url);
  return response.data.data;
}

async function createUser(data: CreateUserInput): Promise<User> {
  const response = await api.post<UserResponse>("/users", data);
  return response.data.data;
}

async function updateUser({
  id,
  data,
}: {
  id: string;
  data: UpdateUserInput;
}): Promise<User> {
  const response = await api.put<UserResponse>(`/users/${id}`, data);
  return response.data.data;
}

async function disableUser(id: string): Promise<User> {
  const response = await api.delete<UserResponse>(`/users/${id}`);
  return response.data.data;
}

// --- Hooks ---

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => fetchUsers(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User disabled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable user");
    },
  });
}
