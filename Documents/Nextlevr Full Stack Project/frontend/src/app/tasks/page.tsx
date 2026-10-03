"use client";

import { useState, useCallback } from "react";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskWithRelations, TaskStatus, UserRole } from "@/types";
import { Plus, LayoutList, Kanban } from "lucide-react";

type ViewMode = "kanban" | "list";

export default function TasksPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}
    >
      <DashboardLayout>
        <TasksContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function TasksContent() {
  const { user } = useAuth();
  const { data: tasks = [], isLoading, isError, error, refetch } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TaskWithRelations | null>(
    null
  );

  const canModify =
    user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const handleCreate = useCallback(() => {
    setEditingTask(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((task: TaskWithRelations) => {
    setEditingTask(task);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((task: TaskWithRelations) => {
    setDeleteConfirm(task);
  }, []);

  const handleMove = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      await updateTaskStatus.mutateAsync({ id: taskId, data: { status: newStatus } });
    },
    [updateTaskStatus]
  );

  const handleFormSubmit = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, data: data as UpdateTaskInput });
      } else {
        await createTask.mutateAsync(data as CreateTaskInput);
      }
      setShowForm(false);
      setEditingTask(null);
    },
    [editingTask, createTask, updateTask]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteTask.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteTask]);

  const isPending =
    createTask.isPending ||
    updateTask.isPending ||
    updateTaskStatus.isPending ||
    deleteTask.isPending;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage work, track progress, and meet deadlines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Kanban className="mr-1.5 h-4 w-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="mr-1.5 h-4 w-4" />
              List
            </button>
          </div>

          {canModify && (
            <Button onClick={handleCreate} className="shrink-0" disabled={isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error?.message || "Failed to fetch tasks"}
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
        <div className="space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-80 min-w-[20rem] shrink-0 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="space-y-3 p-3">
                  {Array.from({ length: 2 }).map((_, j) => (
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
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LayoutList className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-card-foreground">
            No tasks yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first task to start tracking work.
          </p>
          {canModify && (
            <Button onClick={handleCreate} className="mt-4" disabled={isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      )}

      {/* Views */}
      {!isLoading && !isError && tasks.length > 0 && viewMode === "kanban" && (
        <TaskKanban
          tasks={tasks}
          currentUserRole={user?.role}
          onMove={canModify ? handleMove : () => {}}
          onEdit={canModify ? handleEdit : () => {}}
          onDelete={canModify ? handleDelete : () => {}}
          onSwitchView={() => setViewMode("list")}
        />
      )}

      {!isLoading && !isError && tasks.length > 0 && viewMode === "list" && (
        <TaskList
          tasks={tasks}
          currentUserRole={user?.role}
          onEdit={canModify ? handleEdit : () => {}}
          onDelete={canModify ? handleDelete : () => {}}
          onSwitchView={() => setViewMode("kanban")}
        />
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <TaskForm
          key={editingTask?.id ?? "new"}
          task={editingTask}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
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
              Delete Task
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-medium text-card-foreground">
                {deleteConfirm.title}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteTask.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteTask.isPending}
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
