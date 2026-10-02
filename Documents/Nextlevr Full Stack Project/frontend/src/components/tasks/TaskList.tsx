"use client";

import { useMemo, useState } from "react";
import { TaskWithRelations, TaskPriority, TaskStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User,
  Calendar,
  Filter,
  Kanban,
} from "lucide-react";

export interface TaskListProps {
  tasks: TaskWithRelations[];
  currentUserRole?: UserRole;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
  onSwitchView?: () => void;
}

type SortField = "title" | "status" | "priority" | "dueDate" | "assignedUser";
type SortDirection = "asc" | "desc";

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "Todo",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.COMPLETED]: "Completed",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  [TaskStatus.TODO]:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
  [TaskStatus.IN_PROGRESS]:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  [TaskStatus.REVIEW]:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
  [TaskStatus.COMPLETED]:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800",
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  [TaskPriority.LOW]:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
  [TaskPriority.MEDIUM]:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  [TaskPriority.HIGH]:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800",
  [TaskPriority.URGENT]:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-800",
};

function getDueDateClass(dueDate: string, status: TaskStatus): string {
  if (status === TaskStatus.COMPLETED) {
    return "text-muted-foreground";
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "text-rose-600 font-medium";
  }
  if (diffDays <= 2) {
    return "text-amber-600 font-medium";
  }
  return "text-muted-foreground";
}

function formatDueDate(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  }
  if (diffDays === 0) {
    return "Due today";
  }
  if (diffDays <= 2) {
    return `${diffDays}d left`;
  }
  return due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface SortHeaderProps {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
  className?: string;
}

function SortHeader({
  field,
  sortField,
  sortDirection,
  onSort,
  children,
  className = "",
}: SortHeaderProps) {
  const active = sortField === field;
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 text-left font-medium text-muted-foreground transition-colors hover:text-foreground ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {active &&
          (sortDirection === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          ))}
      </div>
    </th>
  );
}

export function TaskList({
  tasks,
  currentUserRole,
  onEdit,
  onDelete,
  onSwitchView,
}: TaskListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">(
    "ALL"
  );
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const canModify =
    currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (task.assignedUser?.name ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (task.client?.name ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority": {
          const priorityOrder = {
            [TaskPriority.LOW]: 1,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.HIGH]: 3,
            [TaskPriority.URGENT]: 4,
          };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case "dueDate":
          comparison =
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "assignedUser":
          comparison = (a.assignedUser?.name ?? "").localeCompare(
            b.assignedUser?.name ?? ""
          );
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortField, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / pageSize)
  );
  const safePage = Math.min(page, totalPages);
  const paginated = filteredAndSorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Kanban className="h-7 w-7 text-muted-foreground" />
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TaskStatus | "ALL");
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Statuses</option>
            <option value={TaskStatus.TODO}>Todo</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.REVIEW}>Review</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value as TaskPriority | "ALL");
              setPage(1);
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="ALL">All Priorities</option>
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
            <option value={TaskPriority.URGENT}>Urgent</option>
          </select>

          {onSwitchView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchView}
              className="ml-2"
            >
              <Kanban className="mr-2 h-4 w-4" />
              Kanban View
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <SortHeader
                  field="title"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Task
                </SortHeader>
                <SortHeader
                  field="status"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="whitespace-nowrap"
                >
                  Status
                </SortHeader>
                <SortHeader
                  field="priority"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Priority
                </SortHeader>
                <SortHeader
                  field="dueDate"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="whitespace-nowrap"
                >
                  Due Date
                </SortHeader>
                <SortHeader
                  field="assignedUser"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                >
                  Assigned To
                </SortHeader>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No tasks match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-card-foreground">
                        {task.title}
                      </div>
                      {task.client && (
                        <div className="text-xs text-muted-foreground">
                          {task.client.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                      >
                        {task.priority.charAt(0) +
                          task.priority.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div
                        className={`flex items-center gap-1 ${getDueDateClass(
                          task.dueDate,
                          task.status
                        )}`}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDueDate(task.dueDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[8rem]">
                          {task.assignedUser?.name ?? "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(task)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit task"
                          disabled={!canModify}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(task)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete task"
                          disabled={!canModify}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredAndSorted.length)} of{" "}
              {filteredAndSorted.length}
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
