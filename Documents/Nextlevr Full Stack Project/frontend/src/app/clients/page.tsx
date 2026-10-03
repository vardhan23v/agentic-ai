"use client";

import { useState, useCallback } from "react";
import { useClients, CreateClientInput, UpdateClientInput } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientTable } from "@/components/clients/ClientTable";
import { ClientForm } from "@/components/clients/ClientForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Client, UserRole } from "@/types";
import { Plus } from "lucide-react";

export default function ClientsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}>
      <DashboardLayout>
        <ClientsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function ClientsContent() {
  const { user } = useAuth();
  const {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);

  const canModify =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const handleCreate = useCallback(() => {
    setEditingClient(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((client: Client) => {
    setDeleteConfirm(client);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: CreateClientInput | UpdateClientInput) => {
      if (editingClient) {
        await updateClient(editingClient.id, data as UpdateClientInput);
      } else {
        await createClient(data as CreateClientInput);
      }
      setShowForm(false);
      setEditingClient(null);
    },
    [editingClient, createClient, updateClient]
  );

const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteClient(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteClient]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships and track their campaigns.
          </p>
        </div>
        {canModify && (
          <Button onClick={handleCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button
            onClick={() => fetchClients()}
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
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
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
        <ClientTable
          clients={clients}
          onEdit={canModify ? handleEdit : () => {}}
          onDelete={canModify ? handleDelete : () => {}}
        />
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingClient(null);
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
              Delete Client
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-card-foreground">
                {deleteConfirm.name}
              </span>{" "}
              from{" "}
              <span className="font-medium text-card-foreground">
                {deleteConfirm.company}
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
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}