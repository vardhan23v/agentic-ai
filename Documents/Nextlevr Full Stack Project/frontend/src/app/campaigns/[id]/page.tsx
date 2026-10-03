"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import {
  Campaign,
  CampaignStatus,
  CampaignType,
  Lead,
  LeadStatus,
  Task,
  TaskStatus,
  TaskPriority,
  UserRole,
} from "@/types";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Goal,
  Users,
  TrendingUp,
CheckSquare,
  AlertCircle,
} from "lucide-react";

// --- Status/style maps ---

const CAMPAIGN_STATUS_STYLES: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]:
    "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  [CampaignStatus.PLANNED]:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  [CampaignStatus.ACTIVE]:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  [CampaignStatus.PAUSED]:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  [CampaignStatus.COMPLETED]:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
};

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: "Draft",
  [CampaignStatus.PLANNED]: "Planned",
  [CampaignStatus.ACTIVE]: "Active",
  [CampaignStatus.PAUSED]: "Paused",
  [CampaignStatus.COMPLETED]: "Completed",
};

const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  [CampaignType.SOCIAL_MEDIA]: "Social Media",
  [CampaignType.SEO]: "SEO",
  [CampaignType.EMAIL_MARKETING]: "Email Marketing",
  [CampaignType.PAID_ADVERTISING]: "Paid Advertising",
  [CampaignType.CONTENT_MARKETING]: "Content Marketing",
};

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  [LeadStatus.NEW]:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  [LeadStatus.CONTACTED]:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800",
  [LeadStatus.QUALIFIED]:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  [LeadStatus.PROPOSAL]:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
  [LeadStatus.CONVERTED]:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  [LeadStatus.LOST]:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "New",
  [LeadStatus.CONTACTED]: "Contacted",
  [LeadStatus.QUALIFIED]: "Qualified",
  [LeadStatus.PROPOSAL]: "Proposal",
  [LeadStatus.CONVERTED]: "Converted",
  [LeadStatus.LOST]: "Lost",
};

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]:
    "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  [TaskStatus.IN_PROGRESS]:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  [TaskStatus.REVIEW]:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  [TaskStatus.COMPLETED]:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.COMPLETED]: "Completed",
};

const TASK_PRIORITY_STYLES: Record<TaskPriority, string> = {
  [TaskPriority.LOW]:
    "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  [TaskPriority.MEDIUM]:
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  [TaskPriority.HIGH]:
    "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  [TaskPriority.URGENT]:
    "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};

const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.URGENT]: "Urgent",
};

// --- API response types ---

interface CampaignDetailResponse {
  success: boolean;
  data: Campaign;
}

interface LeadsResponse {
  success: boolean;
  data: Lead[];
}

interface TasksResponse {
  success: boolean;
  data: Task[];
}

// --- Component ---

export default function CampaignDetailPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}
    >
      <CampaignDetailContent />
    </ProtectedRoute>
  );
}

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLeadsLoading(true);
      setTasksLoading(true);
      setError(null);
      try {
        const [campaignResponse, leadsResponse, tasksResponse] = await Promise.all([
          api.get<CampaignDetailResponse>(`/campaigns/${id}`),
          api.get<LeadsResponse>(`/leads?campaignId=${id}&limit=50`).catch(() => null),
          api.get<TasksResponse>(`/tasks?campaignId=${id}&limit=50`).catch(() => null),
        ]);
        if (!cancelled) {
          setCampaign(campaignResponse.data.data);
          setLeads(leadsResponse?.data.data ?? []);
          setTasks(tasksResponse?.data.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch campaign");
          setCampaign(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLeadsLoading(false);
          setTasksLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatBudget = (budget: string) => {
    const num = parseFloat(budget);
    if (isNaN(num)) return "$0";
    return "$" + num.toLocaleString();
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="group -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <TrendingUp className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-card-foreground">
            {error ? "Error loading campaign" : "Campaign not found"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error || "The campaign you are looking for does not exist."}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/campaigns" as never)}
            className="mt-4"
          >
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/campaigns" as never)}
        className="group -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Campaigns
      </Button>

      {/* Campaign header card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">
              {campaign.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {CAMPAIGN_TYPE_LABELS[campaign.type]}
              {campaign.client && (
                <>
                  {" · "}
                  <span className="font-medium">{campaign.client.name}</span>
                  {" ("}
                  {campaign.client.company}
                  {")"}
                </>
              )}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${CAMPAIGN_STATUS_STYLES[campaign.status]}`}
          >
            {CAMPAIGN_STATUS_LABELS[campaign.status]}
          </span>
        </div>

        {/* Stats cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="truncate text-sm font-medium text-card-foreground">
                {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <DollarSign className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="truncate text-sm font-medium text-card-foreground">
                {formatBudget(campaign.budget)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Leads</p>
              <p className="truncate text-sm font-medium text-card-foreground">
                {campaign._count?.leads ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <CheckSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="truncate text-sm font-medium text-card-foreground">
                {campaign._count?.tasks ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {campaign.description && (
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Description
            </p>
            <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">
              {campaign.description}
            </p>
          </div>
        )}

        {/* Target Audience & Goals */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {campaign.targetAudience && (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <Target className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Target Audience
                </p>
                <p className="mt-1 text-sm text-card-foreground">
                  {campaign.targetAudience}
                </p>
              </div>
            </div>
          )}

          {campaign.goals && (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <Goal className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  Goals
                </p>
                <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">
                  {campaign.goals}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leads & Tasks sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-card-foreground">
              Leads
            </h2>
            {!leadsLoading && (
              <span className="ml-auto text-sm text-muted-foreground">
                {leads.length}
              </span>
            )}
          </div>

          {leadsLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No leads yet for this campaign.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-card-foreground">
                      {lead.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.email}
                      {lead.company && ` · ${lead.company}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ${Number(lead.value).toLocaleString()}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEAD_STATUS_STYLES[lead.status]}`}
                    >
                      {LEAD_STATUS_LABELS[lead.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-card-foreground">
              Tasks
            </h2>
            {!tasksLoading && (
              <span className="ml-auto text-sm text-muted-foreground">
                {tasks.length}
              </span>
            )}
          </div>

          {tasksLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10">
              <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No tasks yet for this campaign.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {tasks.map((task) => {
                const isOverdue =
                  task.status !== TaskStatus.COMPLETED &&
                  new Date(task.dueDate) < new Date();

                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-card-foreground">
                          {task.title}
                        </p>
                        {isOverdue && (
                          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TASK_STATUS_STYLES[task.status]}`}
                        >
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TASK_PRIORITY_STYLES[task.priority]}`}
                        >
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Due {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}