"use client";

import { useState, useCallback } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UserTable } from "@/components/admin/UserTable";
import { UserForm } from "@/components/admin/UserForm";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDisableUser,
  CreateUserInput,
  UpdateUserInput,
} from "@/hooks/useUsers";
import { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <DashboardLayout>
        <AdminUsersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
  const { data: users = [], isLoading, isError, error, refetch } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const disableUser = useDisableUser();

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [disableConfirm, setDisableConfirm] = useState<User | null>(null);

  const handleCreate = useCallback(() => {
    setEditingUser(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setShowForm(true);
  }, []);

  const handleDisable = useCallback((user: User) => {
    setDisableConfirm(user);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: CreateUserInput | UpdateUserInput) => {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, data: data as UpdateUserInput });
      } else {
        await createUser.mutateAsync(data as CreateUserInput);
      }
      setShowForm(false);
      setEditingUser(null);
    },
    [editingUser, createUser, updateUser]
  );

  const handleDisableConfirm = useCallback(async () => {
    if (!disableConfirm) return;
    await disableUser.mutateAsync(disableConfirm.id);
    setDisableConfirm(null);
  }, [disableConfirm, disableUser]);

  const isPending = createUser.isPending || updateUser.isPending || disableUser.isPending;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage platform users and their roles.
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0" disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || "Failed to fetch users"}
          <button
            onClick={() => refetch()}
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <div className="ml-auto flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-card-foreground">
            No users yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first user to get started.
          </p>
          <Button onClick={handleCreate} className="mt-4" disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && users.length > 0 && (
        <UserTable
          users={users}
          onEdit={handleEdit}
          onDisable={handleDisable}
        />
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <UserForm
          key={editingUser?.id ?? "new"}
          user={editingUser}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Disable confirmation AlertDialog */}
      <AlertDialog
        open={!!disableConfirm}
        onOpenChange={(open) => !open && setDisableConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable{" "}
              <span className="font-medium text-card-foreground">
                {disableConfirm?.name}
              </span>
              ? They will no longer be able to log in. This action can be
              reversed by an admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disableUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDisableConfirm();
              }}
              disabled={disableUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disableUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
