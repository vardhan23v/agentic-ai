"use client";

import { useState, useCallback } from "react";
import { useLeads, CreateLeadInput, UpdateLeadInput } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeadKanban } from "@/components/leads/LeadKanban";
import { LeadForm } from "@/components/leads/LeadForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lead, LeadStatus, UserRole } from "@/types";
import { Plus } from "lucide-react";

export default function LeadsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}
    >
      <DashboardLayout>
        <LeadsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function LeadsContent() {
  const { user } = useAuth();
  const {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
  } = useLeads();

  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Lead | null>(null);

  const canModify =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const handleCreate = useCallback(() => {
    setEditingLead(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((lead: Lead) => {
    setDeleteConfirm(lead);
  }, []);

  const handleMove = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      await updateLeadStatus(leadId, newStatus);
    },
    [updateLeadStatus]
  );

  const handleFormSubmit = useCallback(
    async (data: CreateLeadInput | UpdateLeadInput) => {
      if (editingLead) {
        await updateLead(editingLead.id, data as UpdateLeadInput);
      } else {
        await createLead(data as CreateLeadInput);
      }
      setShowForm(false);
      setEditingLead(null);
    },
    [editingLead, createLead, updateLead]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteLead(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteLead]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Leads Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your leads through the sales pipeline.
          </p>
        </div>
        {canModify && (
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button
            onClick={() => fetchLeads()}
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-80 min-w-[20rem] shrink-0 rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="space-y-3 p-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-3 w-20" />
                    <Skeleton className="mt-2 h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban board */}
      {!loading && (
        <LeadKanban
          leads={leads}
          currentUserRole={user?.role}
          onMove={canModify ? handleMove : () => {}}
          onEdit={canModify ? handleEdit : () => {}}
          onDelete={canModify ? handleDelete : () => {}}
        />
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <LeadForm
          lead={editingLead}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingLead(null);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-card-foreground">
              Delete Lead
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-card-foreground">
                {deleteConfirm.name}
              </span>
              {deleteConfirm.company && (
                <>
                  {" "}
                  from{" "}
                  <span className="font-medium text-card-foreground">
                    {deleteConfirm.company}
                  </span>
                </>
              )}
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}