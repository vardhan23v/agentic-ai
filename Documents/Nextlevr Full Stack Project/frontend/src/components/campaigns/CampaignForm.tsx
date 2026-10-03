"use client";

import { useState, useMemo, useEffect } from "react";
import { Campaign, CampaignType, CampaignStatus, Client } from "@/types";
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { ZodError } from "zod";
import api from "@/lib/api";

interface CampaignFormProps {
  campaign?: Campaign | null;
  onSubmit: (data: CreateCampaignInput | UpdateCampaignInput) => Promise<void>;
  onClose: () => void;
}

type FormData = {
  name: string;
  clientId: string;
  description: string;
  type: CampaignType | "";
  startDate: string;
  endDate: string;
  budget: string;
  status: CampaignStatus;
  targetAudience: string;
  goals: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function getInitialFormData(campaign?: Campaign | null): FormData {
  if (!campaign) {
    return {
      name: "",
      clientId: "",
      description: "",
      type: "",
      startDate: "",
      endDate: "",
      budget: "",
      status: CampaignStatus.DRAFT,
      targetAudience: "",
      goals: "",
    };
  }
  return {
    name: campaign.name,
    clientId: campaign.clientId,
    description: campaign.description ?? "",
    type: campaign.type,
    startDate: campaign.startDate
      ? new Date(campaign.startDate).toISOString().split("T")[0]
      : "",
    endDate: campaign.endDate
      ? new Date(campaign.endDate).toISOString().split("T")[0]
      : "",
    budget: campaign.budget,
    status: campaign.status,
    targetAudience: campaign.targetAudience ?? "",
    goals: campaign.goals ?? "",
  };
}

const TYPE_LABELS: Record<CampaignType, string> = {
  [CampaignType.SOCIAL_MEDIA]: "Social Media",
  [CampaignType.SEO]: "SEO",
  [CampaignType.EMAIL_MARKETING]: "Email Marketing",
  [CampaignType.PAID_ADVERTISING]: "Paid Advertising",
  [CampaignType.CONTENT_MARKETING]: "Content Marketing",
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: "Draft",
  [CampaignStatus.PLANNED]: "Planned",
  [CampaignStatus.ACTIVE]: "Active",
  [CampaignStatus.PAUSED]: "Paused",
  [CampaignStatus.COMPLETED]: "Completed",
};

interface ClientsResponse {
  success: boolean;
  data: Client[];
}

export function CampaignForm({ campaign, onSubmit, onClose }: CampaignFormProps) {
  const isEditing = !!campaign;
  const initialFormData = useMemo<FormData>(() => getInitialFormData(campaign), [campaign]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Fetch clients for the dropdown
  useEffect(() => {
    let cancelled = false;
    async function loadClients() {
      try {
        const response = await api.get<ClientsResponse>("/clients?limit=100");
        if (!cancelled) setClients(response.data.data);
      } catch {
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    }
    loadClients();
    return () => { cancelled = true; };
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

    // Prepare data for validation
    const dataToValidate = {
      ...formData,
      type: formData.type || undefined,
      description: formData.description || undefined,
      targetAudience: formData.targetAudience || undefined,
      goals: formData.goals || undefined,
    };

    try {
      if (isEditing) {
        const validated = UpdateCampaignSchema.parse(dataToValidate);
        setIsSubmitting(true);
        await onSubmit(validated);
      } else {
        const validated = CreateCampaignSchema.parse(dataToValidate);
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
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-10 pb-10 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Edit Campaign" : "Create Campaign"}
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
            {/* Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-card-foreground"
              >
                Campaign Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Summer Social Media Blitz"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Client */}
            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="clientId"
                className="text-sm font-medium text-card-foreground"
              >
                Client <span className="text-destructive">*</span>
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                disabled={clientsLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <option value="">
                  {clientsLoading ? "Loading clients..." : "Select a client"}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.company})
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label
                htmlFor="type"
                className="text-sm font-medium text-card-foreground"
              >
                Campaign Type <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select type</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type}</p>
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
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="startDate"
                className="text-sm font-medium text-card-foreground"
              >
                Start Date <span className="text-destructive">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="endDate"
                className="text-sm font-medium text-card-foreground"
              >
                End Date <span className="text-destructive">*</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label
                htmlFor="budget"
                className="text-sm font-medium text-card-foreground"
              >
                Budget <span className="text-destructive">*</span>
              </label>
              <input
                id="budget"
                name="budget"
                type="text"
                value={formData.budget}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="5000"
              />
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget}</p>
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
              rows={2}
              value={formData.description}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Brief description of the campaign..."
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <label
              htmlFor="targetAudience"
              className="text-sm font-medium text-card-foreground"
            >
              Target Audience
            </label>
            <input
              id="targetAudience"
              name="targetAudience"
              type="text"
              value={formData.targetAudience}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="e.g. B2B tech companies, 25-45 age group"
            />
            {errors.targetAudience && (
              <p className="text-sm text-destructive">
                {errors.targetAudience}
              </p>
            )}
          </div>

          {/* Goals */}
          <div className="space-y-1.5">
            <label
              htmlFor="goals"
              className="text-sm font-medium text-card-foreground"
            >
              Goals
            </label>
            <textarea
              id="goals"
              name="goals"
              rows={2}
              value={formData.goals}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="e.g. Generate 500 leads, increase brand awareness by 30%"
            />
            {errors.goals && (
              <p className="text-sm text-destructive">{errors.goals}</p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Campaign"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}