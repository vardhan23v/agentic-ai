"use client";

import { useState, JSX } from "react";
import { User, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreateUserSchema, UpdateUserSchema, CreateUserInput, UpdateUserInput } from "@/hooks/useUsers";
import { Loader2 } from "lucide-react";
import { ZodError } from "zod";

export interface UserFormProps {
  user?: User | null;
  onSubmit: (data: CreateUserInput | UpdateUserInput) => Promise<void>;
  onClose: () => void;
}

type FormData = {
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

function getInitialFormData(user?: User | null): FormData {
  if (user) {
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
    };
  }
  return {
    name: "",
    email: "",
    role: UserRole.TEAM_MEMBER,
    password: "",
  };
}

export function UserForm({ user, onSubmit, onClose }: UserFormProps): JSX.Element {
  const isEditing = !!user;
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(user));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const dataToValidate = {
      ...formData,
      password: formData.password || undefined,
    };

    try {
      if (isEditing) {
        const validated = UpdateUserSchema.parse(dataToValidate);
        setIsSubmitting(true);
        await onSubmit(validated);
      } else {
        const validated = CreateUserSchema.parse(dataToValidate);
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

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit User" : "Create User"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user details and role."
              : "Add a new user to the platform."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="user-name">
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="user-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="user-role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value as UserRole)}
            >
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.TEAM_MEMBER}>Team Member</SelectItem>
                <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              Password
              {!isEditing && <span className="text-destructive"> *</span>}
              {isEditing && (
                <span className="text-muted-foreground"> (leave blank to keep current)</span>
              )}
            </Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder={isEditing ? "••••••••" : "Min 8 characters"}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {submitError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
