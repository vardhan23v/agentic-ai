"use client";

import { useState, useCallback } from "react";
import {
  useCampaigns,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Campaign, CampaignStatus, UserRole } from "@/types";
import { Plus } from "lucide-react";

export default function CampaignsPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}
    >
      <DashboardLayout>
        <CampaignsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function CampaignsContent() {
  const { user } = useAuth();
  const {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  } = useCampaigns();

  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Campaign | null>(null);

  const canModify =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const handleCreate = useCallback(() => {
    setEditingCampaign(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((campaign: Campaign) => {
    setDeleteConfirm(campaign);
  }, []);

  const handleStatusChange = useCallback(
    async (campaign: Campaign, newStatus: CampaignStatus) => {
      if (newStatus === campaign.status) return;
      try {
        await updateCampaign(campaign.id, { status: newStatus });
      } catch {
        // Error handled silently; the UI won't update on failure
      }
    },
    [updateCampaign]
  );

  const handleFormSubmit = useCallback(
    async (data: CreateCampaignInput | UpdateCampaignInput) => {
      if (editingCampaign) {
        await updateCampaign(
          editingCampaign.id,
          data as UpdateCampaignInput
        );
      } else {
        await createCampaign(data as CreateCampaignInput);
      }
      setShowForm(false);
      setEditingCampaign(null);
    },
    [editingCampaign, createCampaign, updateCampaign]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteCampaign(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteCampaign]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Campaigns
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your marketing campaigns across all clients.
          </p>
        </div>
        {canModify && (
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button
            onClick={() => fetchCampaigns()}
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <CampaignTable
          campaigns={campaigns}
          onEdit={canModify ? handleEdit : () => {}}
          onDelete={canModify ? handleDelete : () => {}}
          onStatusChange={canModify ? handleStatusChange : () => {}}
        />
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <CampaignForm
          campaign={editingCampaign}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCampaign(null);
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
              Delete Campaign
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-card-foreground">
                {deleteConfirm.name}
              </span>
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