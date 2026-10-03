"use client";

import { useMemo, useState } from "react";
import { Lead, LeadStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  DollarSign,
  Building2,
  Filter,
} from "lucide-react";

export interface LeadKanbanProps {
  leads: Lead[];
  currentUserRole?: UserRole;
  onMove: (leadId: string, newStatus: LeadStatus) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

const COLUMNS: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL,
  LeadStatus.CONVERTED,
  LeadStatus.LOST,
];

const COLUMN_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "New",
  [LeadStatus.CONTACTED]: "Contacted",
  [LeadStatus.QUALIFIED]: "Qualified",
  [LeadStatus.PROPOSAL]: "Proposal",
  [LeadStatus.CONVERTED]: "Converted",
  [LeadStatus.LOST]: "Lost",
};

const COLUMN_STYLES: Record<LeadStatus, string> = {
  [LeadStatus.NEW]:
    "border-t-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
  [LeadStatus.CONTACTED]:
    "border-t-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20",
  [LeadStatus.QUALIFIED]:
    "border-t-violet-500 bg-violet-50/50 dark:bg-violet-950/20",
  [LeadStatus.PROPOSAL]:
    "border-t-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  [LeadStatus.CONVERTED]:
    "border-t-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
  [LeadStatus.LOST]:
    "border-t-rose-500 bg-rose-50/50 dark:bg-rose-950/20",
};

const STATUS_BADGE_STYLES: Record<LeadStatus, string> = {
  [LeadStatus.NEW]:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  [LeadStatus.CONTACTED]:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-800",
  [LeadStatus.QUALIFIED]:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:border-violet-800",
  [LeadStatus.PROPOSAL]:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
  [LeadStatus.CONVERTED]:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800",
  [LeadStatus.LOST]:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-800",
};

function formatCurrency(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

function getAdjacentStatuses(status: LeadStatus): {
  prev: LeadStatus | null;
  next: LeadStatus | null;
} {
  const index = COLUMNS.indexOf(status);
  return {
    prev: index > 0 ? COLUMNS[index - 1] : null,
    next: index < COLUMNS.length - 1 ? COLUMNS[index + 1] : null,
  };
}

export function LeadKanban({
  leads,
  currentUserRole,
  onMove,
  onEdit,
  onDelete,
}: LeadKanbanProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  const canModify =
    currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER;

  const sources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((lead) => set.add(lead.source));
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        (lead.company ?? "").toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase());

      const matchesSource =
        sourceFilter === "ALL" || lead.source === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [leads, search, sourceFilter]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      [LeadStatus.NEW]: [],
      [LeadStatus.CONTACTED]: [],
      [LeadStatus.QUALIFIED]: [],
      [LeadStatus.PROPOSAL]: [],
      [LeadStatus.CONVERTED]: [],
      [LeadStatus.LOST]: [],
    };

    filteredLeads.forEach((lead) => {
      grouped[lead.status].push(lead);
    });

    return grouped;
  }, [filteredLeads]);

  const columnTotals = useMemo(() => {
    const totals: Record<LeadStatus, number> = {
      [LeadStatus.NEW]: 0,
      [LeadStatus.CONTACTED]: 0,
      [LeadStatus.QUALIFIED]: 0,
      [LeadStatus.PROPOSAL]: 0,
      [LeadStatus.CONVERTED]: 0,
      [LeadStatus.LOST]: 0,
    };

    filteredLeads.forEach((lead) => {
      const value =
        typeof lead.value === "string" ? parseFloat(lead.value) : lead.value ?? 0;
      totals[lead.status] += Number.isNaN(value) ? 0 : value;
    });

    return totals;
  }, [filteredLeads]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <User className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-card-foreground">
          No leads yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first lead to start tracking your pipeline.
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
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((status) => (
          <div
            key={status}
            className={`flex w-80 min-w-[20rem] shrink-0 flex-col rounded-xl border border-t-4 shadow-sm ${COLUMN_STYLES[status]}`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[status]}`}
                >
                  {COLUMN_LABELS[status]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {leadsByStatus[status].length}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {formatCurrency(columnTotals[status])}
              </span>
            </div>

            {/* Column body */}
            <div className="flex flex-1 flex-col gap-3 bg-card/50 p-3">
              {leadsByStatus[status].length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                  <p className="text-sm text-muted-foreground">No leads</p>
                </div>
              ) : (
                leadsByStatus[status].map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    canModify={canModify}
                    onMove={onMove}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LeadCardProps {
  lead: Lead;
  canModify: boolean;
  onMove: (leadId: string, newStatus: LeadStatus) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

function LeadCard({ lead, canModify, onMove, onEdit, onDelete }: LeadCardProps) {
  const { prev, next } = getAdjacentStatuses(lead.status);

  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-card-foreground">
            {lead.name}
          </h4>
          {lead.company && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </div>
        {canModify && (
          <div className="flex shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(lead)}
              className="text-muted-foreground hover:text-foreground"
              title="Edit lead"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(lead)}
              className="text-muted-foreground hover:text-destructive"
              title="Delete lead"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Value & assigned user */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 font-medium text-card-foreground">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          {formatCurrency(lead.value)}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[8rem]">
            {lead.assignedUser?.name ?? "Unassigned"}
          </span>
        </div>
      </div>

      {/* Source */}
      <div className="text-xs text-muted-foreground">
        Source: <span className="font-medium text-card-foreground">{lead.source}</span>
      </div>

      {/* Status controls */}
      {canModify && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => prev && onMove(lead.id, prev)}
              disabled={!prev}
              title={prev ? `Move to ${COLUMN_LABELS[prev]}` : "Cannot move back"}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => next && onMove(lead.id, next)}
              disabled={!next}
              title={next ? `Move to ${COLUMN_LABELS[next]}` : "Cannot move forward"}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <select
            value={lead.status}
            onChange={(e) => onMove(lead.id, e.target.value as LeadStatus)}
            className="h-7 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Change status"
          >
            {COLUMNS.map((status) => (
              <option key={status} value={status}>
                {COLUMN_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
