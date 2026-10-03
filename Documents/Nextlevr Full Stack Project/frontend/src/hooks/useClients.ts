"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { Client, ClientStatus } from "@/types";
import { z } from "zod";
import { toast } from "sonner";

// --- Zod schemas matching backend validators ---

export const CreateClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  company: z.string().min(1, "Company is required").max(200, "Company name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  industry: z.string().max(100, "Industry is too long").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").max(500, "Website URL is too long").optional().or(z.literal("")),
  status: z.nativeEnum(ClientStatus).optional(),
  notes: z.string().max(2000, "Notes are too long").optional().or(z.literal("")),
});

export const UpdateClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long").optional(),
  company: z.string().min(1, "Company is required").max(200, "Company name is too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  industry: z.string().max(100, "Industry is too long").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").max(500, "Website URL is too long").optional().or(z.literal("")),
  status: z.nativeEnum(ClientStatus).optional(),
  notes: z.string().max(2000, "Notes are too long").optional().or(z.literal("")),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

// --- API response types ---

interface ClientsResponse {
  success: boolean;
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ClientResponse {
  success: boolean;
  data: Client;
}

interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  industry?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// --- Hook ---

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchClients = useCallback(async (filters?: ClientFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.industry) params.set("industry", filters.industry);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.sortBy) params.set("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      const url = `/clients${queryString ? `?${queryString}` : ""}`;

      const response = await api.get<ClientsResponse>(url);

      setClients(response.data.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch clients";
      setError(message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (data: CreateClientInput) => {
    setError(null);

    try {
      const response = await api.post<ClientResponse>("/clients", data);
      setClients((prev) => [...prev, response.data.data]);
      toast.success("Client created successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create client";
      toast.error(message);
      throw err;
    }
  }, []);

  const updateClient = useCallback(async (id: string, data: UpdateClientInput) => {
    setError(null);

    try {
      const response = await api.put<ClientResponse>(`/clients/${id}`, data);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? response.data.data : c))
      );
      toast.success("Client updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update client";
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setError(null);

    try {
      await api.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Client deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete client";
      toast.error(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<ClientsResponse>("/clients");
        if (!cancelled) {
          setClients(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch clients");
          setClients([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}