import { useState, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2, Pencil, Check, MessageCircle, Mail, MessageSquare, Phone, PhoneOutgoing, History, X, MapPin } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { toast } from "@/components/ui/use-toast";
import { SCHEMA_FIELDS, FIELD_LABELS } from "@/lib/schema";
import { formatDate } from "@/lib/utils";
import { EditableCell } from "@/components/EditableCell";
import { WhatsAppDialog } from "@/components/WhatsAppDialog";
import { LogCallDialog } from "@/components/LogCallDialog";
import { CallHistoryPanel } from "@/components/CallHistoryPanel";
import type { MemberRecord } from "@/types/member";

interface MemberTableProps {
  members: MemberRecord[];
  onDelete: (memberno: string, name: string) => void;
  onBulkDelete?: (membernos: string[]) => void;
  onUpdate: (memberno: string, record: MemberRecord) => void;
  scrollToMemberno?: string | null;
  scrollTrigger?: number;
  lastCallMap?: Record<string, string>;
  onCallLogChange?: () => void;
  memberNames?: Record<string, string>;
}

const DATE_FIELDS = new Set(["MEMBERSHIPDATE", "DOB"]);
const LINK_FIELDS: Record<string, "mailto" | "tel"> = {
  EMAIL: "mailto",
  TELEPHONE: "tel",
  MOBILENO: "tel",
};

const ROW_HEIGHT = 44;

// Fixed column widths for alignment
const COL_WIDTHS: Record<string, number> = {
  CHECKBOX: 36,
  ACTIONS: 200,
  MEMBERNO: 110,
  MEMBERSHIPDATE: 130,
  MEMCAT: 80,
  SAL: 65,
  NAME: 160,
  DOB: 110,
  AQUALI: 130,
  RADD1: 160,
  RADD2: 130,
  RADD3: 110,
  RADD4: 110,
  RCITY: 120,
  RPIN: 85,
  RSTATE: 120,
  DESIGNATION: 140,
  ORGANISATION_NAME: 170,
  PADD1: 160,
  PADD2: 130,
  PADD3: 110,
  PADD4: 110,
  PCITY: 120,
  PPIN: 85,
  PSTATE: 120,
  REGIONNAME: 130,
  TELEPHONE: 135,
  MOBILENO: 130,
  EMAIL: 190,
  TOTALDUES: 100,
};

const TOTAL_WIDTH = COL_WIDTHS.CHECKBOX + COL_WIDTHS.ACTIONS + SCHEMA_FIELDS.reduce((sum, f) => sum + (COL_WIDTHS[f] || 120), 0);

interface ContextMenuState {
  x: number;
  y: number;
  memberno: string;
  name: string;
}

export function MemberTable({ members, onDelete, onBulkDelete, onUpdate, scrollToMemberno, scrollTrigger, lastCallMap, onCallLogChange, memberNames }: MemberTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; mobile: string } | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [locationMenu, setLocationMenu] = useState<{ memberno: string; x: number; y: number } | null>(null);
  const [logCallTarget, setLogCallTarget] = useState<{ memberno: string; name: string } | null>(null);
  const [callHistoryTarget, setCallHistoryTarget] = useState<{ memberno: string; name: string } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkEmailMode, setBulkEmailMode] = useState<"to" | "cc" | "bcc">("bcc");
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");
  const [emailTarget, setEmailTarget] = useState<{ emails: string[]; name?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allSelected = members.length > 0 && selectedMembers.size === members.length;
  const someSelected = selectedMembers.size > 0 && selectedMembers.size < members.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.MEMBERNO)));
    }
  };

  const toggleSelect = (memberno: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberno)) {
        next.delete(memberno);
      } else {
        next.add(memberno);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedMembers(new Set());

  const handleBulkEmail = () => {
    const emails = members
      .filter((m) => selectedMembers.has(m.MEMBERNO) && m.EMAIL)
      .map((m) => m.EMAIL);
    if (emails.length === 0) {
      toast({ title: "No emails", description: "None of the selected members have an email address." });
      return;
    }
    setEmailTarget({ emails });
    setBulkEmailMode("bcc");
    setBulkEmailSubject("");
    setBulkEmailBody("");
    setBulkEmailOpen(true);
  };

  const handleSingleEmail = (email: string, name: string) => {
    setEmailTarget({ emails: [email], name });
    setBulkEmailMode("to");
    setBulkEmailSubject("");
    setBulkEmailBody(`CMA ${name} ji,\n\n`);
    setBulkEmailOpen(true);
  };

  const activeEmails = emailTarget?.emails || [];

  const handleEmailSend = (via: "client" | "gmail" | "yahoo") => {
    const emailList = activeEmails.join(",");
    if (via === "gmail") {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&${bulkEmailMode}=${encodeURIComponent(emailList)}&su=${encodeURIComponent(bulkEmailSubject)}&body=${encodeURIComponent(bulkEmailBody)}`;
      open(gmailUrl);
    } else if (via === "yahoo") {
      const yahooUrl = `https://compose.mail.yahoo.com/?${bulkEmailMode}=${encodeURIComponent(emailList)}&subject=${encodeURIComponent(bulkEmailSubject)}&body=${encodeURIComponent(bulkEmailBody)}`;
      open(yahooUrl);
    } else {
      let mailto = "mailto:";
      if (bulkEmailMode === "to") {
        mailto += emailList;
      } else {
        mailto += `?${bulkEmailMode}=${emailList}`;
      }
      const params: string[] = [];
      if (bulkEmailSubject) params.push(`subject=${encodeURIComponent(bulkEmailSubject)}`);
      if (bulkEmailBody) params.push(`body=${encodeURIComponent(bulkEmailBody)}`);
      if (params.length > 0) {
        mailto += (bulkEmailMode === "to" ? "?" : "&") + params.join("&");
      }
      open(mailto);
    }
    setBulkEmailOpen(false);
    setEmailTarget(null);
    setBulkEmailSubject("");
    setBulkEmailBody("");
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedMembers));
    }
    setSelectedMembers(new Set());
  };

  const rowVirtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  // Scroll to a specific member when requested
  useEffect(() => {
    if (!scrollToMemberno) return;
    const index = members.findIndex((m) => m.MEMBERNO === scrollToMemberno);
    if (index >= 0) {
      rowVirtualizer.scrollToIndex(index, { align: "center" });
      setHighlightedRow(scrollToMemberno);
      const timer = setTimeout(() => setHighlightedRow(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [scrollToMemberno, scrollTrigger, members, rowVirtualizer]);

  const handleCellSave = (memberno: string, field: string, newValue: string) => {
    const member = members.find((m) => m.MEMBERNO === memberno);
    if (!member) return;
    const updatedRecord: MemberRecord = {
      ...member,
      [field]: field === "TOTALDUES" ? parseFloat(newValue) || 0 : newValue,
    };
    onUpdate(memberno, updatedRecord);
  };

  const formatCellValue = (field: keyof MemberRecord, value: string | number): string => {
    if (DATE_FIELDS.has(field)) return formatDate(String(value));
    return String(value);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, memberno: string, name: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, memberno, name });
  }, []);

  useEffect(() => {
    const handleClick = () => { setContextMenu(null); setLocationMenu(null); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setEditingRow(null);
        setLocationMenu(null);
      }
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("click", handleClick); document.removeEventListener("keydown", handleKeyDown); };
  }, []);

  // Reposition context menu if it overflows the viewport
  useEffect(() => {
    if (!contextMenu || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { x, y } = contextMenu;

    if (rect.bottom > vh) {
      y = y - rect.height;
    }
    if (rect.right > vw) {
      x = x - rect.width;
    }
    if (y < 0) y = 4;
    if (x < 0) x = 4;

    if (x !== contextMenu.x || y !== contextMenu.y) {
      menu.style.top = `${y}px`;
      menu.style.left = `${x}px`;
    }
  }, [contextMenu]);

  const isCellEditable = (memberno: string) => {
    return editingRow === memberno;
  };

  const formatLastCall = (dateStr: string): string => {
    const callDate = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - callDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1d ago";
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground">
        No members to display.
      </div>
    );
  }

  return (
    <div className="rounded-md border relative h-full flex flex-col">
      {/* Selection toolbar */}
      {selectedMembers.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b">
          <span className="text-sm font-medium text-primary">
            {selectedMembers.size} selected
          </span>
          <button
            type="button"
            onClick={handleBulkEmail}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          {onBulkDelete && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Deselect all
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-auto">
        {/* Inner container with fixed width for horizontal scroll */}
        <div style={{ width: `${TOTAL_WIDTH}px`, minWidth: "100%" }}>
          {/* Sticky header */}
          <div className="sticky top-0 z-20 bg-card border-b flex" style={{ height: `${ROW_HEIGHT}px` }}>
            <div
              className="shrink-0 flex items-center justify-center sticky left-0 z-30 bg-card border-r border-border overflow-hidden"
              style={{ width: `${COL_WIDTHS.CHECKBOX}px` }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                title="Select all"
              />
            </div>
            <div
              className="shrink-0 flex items-center px-3 font-medium text-muted-foreground text-sm sticky z-30 bg-card border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]"
              style={{ width: `${COL_WIDTHS.ACTIONS}px`, left: `${COL_WIDTHS.CHECKBOX}px` }}
            >
              Actions
            </div>
            {SCHEMA_FIELDS.map((field) => (
              <div
                key={field}
                className={`shrink-0 flex items-center px-3 font-medium text-muted-foreground text-sm ${field === "NAME" ? "sticky z-30 bg-card border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]" : ""}`}
                style={{
                  width: `${COL_WIDTHS[field] || 120}px`,
                  ...(field === "NAME" ? { left: `${COL_WIDTHS.CHECKBOX + COL_WIDTHS.ACTIONS}px` } : {}),
                }}
              >
                {FIELD_LABELS[field]}
              </div>
            ))}
          </div>

          {/* Virtualized rows */}
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const member = members[virtualRow.index];
              const isRowEditing = editingRow === member.MEMBERNO;
              const isEven = virtualRow.index % 2 === 0;

              const stickyBg = highlightedRow === member.MEMBERNO
                ? "bg-blue-50 dark:bg-blue-950"
                : isRowEditing
                ? "bg-yellow-50 dark:bg-yellow-950"
                : isEven
                ? "bg-white dark:bg-zinc-900"
                : "bg-gray-50 dark:bg-zinc-800";

              return (
                <div
                  key={member.MEMBERNO}
                  className={`flex border-b border-border/40 group hover:bg-muted/40 transition-colors ${highlightedRow === member.MEMBERNO ? "bg-primary/10 ring-1 ring-primary/30" : isRowEditing ? "bg-yellow-50 ring-1 ring-yellow-300 dark:bg-yellow-950/30 dark:ring-yellow-700" : isEven ? "bg-card" : "bg-accent/50"}`}
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    position: "absolute",
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: "100%",
                  }}
                >
                  {/* Checkbox cell */}
                  <div
                    className={`shrink-0 flex items-center justify-center sticky left-0 z-10 ${stickyBg} border-r border-border group-hover:bg-muted transition-colors overflow-hidden`}
                    style={{ width: `${COL_WIDTHS.CHECKBOX}px` }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member.MEMBERNO)}
                      onChange={() => toggleSelect(member.MEMBERNO)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </div>
                  {/* Actions cell */}
                  <div
                    className={`shrink-0 flex items-center px-3 sticky z-10 ${stickyBg} border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] group-hover:bg-muted transition-colors`}
                    style={{ width: `${COL_WIDTHS.ACTIONS}px`, left: `${COL_WIDTHS.CHECKBOX}px` }}
                  >
                    <div className="flex items-center gap-0.5">
                      {isRowEditing ? (
                        <button
                          onClick={() => setEditingRow(null)}
                          className="inline-flex items-center justify-center rounded-md p-1 text-green-600 hover:bg-green-100 transition-colors"
                          title="Done editing"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingRow(member.MEMBERNO)}
                          className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Edit row"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {member.MOBILENO && (
                        <button
                          onClick={() => setWhatsappTarget({ name: member.NAME, mobile: member.MOBILENO })}
                          className="inline-flex items-center justify-center rounded-md p-1 text-green-600 hover:bg-green-100 transition-colors"
                          title={`WhatsApp ${member.NAME}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {member.MOBILENO && (
                        <button
                          onClick={() => {
                            const digits = member.MOBILENO.replace(/[^0-9]/g, "");
                            const number = digits.length === 10 ? `+91${digits}` : digits;
                            open(`tel:${number}`);
                          }}
                          className="inline-flex items-center justify-center rounded-md p-1 text-primary hover:bg-primary/10 transition-colors"
                          title={`Call ${member.NAME}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {member.EMAIL && (
                        <button
                          onClick={() => handleSingleEmail(member.EMAIL, member.NAME)}
                          className="inline-flex items-center justify-center rounded-md p-1 text-blue-600 hover:bg-blue-100 transition-colors"
                          title={`Email ${member.NAME}`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {member.MOBILENO && (
                        <button
                          onClick={() => {
                            const digits = member.MOBILENO.replace(/[^0-9]/g, "");
                            const number = digits.length === 10 ? `+91${digits}` : digits;
                            open(`sms:${number}?body=${encodeURIComponent(`CMA ${member.NAME} ji, `)}`);
                            toast({ title: "SMS", description: "Opening SMS. If nothing happens, configure Windows Phone Link." });
                          }}
                          className="inline-flex items-center justify-center rounded-md p-1 text-orange-600 hover:bg-orange-100 transition-colors"
                          title={`SMS ${member.NAME}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(member.RADD1 || member.RCITY || member.PADD1 || member.PCITY) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationMenu({ memberno: member.MEMBERNO, x: e.clientX, y: e.clientY });
                          }}
                          className="inline-flex items-center justify-center rounded-md p-1 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="View on Maps"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(member.MEMBERNO, member.NAME)}
                        className="inline-flex items-center justify-center rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Data cells */}
                  {SCHEMA_FIELDS.map((field) => (
                    <div
                      key={field}
                      className={`shrink-0 flex items-center px-3 text-sm font-normal overflow-hidden ${field === "NAME" ? `sticky z-10 ${stickyBg} border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] group-hover:bg-muted transition-colors` : ""}`}
                      style={{
                        width: `${COL_WIDTHS[field] || 120}px`,
                        ...(field === "NAME" ? { left: `${COL_WIDTHS.CHECKBOX + COL_WIDTHS.ACTIONS}px` } : {}),
                      }}
                      onContextMenu={(e) => handleContextMenu(e, member.MEMBERNO, member.NAME)}
                    >
                      <EditableCell
                        value={formatCellValue(field, member[field])}
                        field={field}
                        memberno={member.MEMBERNO}
                        onSave={handleCellSave}
                        linkType={LINK_FIELDS[field]}
                        editable={isCellEditable(member.MEMBERNO)}
                      />
                      {field === "NAME" && lastCallMap && lastCallMap[member.MEMBERNO] && (
                        <span className="ml-1 text-[10px] text-muted-foreground/60 whitespace-nowrap shrink-0" title={`Last call: ${lastCallMap[member.MEMBERNO]}`}>
                          📞{formatLastCall(lastCallMap[member.MEMBERNO])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const member = members.find((m) => m.MEMBERNO === contextMenu.memberno);
        return (
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => {
                setEditingRow(contextMenu.memberno);
                setContextMenu(null);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit row
            </button>
            {member?.MOBILENO && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 cursor-pointer"
                onClick={() => { setWhatsappTarget({ name: member.NAME, mobile: member.MOBILENO }); setContextMenu(null); }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            )}
            {member?.MOBILENO && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-primary hover:bg-primary/10 cursor-pointer"
                onClick={() => {
                  const digits = member.MOBILENO.replace(/[^0-9]/g, "");
                  const number = digits.length === 10 ? `+91${digits}` : digits;
                  open(`tel:${number}`);
                  setContextMenu(null);
                }}
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </button>
            )}
            {member?.EMAIL && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
                onClick={() => { handleSingleEmail(member.EMAIL, member.NAME); setContextMenu(null); }}
              >
                <Mail className="h-3.5 w-3.5" />
                Send Email
              </button>
            )}
            {member?.MOBILENO && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 cursor-pointer"
                onClick={() => {
                  const digits = member.MOBILENO.replace(/[^0-9]/g, "");
                  const number = digits.length === 10 ? `+91${digits}` : digits;
                  open(`sms:${number}?body=${encodeURIComponent(`CMA ${member.NAME} ji, `)}`);
                  toast({ title: "SMS", description: "Opening SMS. If nothing happens, configure Windows Phone Link." });
                  setContextMenu(null);
                }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Send SMS
              </button>
            )}
            <button
              className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-primary hover:bg-primary/10 cursor-pointer"
              onClick={() => {
                setLogCallTarget({ memberno: contextMenu.memberno, name: contextMenu.name });
                setContextMenu(null);
              }}
            >
              <PhoneOutgoing className="h-3.5 w-3.5" />
              Log Call
            </button>
            <button
              className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-primary hover:bg-primary/10 cursor-pointer"
              onClick={() => {
                setCallHistoryTarget({ memberno: contextMenu.memberno, name: contextMenu.name });
                setContextMenu(null);
              }}
            >
              <History className="h-3.5 w-3.5" />
              Call History
            </button>
            {member && (member.RADD1 || member.RCITY || member.RSTATE) && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                onClick={() => {
                  const parts = [member.RADD1, member.RADD2, member.RADD3, member.RADD4, member.RCITY, member.RSTATE, member.RPIN].filter(Boolean);
                  open(`https://www.google.com/maps/search/${encodeURIComponent(parts.join(", "))}`);
                  setContextMenu(null);
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Maps (Residential)
              </button>
            )}
            {member && (member.PADD1 || member.PCITY || member.PSTATE) && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                onClick={() => {
                  const parts = [member.PADD1, member.PADD2, member.PADD3, member.PADD4, member.PCITY, member.PSTATE, member.PPIN].filter(Boolean);
                  open(`https://www.google.com/maps/search/${encodeURIComponent(parts.join(", "))}`);
                  setContextMenu(null);
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Maps (Professional)
              </button>
            )}
            <button
              className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={() => {
                onDelete(contextMenu.memberno, contextMenu.name);
                setContextMenu(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete member
            </button>
          </div>
        );
      })()}

      {/* Location Menu */}
      {locationMenu && (() => {
        const member = members.find((m) => m.MEMBERNO === locationMenu.memberno);
        if (!member) return null;
        const hasRes = member.RADD1 || member.RCITY || member.RSTATE;
        const hasProf = member.PADD1 || member.PCITY || member.PSTATE;
        return (
          <div
            className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ top: locationMenu.y, left: locationMenu.x }}
          >
            {hasRes && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                onClick={() => {
                  const parts = [member.RADD1, member.RADD2, member.RADD3, member.RADD4, member.RCITY, member.RSTATE, member.RPIN].filter(Boolean);
                  open(`https://www.google.com/maps/search/${encodeURIComponent(parts.join(", "))}`);
                  setLocationMenu(null);
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Residential
              </button>
            )}
            {hasProf && (
              <button
                className="relative flex w-full select-none items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                onClick={() => {
                  const parts = [member.PADD1, member.PADD2, member.PADD3, member.PADD4, member.PCITY, member.PSTATE, member.PPIN].filter(Boolean);
                  open(`https://www.google.com/maps/search/${encodeURIComponent(parts.join(", "))}`);
                  setLocationMenu(null);
                }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Professional
              </button>
            )}
          </div>
        );
      })()}

      {/* WhatsApp Compose Dialog */}
      {whatsappTarget && (
        <WhatsAppDialog
          open={!!whatsappTarget}
          onOpenChange={(isOpen) => { if (!isOpen) setWhatsappTarget(null); }}
          name={whatsappTarget.name}
          mobile={whatsappTarget.mobile}
        />
      )}

      {/* Log Call Dialog */}
      {logCallTarget && (
        <LogCallDialog
          open={!!logCallTarget}
          onOpenChange={(isOpen) => { if (!isOpen) setLogCallTarget(null); }}
          memberno={logCallTarget.memberno}
          name={logCallTarget.name}
          onSuccess={() => { setLogCallTarget(null); onCallLogChange?.(); }}
        />
      )}

      {/* Call History Panel */}
      {callHistoryTarget && (
        <CallHistoryPanel
          open={!!callHistoryTarget}
          onOpenChange={(isOpen) => { if (!isOpen) setCallHistoryTarget(null); }}
          memberno={callHistoryTarget.memberno}
          name={callHistoryTarget.name}
          memberNames={memberNames}
        />
      )}

      {/* Email Compose Dialog */}
      {bulkEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setBulkEmailOpen(false); setEmailTarget(null); setBulkEmailSubject(""); setBulkEmailBody(""); }}>
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setBulkEmailOpen(false); setEmailTarget(null); setBulkEmailSubject(""); setBulkEmailBody(""); }}
              className="absolute top-4 right-4 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold mb-1">Compose Email</h3>
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
              {emailTarget?.name
                ? <>To: <span className="font-medium text-foreground">{emailTarget.name}</span> ({activeEmails[0]})</>
                : <>Sending to <span className="font-medium text-foreground">{activeEmails.length}</span> recipients</>
              }
              <button
                onClick={() => { navigator.clipboard.writeText(activeEmails.join(", ")); toast({ title: "Copied", description: `${activeEmails.length} email(s) copied.` }); }}
                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Copy email addresses"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </p>
            <div className="space-y-3">
              {!emailTarget?.name && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mode</label>
                  <div className="flex gap-2 mt-1">
                    {(["to", "cc", "bcc"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBulkEmailMode(m)}
                        className={`rounded-md px-3 py-1 text-sm font-medium border transition-colors ${bulkEmailMode === m ? "bg-primary text-primary-foreground border-primary" : "border-input bg-background hover:bg-accent"}`}
                      >
                        {m.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <input
                  type="text"
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Body</label>
                <textarea
                  value={bulkEmailBody}
                  onChange={(e) => setBulkEmailBody(e.target.value)}
                  placeholder="Email body (optional)..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none h-28 mt-1"
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 mt-4">
              <button
                onClick={() => handleEmailSend("gmail")}
                className="inline-flex items-center gap-1.5 justify-center rounded-md text-sm font-medium h-9 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M22 6L12 13 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                Gmail
              </button>
              <button
                onClick={() => handleEmailSend("yahoo")}
                className="inline-flex items-center gap-1.5 justify-center rounded-md text-sm font-medium h-9 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14l5.5-9h-3l-3.5 6-3.5-6h-3l5.5 9v5h2v-5z"/></svg>
                Yahoo
              </button>
              <button
                onClick={() => { setBulkEmailOpen(false); setEmailTarget(null); setBulkEmailSubject(""); setBulkEmailBody(""); }}
                className="inline-flex items-center gap-1.5 justify-center rounded-md text-sm font-medium h-9 px-3 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
