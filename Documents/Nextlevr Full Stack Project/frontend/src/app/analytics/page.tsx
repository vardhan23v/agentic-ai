"use client";

import { useState, useCallback, JSX } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { useClients } from "@/hooks/useClients";
import { useCampaigns } from "@/hooks/useCampaigns";
import { AnalyticsFilters } from "@/hooks/useAnalytics";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar, Building2, Megaphone, RotateCcw } from "lucide-react";

export default function AnalyticsPage(): JSX.Element {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

function AnalyticsContent(): JSX.Element {
  const { clients, loading: clientsLoading } = useClients();
  const { campaigns, loading: campaignsLoading } = useCampaigns();

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateFrom: thirtyDaysAgo.toISOString().split("T")[0],
    dateTo: today.toISOString().split("T")[0],
    clientId: undefined,
    campaignId: undefined,
  });

  const handleFilterChange = useCallback(
    (key: keyof AnalyticsFilters, value: string | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === "" ? undefined : value,
      }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setFilters({
      dateFrom: undefined,
      dateTo: undefined,
      clientId: undefined,
      campaignId: undefined,
    });
  }, []);

  const isLoading = clientsLoading || campaignsLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore performance metrics, trends, and campaign insights.
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} className="shrink-0">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Filters
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date From */}
          <div className="space-y-2">
            <label
              htmlFor="dateFrom"
              className="flex items-center gap-1.5 text-sm font-medium text-card-foreground"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              From
            </label>
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                handleFilterChange("dateFrom", e.target.value || undefined)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <label
              htmlFor="dateTo"
              className="flex items-center gap-1.5 text-sm font-medium text-card-foreground"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              To
            </label>
            <input
              id="dateTo"
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                handleFilterChange("dateTo", e.target.value || undefined)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Client Select */}
          <div className="space-y-2">
            <label
              htmlFor="clientId"
              className="flex items-center gap-1.5 text-sm font-medium text-card-foreground"
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Client
            </label>
            <select
              id="clientId"
              value={filters.clientId ?? ""}
              onChange={(e) =>
                handleFilterChange("clientId", e.target.value || undefined)
              }
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Select */}
          <div className="space-y-2">
            <label
              htmlFor="campaignId"
              className="flex items-center gap-1.5 text-sm font-medium text-card-foreground"
            >
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              Campaign
            </label>
            <select
              id="campaignId"
              value={filters.campaignId ?? ""}
              onChange={(e) =>
                handleFilterChange("campaignId", e.target.value || undefined)
              }
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts filters={filters} />
    </div>
  );
}
