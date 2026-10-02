"use client";

import { useState, useCallback } from "react";
import {
  useTasks,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { TaskWithRelations, TaskStatus, UserRole } from "@/types";
import { Plus } from "lucide-react";

type ViewMode = "kanban" | "list";

export default function TasksPage() {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_MEMBER]}
    >
      <TasksContent />
    </ProtectedRoute>
  );
}

function TasksContent() {
  const { user } = useAuth();
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useTasks();

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
      await updateTaskStatus(taskId, { status: newStatus });
    },
    [updateTaskStatus]
  );

  const handleFormSubmit = useCallback(
    async (data: CreateTaskInput | UpdateTaskInput) => {
      if (editingTask) {
        await updateTask(editingTask.id, data as UpdateTaskInput);
      } else {
        await createTask(data as CreateTaskInput);
      }
      setShowForm(false);
      setEditingTask(null);
    },
    [editingTask, createTask, updateTask]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await deleteTask(deleteConfirm.id);
    setDeleteConfirm(null);
  }, [deleteConfirm, deleteTask]);

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
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              List
            </button>
          </div>

          {canModify && (
            <Button onClick={handleCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <button
            onClick={() => fetchTasks()}
            className="ml-2 underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-80 min-w-[20rem] shrink-0 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                </div>
                <div className="space-y-3 p-3">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div
                      key={j}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Views */}
      {!loading && viewMode === "kanban" && (
        <TaskKanban
          tasks={tasks}
          currentUserRole={user?.role}
          onMove={canModify ? handleMove : () => {}}
          onEdit={canModify ? handleEdit : () => {}}
          onDelete={canModify ? handleDelete : () => {}}
          onSwitchView={() => setViewMode("list")}
        />
      )}

      {!loading && viewMode === "list" && (
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
