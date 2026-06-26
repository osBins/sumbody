import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SCHEMA_FIELDS, FIELD_LABELS } from "@/lib/schema";
import { createMember } from "@/lib/tauri-commands";
import type { MemberRecord } from "@/types/member";

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function createEmptyRecord(): MemberRecord {
  const record: Partial<MemberRecord> = {};
  for (const field of SCHEMA_FIELDS) {
    if (field === "TOTALDUES") {
      record[field] = 0;
    } else {
      record[field] = "";
    }
  }
  return record as MemberRecord;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddMemberDialogProps) {
  const [formData, setFormData] = useState<MemberRecord>(createEmptyRecord());
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  function handleFieldChange(field: keyof MemberRecord, value: string) {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "TOTALDUES" ? (parseFloat(value) || 0) : value,
    }));
  }

  function resetForm() {
    setFormData(createEmptyRecord());
    setError("");
    setSubmitting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.MEMBERNO.trim()) {
      setError("MEMBERNO is required.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await createMember(formData);
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create member.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Fill in the member details below. MEMBERNO is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SCHEMA_FIELDS.map((field) => (
              <div key={field} className="space-y-1">
                <label
                  htmlFor={`add-member-${field}`}
                  className="text-sm font-medium leading-none"
                >
                  {FIELD_LABELS[field]}
                  {field === "MEMBERNO" && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </label>
                <input
                  id={`add-member-${field}`}
                  type={field === "TOTALDUES" ? "number" : "text"}
                  step={field === "TOTALDUES" ? "0.01" : undefined}
                  value={
                    field === "TOTALDUES"
                      ? formData[field].toString()
                      : (formData[field] as string)
                  }
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  required={field === "MEMBERNO"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={field === "MEMBERNO" ? "Required" : ""}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Member"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
