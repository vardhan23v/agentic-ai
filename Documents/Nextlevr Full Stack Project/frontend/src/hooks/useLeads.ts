"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { Lead, LeadStatus } from "@/types";
import { z } from "zod";
import { toast } from "sonner";

// --- Zod schemas matching backend validators ---

export const CreateLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  company: z.string().max(200, "Company name is too long").optional().or(z.literal("")),
  source: z.string().min(1, "Source is required").max(100, "Source is too long"),
  campaignId: z.string().uuid("Invalid campaign ID").optional().or(z.literal("")),
  status: z.nativeEnum(LeadStatus).optional(),
  value: z.number().min(0, "Value must be non-negative").optional(),
  assignedUserId: z.string().uuid("Invalid user ID").optional().or(z.literal("")),
  notes: z.string().max(5000, "Notes are too long").optional().or(z.literal("")),
});

export const UpdateLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().max(30, "Phone number is too long").optional().or(z.literal("")),
  company: z.string().max(200, "Company name is too long").optional().or(z.literal("")),
  source: z.string().min(1, "Source is required").max(100, "Source is too long").optional(),
  campaignId: z.string().uuid("Invalid campaign ID").optional().or(z.literal("")),
  status: z.nativeEnum(LeadStatus).optional(),
  value: z.number().min(0, "Value must be non-negative").optional(),
  assignedUserId: z.string().uuid("Invalid user ID").optional().or(z.literal("")),
  notes: z.string().max(5000, "Notes are too long").optional().or(z.literal("")),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

// --- API response types ---

interface LeadsResponse {
  success: boolean;
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LeadResponse {
  success: boolean;
  data: Lead;
}

interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  source?: string;
  campaignId?: string;
  assignedUserId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface LeadHookResult {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  createLead: (data: CreateLeadInput) => Promise<void>;
  updateLead: (id: string, data: UpdateLeadInput) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
}

// --- Hook ---

export function useLeads(): LeadHookResult {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchLeads = useCallback(async (filters?: LeadFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters?.search) params.set("search", filters.search);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.source) params.set("source", filters.source);
      if (filters?.campaignId) params.set("campaignId", filters.campaignId);
      if (filters?.assignedUserId) params.set("assignedUserId", filters.assignedUserId);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.sortBy) params.set("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      const url = `/leads${queryString ? `?${queryString}` : ""}`;

      const response = await api.get<LeadsResponse>(url);

      setLeads(response.data.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch leads";
      setError(message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLead = useCallback(async (data: CreateLeadInput) => {
    setError(null);

    try {
      const response = await api.post<LeadResponse>("/leads", data);
      setLeads((prev) => [...prev, response.data.data]);
      toast.success("Lead created successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create lead";
      toast.error(message);
      throw err;
    }
  }, []);

  const updateLead = useCallback(async (id: string, data: UpdateLeadInput) => {
    setError(null);

    try {
      const response = await api.put<LeadResponse>(`/leads/${id}`, data);
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? response.data.data : l))
      );
      toast.success("Lead updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update lead";
      toast.error(message);
      throw err;
    }
  }, []);

  const updateLeadStatus = useCallback(async (id: string, status: LeadStatus) => {
    setError(null);

    try {
      const response = await api.patch<LeadResponse>(`/leads/${id}/status`, { status });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? response.data.data : l))
      );
      toast.success("Lead status updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update lead status";
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setError(null);

    try {
      await api.delete(`/leads/${id}`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete lead";
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
        const response = await api.get<LeadsResponse>("/leads");
        if (!cancelled) {
          setLeads(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch leads");
          setLeads([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    leads,
    loading,
    error,
    pagination,
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
  };
}
