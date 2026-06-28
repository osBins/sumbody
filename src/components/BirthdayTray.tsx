import { useMemo, useState } from "react";
import { Cake, ChevronDown, ChevronUp } from "lucide-react";
import { parseDate } from "@/lib/utils";
import type { MemberRecord } from "@/types/member";

interface BirthdayTrayProps {
  members: MemberRecord[];
}

const SHOW_INLINE = 3; // Show this many names inline before collapsing

export function BirthdayTray({ members }: BirthdayTrayProps) {
  const [expanded, setExpanded] = useState(false);

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
        {birthdayMembers.length > SHOW_INLINE && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 inline-flex items-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={expanded ? "Collapse" : "Show all"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {expanded && birthdayMembers.length > SHOW_INLINE && (
        <div className="mt-2 pl-6 text-sm text-foreground max-h-[120px] overflow-y-auto space-y-0.5">
          {birthdayMembers.map((m) => (
            <div key={m.MEMBERNO}>
              {m.NAME || "Unknown"} ({m.MEMBERNO})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
