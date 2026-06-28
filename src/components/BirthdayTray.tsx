import { useMemo, useState } from "react";
import { Cake, MessageCircle, Mail } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { parseDate } from "@/lib/utils";
import { WhatsAppDialog } from "@/components/WhatsAppDialog";
import type { MemberRecord } from "@/types/member";

interface BirthdayTrayProps {
  members: MemberRecord[];
  onScrollToMember?: (memberno: string) => void;
}

const SHOW_INLINE = 3;

export function BirthdayTray({ members, onScrollToMember }: BirthdayTrayProps) {
  const [expanded, setExpanded] = useState(false);
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; mobile: string } | null>(null);

  const birthdayMembers = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return members.filter((m) => {
      if (!m.DOB) return false;
      const dob = parseDate(m.DOB);
      if (!dob) return false;
      return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
    });
  }, [members]);

  if (birthdayMembers.length === 0) return null;

  const inlineNames = birthdayMembers
    .slice(0, SHOW_INLINE)
    .map((m) => `${m.NAME || "Unknown"} (${m.MEMBERNO})`);
  const remainingCount = birthdayMembers.length - SHOW_INLINE;

  return (
    <>
      <div className="rounded-lg border border-primary/20 bg-accent px-4 py-2">
        <div className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-primary">
            Today's birthdays ({birthdayMembers.length}):
          </span>
          <span className="text-sm text-foreground truncate">
            {inlineNames.join(", ")}
            {remainingCount > 0 && !expanded && (
              <span className="text-muted-foreground"> +{remainingCount} more</span>
            )}
          </span>
          {birthdayMembers.length > SHOW_INLINE && !expanded && (
            <span className="text-muted-foreground text-sm"> +{remainingCount} more</span>
          )}
          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {expanded ? (
              <button
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                ✕ Close
              </button>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                🎉 Wish them!
              </button>
            )}
          </div>
        </div>
        {expanded && (
          <div className="mt-2 pl-6 text-sm text-foreground max-h-[150px] overflow-y-auto space-y-1">
            {birthdayMembers.map((m) => (
              <div key={m.MEMBERNO} className="flex items-center gap-2">
                <button
                  onClick={() => onScrollToMember?.(m.MEMBERNO)}
                  className="text-left hover:text-primary hover:underline transition-colors"
                >
                  {m.NAME || "Unknown"} ({m.MEMBERNO})
                </button>
                {m.MOBILENO && (
                  <button
                    onClick={() => setWhatsappTarget({ name: m.NAME, mobile: m.MOBILENO })}
                    className="inline-flex items-center rounded p-0.5 text-green-600 hover:bg-green-100 transition-colors"
                    title={`WhatsApp ${m.NAME}`}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </button>
                )}
                {m.MOBILENO && (
                  <button
                    onClick={() => open(`tel:${m.MOBILENO}`)}
                    className="inline-flex items-center rounded p-0.5 text-muted-foreground hover:bg-muted transition-colors"
                    title={`Call ${m.NAME}`}
                  >
                    📞
                  </button>
                )}
                {m.EMAIL && (
                  <button
                    onClick={() => open(`mailto:${m.EMAIL}?subject=${encodeURIComponent("Happy Birthday!")}`)}
                    className="inline-flex items-center rounded p-0.5 text-blue-600 hover:bg-blue-100 transition-colors"
                    title={`Email ${m.NAME}`}
                  >
                    <Mail className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {whatsappTarget && (
        <WhatsAppDialog
          open={!!whatsappTarget}
          onOpenChange={(isOpen) => { if (!isOpen) setWhatsappTarget(null); }}
          name={whatsappTarget.name}
          mobile={whatsappTarget.mobile}
        />
      )}
    </>
  );
}
