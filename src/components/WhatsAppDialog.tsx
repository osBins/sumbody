import { useState } from "react";
import { open } from "@tauri-apps/plugin-shell";

interface WhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  mobile: string;
}

/**
 * Formats an Indian mobile number for WhatsApp.
 * Strips non-digits, prepends 91 if not already present.
 */
function formatIndianNumber(mobile: string): string {
  const digits = mobile.replace(/[^0-9]/g, "");
  // If already starts with 91 and is 12 digits, use as-is
  if (digits.startsWith("91") && digits.length === 12) return digits;
  // If 10 digits (no country code), prepend 91
  if (digits.length === 10) return `91${digits}`;
  // If starts with 0 (trunk prefix), strip and prepend 91
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  // Fallback: just return digits
  return digits;
}

export function WhatsAppDialog({ open: isOpen, onOpenChange, name, mobile }: WhatsAppDialogProps) {
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const formattedNumber = formatIndianNumber(mobile);

  const handleSend = () => {
    const encodedMessage = encodeURIComponent(message);
    const url = message
      ? `https://wa.me/${formattedNumber}?text=${encodedMessage}`
      : `https://wa.me/${formattedNumber}`;
    open(url);
    onOpenChange(false);
    setMessage("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-1">WhatsApp Message</h3>
        <p className="text-sm text-muted-foreground mb-4">
          To: <span className="font-medium text-foreground">{name}</span>
          <span className="ml-2 text-xs">({formattedNumber})</span>
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message (optional)..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none h-24"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
