"use client";

import { useState } from "react";
import { Campaign, CampaignType, CampaignStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";

interface CampaignTableProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
  onStatusChange: (campaign: Campaign, newStatus: CampaignStatus) => void;
}

const TYPE_LABELS: Record<CampaignType, string> = {
  [CampaignType.SOCIAL_MEDIA]: "Social Media",
  [CampaignType.SEO]: "SEO",
  [CampaignType.EMAIL_MARKETING]: "Email Marketing",
  [CampaignType.PAID_ADVERTISING]: "Paid Advertising",
  [CampaignType.CONTENT_MARKETING]: "Content Marketing",
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
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

const STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: "Draft",
  [CampaignStatus.PLANNED]: "Planned",
  [CampaignStatus.ACTIVE]: "Active",
  [CampaignStatus.PAUSED]: "Paused",
  [CampaignStatus.COMPLETED]: "Completed",
};

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [
    CampaignStatus.DRAFT,
    CampaignStatus.PLANNED,
    CampaignStatus.ACTIVE,
  ],
  [CampaignStatus.PLANNED]: [
    CampaignStatus.PLANNED,
    CampaignStatus.ACTIVE,
    CampaignStatus.DRAFT,
  ],
  [CampaignStatus.ACTIVE]: [
    CampaignStatus.ACTIVE,
    CampaignStatus.PAUSED,
    CampaignStatus.COMPLETED,
  ],
  [CampaignStatus.PAUSED]: [
    CampaignStatus.PAUSED,
    CampaignStatus.ACTIVE,
    CampaignStatus.COMPLETED,
  ],
  [CampaignStatus.COMPLETED]: [CampaignStatus.COMPLETED],
};

export function CampaignTable({
  campaigns,
  onEdit,
  onDelete,
  onStatusChange,
}: CampaignTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CampaignType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = campaigns.filter((campaign) => {
    const matchesSearch =
      !search ||
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.client?.name ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (campaign.client?.company ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType = typeFilter === "ALL" || campaign.type === typeFilter;
    const matchesStatus =
      statusFilter === "ALL" || campaign.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as CampaignType | "ALL");
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as CampaignStatus | "ALL");
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatBudget = (budget: string) => {
    const num = parseFloat(budget);
    if (isNaN(num)) return "$0";
    return "$" + num.toLocaleString();
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Megaphone className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-card-foreground">
          No campaigns yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first campaign to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Types</option>
            <option value={CampaignType.SOCIAL_MEDIA}>Social Media</option>
            <option value={CampaignType.SEO}>SEO</option>
            <option value={CampaignType.EMAIL_MARKETING}>
              Email Marketing
            </option>
            <option value={CampaignType.PAID_ADVERTISING}>
              Paid Advertising
            </option>
            <option value={CampaignType.CONTENT_MARKETING}>
              Content Marketing
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Statuses</option>
            <option value={CampaignStatus.DRAFT}>Draft</option>
            <option value={CampaignStatus.PLANNED}>Planned</option>
            <option value={CampaignStatus.ACTIVE}>Active</option>
            <option value={CampaignStatus.PAUSED}>Paused</option>
            <option value={CampaignStatus.COMPLETED}>Completed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Budget
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Dates
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No campaigns match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((campaign) => {
                  const allowedTransitions =
                    VALID_TRANSITIONS[campaign.status] || [];
                  const canTransition = allowedTransitions.length > 1;

                  return (
                    <tr
                      key={campaign.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {campaign.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {campaign.client
                          ? `${campaign.client.name} (${campaign.client.company})`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {TYPE_LABELS[campaign.type]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canTransition ? (
                            <select
                              value={campaign.status}
                              onChange={(e) =>
                                onStatusChange(
                                  campaign,
                                  e.target.value as CampaignStatus
                                )
                              }
                              className={`inline-flex h-7 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer ${STATUS_STYLES[campaign.status]}`}
                            >
                              {allowedTransitions.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[campaign.status]}`}
                            >
                              {STATUS_LABELS[campaign.status]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatBudget(campaign.budget)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="whitespace-nowrap">
                          {formatDate(campaign.startDate)} –{" "}
                          {formatDate(campaign.endDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(campaign)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit campaign"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(campaign)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete campaign"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}