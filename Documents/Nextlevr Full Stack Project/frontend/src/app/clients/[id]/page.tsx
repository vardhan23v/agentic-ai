"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Client, Campaign, CampaignStatus, UserRole } from "@/types";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Building2,
  Calendar,
  TrendingUp,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  INACTIVE: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  PROSPECT: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
};

const CAMPAIGN_STATUS_STYLES: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800",
  [CampaignStatus.PLANNED]: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  [CampaignStatus.ACTIVE]: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  [CampaignStatus.PAUSED]: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  [CampaignStatus.COMPLETED]: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
};

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: "Draft",
  [CampaignStatus.PLANNED]: "Planned",
  [CampaignStatus.ACTIVE]: "Active",
  [CampaignStatus.PAUSED]: "Paused",
  [CampaignStatus.COMPLETED]: "Completed",
};

interface ClientDetailResponse {
  success: boolean;
  data: Client;
}

interface CampaignsResponse {
  success: boolean;
  data: Campaign[];
}

export default function ClientDetailPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}>
      <ClientDetailContent />
    </ProtectedRoute>
  );
}

function ClientDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setCampaignsLoading(true);
      setError(null);
      try {
        const [clientResponse, campaignsResponse] = await Promise.all([
          api.get<ClientDetailResponse>(`/clients/${id}`),
          api.get<CampaignsResponse>(`/clients/${id}/campaigns`).catch(() => null),
        ]);
        if (!cancelled) {
          setClient(clientResponse.data.data);
          setCampaigns(campaignsResponse?.data.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch client");
          setClient(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCampaignsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !client) {
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
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-card-foreground">
            {error ? "Error loading client" : "Client not found"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {error || "The client you are looking for does not exist."}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/clients" as never)}
            className="mt-4"
          >
            Back to Clients
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
        onClick={() => router.push("/clients" as never)}
        className="group -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Clients
      </Button>

      {/* Client profile card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">
              {client.name}
            </h1>
            <p className="mt-1 text-muted-foreground">{client.company}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${STATUS_STYLES[client.status] || STATUS_STYLES.ACTIVE}`}
          >
            {client.status.charAt(0) + client.status.slice(1).toLowerCase()}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate text-sm font-medium text-card-foreground">
                {client.email}
              </p>
            </div>
          </div>

          {client.phone && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="truncate text-sm font-medium text-card-foreground">
                  {client.phone}
                </p>
              </div>
            </div>
          )}

          {client.website && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Website</p>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-primary hover:underline"
                >
                  {client.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          )}

          {client.industry && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="truncate text-sm font-medium text-card-foreground">
                  {client.industry}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Client since</p>
              <p className="truncate text-sm font-medium text-card-foreground">
                {new Date(client.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {client.notes && (
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">
              {client.notes}
            </p>
          </div>
        )}
      </div>

      {/* Campaign history */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-card-foreground">
            Campaign History
          </h2>
        </div>

        {campaignsLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10">
            <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No campaigns yet for this client.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground">
                    {campaign.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {campaign.type
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                    {" · "}
                    {new Date(campaign.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    –{" "}
                    {new Date(campaign.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    ${Number(campaign.budget).toLocaleString()}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS_STYLES[campaign.status]}`}
                  >
                    {CAMPAIGN_STATUS_LABELS[campaign.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}