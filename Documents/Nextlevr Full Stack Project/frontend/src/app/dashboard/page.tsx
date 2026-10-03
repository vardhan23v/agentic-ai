"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { CampaignChart } from "@/components/dashboard/CampaignChart";
import { LeadChart } from "@/components/dashboard/LeadChart";
import { TaskChart } from "@/components/dashboard/TaskChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}
    >
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const {
    stats,
    revenue,
    campaignData,
    leadData,
    taskData,
    loading,
    error,
    fetchAnalytics,
  } = useAnalytics();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name ?? "User"}. Here&apos;s what&apos;s
            happening today.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchAnalytics()}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button
            onClick={() => fetchAnalytics()}
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-2" />
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!loading && (
        <div className="space-y-6">
          <StatsCards stats={stats} revenue={revenue} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CampaignChart data={campaignData} />
            <LeadChart data={leadData} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TaskChart data={taskData} />
            </div>
            <RecentActivity />
          </div>
        </div>
      )}
    </div>
  );
}
