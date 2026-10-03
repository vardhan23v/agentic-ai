"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { Activity } from "@/types";

export interface ActivityFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export interface ActivityHookResult {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  fetchActivities: (filters?: ActivityFilters) => Promise<void>;
}

interface ActivitiesResponse {
  success: boolean;
  data: Activity[];
}

function buildQueryParams(filters?: ActivityFilters): string {
  const params = new URLSearchParams();
  if (filters?.entityType) params.set("entityType", filters.entityType);
  if (filters?.entityId) params.set("entityId", filters.entityId);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));
  return params.toString();
}

export function useActivities(
  initialFilters?: ActivityFilters
): ActivityHookResult {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (filters?: ActivityFilters) => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQueryParams(filters);
      const response = await api.get<ActivitiesResponse>(
        `/activities${query ? `?${query}` : ""}`
      );
      setActivities(response.data.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch activities";
      setError(message);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await fetchActivities(initialFilters);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchActivities, initialFilters]);

  return {
    activities,
    loading,
    error,
    fetchActivities,
  };
}
