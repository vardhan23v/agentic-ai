"use client";

import { JSX } from "react";
import { useActivities } from "@/hooks/useActivities";
import { Activity } from "@/types";
import {
  UserPlus,
  FileText,
  Megaphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  CLIENT: <UserPlus className="h-4 w-4" />,
  CAMPAIGN: <Megaphone className="h-4 w-4" />,
  LEAD: <FileText className="h-4 w-4" />,
  TASK: <CheckCircle className="h-4 w-4" />,
};

const ENTITY_COLORS: Record<string, string> = {
  CLIENT:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CAMPAIGN:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  LEAD:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  TASK:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const ACTION_LABELS: Record<string, string> = {
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",
  STATUS_CHANGED: "changed status of",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getActivityDescription(activity: Activity): string {
  const action =
    ACTION_LABELS[activity.action] ?? activity.action.toLowerCase();
  const entity = activity.entityType.toLowerCase();
  const title =
    (activity.metadata?.title as string) ??
    (activity.metadata?.name as string) ??
    activity.entityId ??
    "item";

  return `${action} ${entity} "${title}"`;
}

export function RecentActivity(): JSX.Element {
  const { activities, loading, error, fetchActivities } = useActivities({
    limit: 10,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">
            Recent Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest events across the platform
          </p>
        </div>
        <button
          onClick={() => fetchActivities({ limit: 10 })}
          disabled={loading}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Refresh activity"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading && activities.length === 0 ? (
          <div className="space-y-0 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 pb-5 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  <div className="mt-1 h-full w-px animate-pulse bg-muted" />
                </div>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>No recent activity found.</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                {index !== activities.length - 1 && (
                  <div className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px bg-border" />
                )}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    ENTITY_COLORS[activity.entityType] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {ENTITY_ICONS[activity.entityType] ?? (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-sm font-medium text-card-foreground">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
