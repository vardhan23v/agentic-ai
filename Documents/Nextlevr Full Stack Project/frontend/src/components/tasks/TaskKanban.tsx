"use client";

import { useMemo, useState } from "react";
import { TaskWithRelations, TaskStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Filter,
  LayoutList,
} from "lucide-react";

export interface TaskKanbanProps {
  tasks: TaskWithRelations[];
  currentUserRole?: UserRole;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
  onSwitchView?: () => void;
}

const COLUMNS: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
];

const COLUMN_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "Todo",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.COMPLETED]: "Completed",
};

const COLUMN_STYLES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]:
    "border-t-slate-500 bg-slate-50/50 dark:bg-slate-950/20",
  [TaskStatus.IN_PROGRESS]:
    "border-t-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
  [TaskStatus.REVIEW]:
    "border-t-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  [TaskStatus.COMPLETED]:
    "border-t-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
};

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
  MEDIUM:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
  URGENT:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-800",
};

function getAdjacentStatuses(status: TaskStatus): {
  prev: TaskStatus | null;
  next: TaskStatus | null;
} {
  const index = COLUMNS.indexOf(status);
  return {
    prev: index > 0 ? COLUMNS[index - 1] : null,
    next: index < COLUMNS.length - 1 ? COLUMNS[index + 1] : null,
  };
}

function getDueDateIndicator(dueDate: string): {
  label: string;
  className: string;
} {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      className: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400",
    };
  }
  if (diffDays <= 2) {
    return {
      label: diffDays === 0 ? "Due today" : `${diffDays}d left`,
      className:
        "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
    };
  }
  return {
    label: `${diffDays}d left`,
    className: "text-muted-foreground bg-muted/50",
  };
}

export function TaskKanban({
  tasks,
  currentUserRole,
  onMove,
  onEdit,
  onDelete,
  onSwitchView,
}: TaskKanbanProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const canModify =
    currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER;

  const priorities = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => set.add(task.priority));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (task.assignedUser?.name ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.REVIEW]: [],
      [TaskStatus.COMPLETED]: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  if (tasks.length === 0) {
    return (
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
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Priorities</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0) + priority.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {onSwitchView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchView}
              className="ml-2"
            >
              <LayoutList className="mr-2 h-4 w-4" />
              List View
            </Button>
          )}
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
                <span className="text-sm font-semibold text-card-foreground">
                  {COLUMN_LABELS[status]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tasksByStatus[status].length}
                </span>
              </div>
            </div>

            {/* Column body */}
            <div className="flex flex-1 flex-col gap-3 bg-card/50 p-3">
              {tasksByStatus[status].length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
                  <p className="text-sm text-muted-foreground">No tasks</p>
                </div>
              ) : (
                tasksByStatus[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
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

interface TaskCardProps {
  task: TaskWithRelations;
  canModify: boolean;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
}

function TaskCard({ task, canModify, onMove, onEdit, onDelete }: TaskCardProps) {
  const { prev, next } = getAdjacentStatuses(task.status);
  const dueIndicator = getDueDateIndicator(task.dueDate);

  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-card-foreground">
            {task.title}
          </h4>
          {task.client && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {task.client.name}
            </p>
          )}
        </div>
        {canModify && (
          <div className="flex shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(task)}
              className="text-muted-foreground hover:text-foreground"
              title="Edit task"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(task)}
              className="text-muted-foreground hover:text-destructive"
              title="Delete task"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Priority & due date */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_STYLES[task.priority]}`}
        >
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${dueIndicator.className}`}
        >
          <Calendar className="h-3 w-3" />
          {dueIndicator.label}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        <span className="truncate max-w-[10rem]">
          {task.assignedUser?.name ?? "Unassigned"}
        </span>
      </div>

      {/* Status controls */}
      {canModify && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => prev && onMove(task.id, prev)}
              disabled={!prev}
              title={prev ? `Move to ${COLUMN_LABELS[prev]}` : "Cannot move back"}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => next && onMove(task.id, next)}
              disabled={!next}
              title={
                next ? `Move to ${COLUMN_LABELS[next]}` : "Cannot move forward"
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <select
            value={task.status}
            onChange={(e) => onMove(task.id, e.target.value as TaskStatus)}
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
