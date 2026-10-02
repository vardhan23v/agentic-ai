"use client";

import { useState, useEffect } from "react";
import {
  TaskWithRelations,
  TaskPriority,
  TaskStatus,
  Client,
  Campaign,
  User,
} from "@/types";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/hooks/useTasks";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { ZodError } from "zod";
import api from "@/lib/api";

export interface TaskFormProps {
  task?: TaskWithRelations | null;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  onClose: () => void;
}

interface ClientOption {
  id: string;
  name: string;
}

interface CampaignOption {
  id: string;
  name: string;
}

type FormData = {
  title: string;
  description: string;
  assignedUserId: string;
  clientId: string;
  campaignId: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  assignedUserId: "",
  clientId: "",
  campaignId: "",
  priority: TaskPriority.MEDIUM,
  dueDate: "",
  status: TaskStatus.TODO,
};

function toDatetimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function taskToFormData(task: TaskWithRelations | null | undefined): FormData {
  if (!task) return EMPTY_FORM;
  return {
    title: task.title,
    description: task.description ?? "",
    assignedUserId: task.assignedUserId,
    clientId: task.clientId ?? "",
    campaignId: task.campaignId ?? "",
    priority: task.priority,
    dueDate: toDatetimeLocalValue(task.dueDate),
    status: task.status,
  };
}

export function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const isEditing = !!task;
  const [formData, setFormData] = useState<FormData>(taskToFormData(task));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const [usersResponse, clientsResponse, campaignsResponse] =
          await Promise.all([
            api.get<{ success: boolean; data: User[] }>("/users"),
            api.get<{ success: boolean; data: Client[] }>("/clients?limit=100"),
            api.get<{ success: boolean; data: Campaign[] }>(
              "/campaigns?limit=100"
            ),
          ]);

        setUsers(usersResponse.data.data);
        setClients(
          clientsResponse.data.data.map((c) => ({ id: c.id, name: c.name }))
        );
        setCampaigns(
          campaignsResponse.data.data.map((c) => ({ id: c.id, name: c.name }))
        );
      } catch {
        // Non-blocking: dropdowns will simply be empty
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const dataToValidate = {
      ...formData,
      description: formData.description || undefined,
      clientId: formData.clientId || undefined,
      campaignId: formData.campaignId || undefined,
      status: isEditing ? formData.status : undefined,
    };

    try {
      if (isEditing) {
        const validated = UpdateTaskSchema.parse(dataToValidate);
        setIsSubmitting(true);
        await onSubmit(validated);
      } else {
        const validated = CreateTaskSchema.parse(dataToValidate);
        setIsSubmitting(true);
        await onSubmit(validated);
      }
      onClose();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pb-10 pt-10"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Edit Task" : "Create Task"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-card-foreground"
              >
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. Prepare campaign report"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Assigned User */}
            <div className="space-y-1.5">
              <label
                htmlFor="assignedUserId"
                className="text-sm font-medium text-card-foreground"
              >
                Assigned User <span className="text-destructive">*</span>
              </label>
              <select
                id="assignedUserId"
                name="assignedUserId"
                value={formData.assignedUserId}
                onChange={handleChange}
                disabled={loadingOptions}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              {errors.assignedUserId && (
                <p className="text-sm text-destructive">
                  {errors.assignedUserId}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label
                htmlFor="priority"
                className="text-sm font-medium text-card-foreground"
              >
                Priority <span className="text-destructive">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.URGENT}>Urgent</option>
              </select>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="dueDate"
                className="text-sm font-medium text-card-foreground"
              >
                Due Date <span className="text-destructive">*</span>
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label
                htmlFor="status"
                className="text-sm font-medium text-card-foreground"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value={TaskStatus.TODO}>Todo</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.REVIEW}>Review</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <label
                htmlFor="clientId"
                className="text-sm font-medium text-card-foreground"
              >
                Client
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                disabled={loadingOptions}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <option value="">No client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId}</p>
              )}
            </div>

            {/* Campaign */}
            <div className="space-y-1.5">
              <label
                htmlFor="campaignId"
                className="text-sm font-medium text-card-foreground"
              >
                Campaign
              </label>
              <select
                id="campaignId"
                name="campaignId"
                value={formData.campaignId}
                onChange={handleChange}
                disabled={loadingOptions}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <option value="">No campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {errors.campaignId && (
                <p className="text-sm text-destructive">{errors.campaignId}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-card-foreground"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Optional details about this task..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingOptions}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
