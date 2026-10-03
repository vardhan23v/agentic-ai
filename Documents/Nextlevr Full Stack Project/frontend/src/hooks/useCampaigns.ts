"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { Campaign, CampaignType, CampaignStatus } from "@/types";
import { z } from "zod";
import { toast } from "sonner";

// --- Zod schemas matching backend validators ---

export const CreateCampaignSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200, "Name is too long"),
    clientId: z.string().min(1, "Client is required"),
    description: z
      .string()
      .max(2000, "Description is too long")
      .optional()
      .or(z.literal("")),
    type: z.nativeEnum(CampaignType, {
      errorMap: () => ({ message: "Campaign type is required" }),
    }),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    budget: z.string().min(1, "Budget is required"),
    status: z.nativeEnum(CampaignStatus).optional(),
    targetAudience: z
      .string()
      .max(1000, "Target audience is too long")
      .optional()
      .or(z.literal("")),
    goals: z
      .string()
      .max(2000, "Goals are too long")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export const UpdateCampaignSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name is too long")
      .optional(),
    clientId: z.string().min(1, "Client is required").optional(),
    description: z
      .string()
      .max(2000, "Description is too long")
      .optional()
      .or(z.literal("")),
    type: z.nativeEnum(CampaignType).optional(),
    startDate: z.string().min(1, "Start date is required").optional(),
    endDate: z.string().min(1, "End date is required").optional(),
    budget: z.string().min(1, "Budget is required").optional(),
    status: z.nativeEnum(CampaignStatus).optional(),
    targetAudience: z
      .string()
      .max(1000, "Target audience is too long")
      .optional()
      .or(z.literal("")),
    goals: z
      .string()
      .max(2000, "Goals are too long")
      .optional()
      .or(z.literal("")),
  });

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

// --- API response types ---

interface CampaignsResponse {
  success: boolean;
  data: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CampaignResponse {
  success: boolean;
  data: Campaign;
}

interface CampaignFilters {
  search?: string;
  clientId?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// --- Hook ---

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCampaigns = useCallback(async (filters?: CampaignFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters?.search) params.set("search", filters.search);
      if (filters?.clientId) params.set("clientId", filters.clientId);
      if (filters?.type) params.set("type", filters.type);
      if (filters?.status) params.set("status", filters.status);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.sortBy) params.set("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      const url = `/campaigns${queryString ? `?${queryString}` : ""}`;

      const response = await api.get<CampaignsResponse>(url);

      setCampaigns(response.data.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch campaigns";
      setError(message);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCampaign = useCallback(async (data: CreateCampaignInput) => {
    setError(null);

    try {
      const response = await api.post<CampaignResponse>("/campaigns", data);
      setCampaigns((prev) => [...prev, response.data.data]);
      toast.success("Campaign created successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create campaign";
      toast.error(message);
      throw err;
    }
  }, []);

  const updateCampaign = useCallback(
    async (id: string, data: UpdateCampaignInput) => {
      setError(null);

      try {
        const response = await api.put<CampaignResponse>(
          `/campaigns/${id}`,
          data
        );
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? response.data.data : c))
        );
        toast.success("Campaign updated successfully");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update campaign";
        toast.error(message);
        throw err;
      }
    },
    []
  );

  const deleteCampaign = useCallback(async (id: string) => {
    setError(null);

    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campaign deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete campaign";
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
        const response = await api.get<CampaignsResponse>("/campaigns");
        if (!cancelled) {
          setCampaigns(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch campaigns");
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    campaigns,
    loading,
    error,
    pagination,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
}