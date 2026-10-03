"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { Activity } from "@/types";

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  campaignId?: string;
}

export interface DashboardStats {
  totalClients: number;
  activeCampaigns: number;
  leadsGenerated: number;
  tasksPending: number;
  conversionRate: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  clientName: string;
  budget: number;
  leadsCount: number;
  totalLeadsValue: number;
  conversionRate: number;
  status: string;
}

export interface LeadTrend {
  month: string;
  leads: number;
  converted: number;
  conversionRate: number;
}

export interface RevenueStats {
  totalValue: number;
  convertedValue: number;
  averageValue: number;
}

export interface ClientGrowth {
  month: string;
  clients: number;
}

export interface LeadStatusDistribution {
  status: string;
  count: number;
}

export interface TaskStatusCount {
  status: string;
  count: number;
}

export interface TaskPriorityCount {
  priority: string;
  count: number;
}

export interface TaskStats {
  byStatus: TaskStatusCount[];
  byPriority: TaskPriorityCount[];
}

interface DashboardResponse {
  success: boolean;
  data: DashboardStats;
}

interface CampaignPerformanceResponse {
  success: boolean;
  data: CampaignPerformance[];
}

interface LeadTrendsResponse {
  success: boolean;
  data: LeadTrend[];
}

interface RevenueResponse {
  success: boolean;
  data: RevenueStats;
}

interface ClientGrowthResponse {
  success: boolean;
  data: ClientGrowth[];
}

interface LeadStatusDistributionResponse {
  success: boolean;
  data: LeadStatusDistribution[];
}

interface TaskStatsResponse {
  success: boolean;
  data: TaskStats;
}

interface ActivitiesResponse {
  success: boolean;
  data: Activity[];
}

export interface AnalyticsHookResult {
  stats: DashboardStats | null;
  revenue: RevenueStats | null;
  campaignData: CampaignPerformance[];
  leadData: LeadTrend[];
  clientGrowth: ClientGrowth[];
  leadStatusDistribution: LeadStatusDistribution[];
  taskData: TaskStats | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
  fetchAnalytics: (filters?: AnalyticsFilters) => Promise<void>;
}

function buildQueryParams(filters?: AnalyticsFilters): string {
  const params = new URLSearchParams();
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.clientId) params.set("clientId", filters.clientId);
  if (filters?.campaignId) params.set("campaignId", filters.campaignId);
  return params.toString();
}

export function useAnalytics(
  initialFilters?: AnalyticsFilters
): AnalyticsHookResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignPerformance[]>([]);
  const [leadData, setLeadData] = useState<LeadTrend[]>([]);
  const [clientGrowth, setClientGrowth] = useState<ClientGrowth[]>([]);
  const [leadStatusDistribution, setLeadStatusDistribution] = useState<LeadStatusDistribution[]>([]);
  const [taskData, setTaskData] = useState<TaskStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (filters?: AnalyticsFilters) => {
    setLoading(true);
    setError(null);

    const query = buildQueryParams(filters);

    try {
      const [
        dashboardRes,
        campaignsRes,
        leadsRes,
        revenueRes,
        clientGrowthRes,
        leadStatusRes,
        tasksRes,
        activitiesRes,
      ] = await Promise.all([
        api.get<DashboardResponse>(`/analytics/dashboard${query ? `?${query}` : ""}`),
        api.get<CampaignPerformanceResponse>(`/analytics/campaigns${query ? `?${query}` : ""}`),
        api.get<LeadTrendsResponse>(`/analytics/leads${query ? `?${query}` : ""}`),
        api.get<RevenueResponse>(`/analytics/revenue${query ? `?${query}` : ""}`),
        api.get<ClientGrowthResponse>(`/analytics/clients/growth${query ? `?${query}` : ""}`),
        api.get<LeadStatusDistributionResponse>(`/analytics/leads/status${query ? `?${query}` : ""}`),
        api.get<TaskStatsResponse>("/tasks/stats"),
        api.get<ActivitiesResponse>("/activities?limit=10").catch(() => null),
      ]);

      setStats(dashboardRes.data.data);
      setCampaignData(campaignsRes.data.data);
      setLeadData(leadsRes.data.data);
      setRevenue(revenueRes.data.data);
      setClientGrowth(clientGrowthRes.data.data);
      setLeadStatusDistribution(leadStatusRes.data.data);
      setTaskData(tasksRes.data.data);
      setActivities(activitiesRes?.data.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch analytics";
      setError(message);
      setStats(null);
      setRevenue(null);
      setCampaignData([]);
      setLeadData([]);
      setClientGrowth([]);
      setLeadStatusDistribution([]);
      setTaskData(null);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await fetchAnalytics(initialFilters);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAnalytics, initialFilters]);

  return {
    stats,
    revenue,
    campaignData,
    leadData,
    clientGrowth,
    leadStatusDistribution,
    taskData,
    activities,
    loading,
    error,
    fetchAnalytics,
  };
}
