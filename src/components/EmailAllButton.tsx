import { useState, useRef, useEffect } from "react";
import { Mail, ChevronDown } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import type { MemberRecord } from "@/types/member";

type EmailMode = "to" | "cc" | "bcc";

const MODE_LABELS: Record<EmailMode, string> = {
  to: "To",
  cc: "Cc",
  bcc: "Bcc",
};

interface EmailAllButtonProps {
  members: MemberRecord[];
}

export function EmailAllButton({ members }: EmailAllButtonProps) {
  const [mode, setMode] = useState<EmailMode>("bcc");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const emails = members.map((m) => m.EMAIL).filter(Boolean);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSend = () => {
    const emailList = emails.join(",");
    let mailto = "mailto:";

    if (mode === "to") {
      mailto += emailList;
    } else {
      mailto += `?${mode}=${emailList}`;
    }

    const params: string[] = [];
    if (mode === "to" && (subject || body)) {
      // Already have emailList in the to: field, add subject/body as params
    }
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);

    if (params.length > 0) {
      if (mode === "to") {
        mailto += `?${params.join("&")}`;
      } else {
        mailto += `&${params.join("&")}`;
      }
    }

    open(mailto);
    setComposeOpen(false);
    setSubject("");
    setBody("");
  };

  return (
    <>
      <div className="relative flex" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          disabled={emails.length === 0}
          className="inline-flex items-center justify-center rounded-l-md text-sm font-medium h-9 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          title={emails.length === 0 ? "No emails in current view" : `Email ${emails.length} members (${MODE_LABELS[mode]})`}
        >
          <Mail className="h-4 w-4 mr-1.5" />
          Email All ({MODE_LABELS[mode]})
        </button>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center justify-center rounded-r-md text-sm h-9 px-1.5 border border-l-0 border-input bg-background hover:bg-accent transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full right-0 mt-1 z-50 min-w-[100px] rounded-md border bg-popover p-1 shadow-md">
            {(["to", "cc", "bcc"] as EmailMode[]).map((m) => (
              <button
                key={m}
                className={`relative flex w-full select-none items-center rounded-sm px-3 py-1.5 text-sm cursor-pointer ${mode === m ? "bg-accent font-medium" : "hover:bg-accent/50"}`}
                onClick={() => { setMode(m); setDropdownOpen(false); }}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-1">Compose Email</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sending to <span className="font-medium text-foreground">{emails.length}</span> recipients ({MODE_LABELS[mode]})
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body (optional)..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none h-28 mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setComposeOpen(false); setSubject(""); setBody(""); }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Open Email Client
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
