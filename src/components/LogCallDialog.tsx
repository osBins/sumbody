import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { addCallLog } from "@/lib/tauri-commands";
import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";

interface LogCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberno: string;
  name: string;
  onSuccess: () => void;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function LogCallDialog({ open, onOpenChange, memberno, name, onSuccess }: LogCallDialogProps) {
  const [callDate, setCallDate] = useState(todayString());
  const [callTime, setCallTime] = useState(nowTimeString());
  const [callType, setCallType] = useState<"outbound" | "inbound">("outbound");
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setCallDate(todayString());
    setCallTime(nowTimeString());
    setCallType("outbound");
    setSummary("");
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

    if (!callDate) {
      setError("Date is required.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await addCallLog(memberno, callDate, callTime, callType, summary);
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to log call.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Log Call
          </DialogTitle>
          <DialogDescription>
            Log a call with <span className="font-medium text-foreground">{name}</span> ({memberno})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="call-date" className="text-sm font-medium leading-none">
                Date <span className="text-destructive">*</span>
              </label>
              <input
                id="call-date"
                type="date"
                value={callDate}
                onChange={(e) => setCallDate(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="call-time" className="text-sm font-medium leading-none">
                Time
              </label>
              <input
                id="call-time"
                type="time"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCallType("outbound")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors border ${
                  callType === "outbound"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <PhoneOutgoing className="h-3.5 w-3.5" />
                Outbound
              </button>
              <button
                type="button"
                onClick={() => setCallType("inbound")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors border ${
                  callType === "inbound"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <PhoneIncoming className="h-3.5 w-3.5" />
                Inbound
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="call-summary" className="text-sm font-medium leading-none">
              Summary
            </label>
            <textarea
              id="call-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Brief notes about the call..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
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
              {submitting ? "Saving..." : "Log Call"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
