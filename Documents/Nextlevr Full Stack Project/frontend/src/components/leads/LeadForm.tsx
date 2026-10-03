"use client";

import { useState, useEffect, useMemo } from "react";
// useEffect is used for fetching dropdown options
import { Lead, LeadStatus, Campaign } from "@/types";
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  CreateLeadInput,
  UpdateLeadInput,
} from "@/hooks/useLeads";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { ZodError } from "zod";
import api from "@/lib/api";

interface LeadFormProps {
  lead?: Lead | null;
  onSubmit: (data: CreateLeadInput | UpdateLeadInput) => Promise<void>;
  onClose: () => void;
}

interface CampaignOption {
  id: string;
  name: string;
}

type FormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  campaignId: string;
  status: LeadStatus;
  value: string;
  assignedUserId: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function getInitialFormData(lead?: Lead | null): FormData {
  if (!lead) {
    return {
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "",
      campaignId: "",
      status: LeadStatus.NEW,
      value: "",
      assignedUserId: "",
      notes: "",
    };
  }
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    company: lead.company ?? "",
    source: lead.source,
    campaignId: lead.campaignId ?? "",
    status: lead.status,
    value: lead.value ?? "",
    assignedUserId: lead.assignedUserId ?? "",
    notes: lead.notes ?? "",
  };
}

export function LeadForm({ lead, onSubmit, onClose }: LeadFormProps) {
  const isEditing = !!lead;
  const initialFormData = useMemo<FormData>(() => getInitialFormData(lead), [lead]);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const campaignsResponse = await api.get<{ success: boolean; data: Campaign[] }>(
          "/campaigns?limit=100"
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

    const numericValue = formData.value ? parseFloat(formData.value) : 0;

    const dataToValidate = {
      ...formData,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      campaignId: formData.campaignId || undefined,
      assignedUserId: formData.assignedUserId || undefined,
      notes: formData.notes || undefined,
      value: numericValue,
    };

    try {
      if (isEditing) {
        const validated = UpdateLeadSchema.parse(dataToValidate);
        setIsSubmitting(true);
        await onSubmit(validated);
      } else {
        const validated = CreateLeadSchema.parse(dataToValidate);
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
            {isEditing ? "Edit Lead" : "Create Lead"}
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
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium text-card-foreground"
              >
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-card-foreground"
              >
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="john@acme.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-card-foreground"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label
                htmlFor="company"
                className="text-sm font-medium text-card-foreground"
              >
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Acme Inc."
              />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company}</p>
              )}
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label
                htmlFor="source"
                className="text-sm font-medium text-card-foreground"
              >
                Source <span className="text-destructive">*</span>
              </label>
              <input
                id="source"
                name="source"
                type="text"
                value={formData.source}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Website, Referral, LinkedIn..."
              />
              {errors.source && (
                <p className="text-sm text-destructive">{errors.source}</p>
              )}
            </div>

            {/* Value */}
            <div className="space-y-1.5">
              <label
                htmlFor="value"
                className="text-sm font-medium text-card-foreground"
              >
                Value ($)
              </label>
              <input
                id="value"
                name="value"
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="0.00"
              />
              {errors.value && (
                <p className="text-sm text-destructive">{errors.value}</p>
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

            {/* Assigned User */}
            <div className="space-y-1.5">
              <label
                htmlFor="assignedUserId"
                className="text-sm font-medium text-card-foreground"
              >
                Assigned User ID
              </label>
              <input
                id="assignedUserId"
                name="assignedUserId"
                type="text"
                value={formData.assignedUserId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="User UUID (optional)"
              />
              {errors.assignedUserId && (
                <p className="text-sm text-destructive">
                  {errors.assignedUserId}
                </p>
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
                <option value={LeadStatus.NEW}>New</option>
                <option value={LeadStatus.CONTACTED}>Contacted</option>
                <option value={LeadStatus.QUALIFIED}>Qualified</option>
                <option value={LeadStatus.PROPOSAL}>Proposal</option>
                <option value={LeadStatus.CONVERTED}>Converted</option>
                <option value={LeadStatus.LOST}>Lost</option>
              </select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-card-foreground"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Optional notes about this lead..."
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes}</p>
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
                "Create Lead"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
