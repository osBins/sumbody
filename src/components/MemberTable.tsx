import { useState, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2, Pencil, Check, MessageCircle, Mail } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { SCHEMA_FIELDS, FIELD_LABELS } from "@/lib/schema";
import { formatDate } from "@/lib/utils";
import { EditableCell } from "@/components/EditableCell";
import { WhatsAppDialog } from "@/components/WhatsAppDialog";
import type { MemberRecord } from "@/types/member";

interface MemberTableProps {
  members: MemberRecord[];
  onDelete: (memberno: string, name: string) => void;
  onUpdate: (memberno: string, record: MemberRecord) => void;
}

const DATE_FIELDS = new Set(["MEMBERSHIPDATE", "DOB"]);
const LINK_FIELDS: Record<string, "mailto" | "tel"> = {
  EMAIL: "mailto",
  TELEPHONE: "tel",
  MOBILENO: "tel",
};

const ROW_HEIGHT = 36;

// Fixed column widths for alignment
const COL_WIDTHS: Record<string, number> = {
  ACTIONS: 110,
  MEMBERNO: 100,
  MEMBERSHIPDATE: 120,
  MEMCAT: 70,
  SAL: 60,
  NAME: 150,
  DOB: 100,
  AQUALI: 120,
  RADD1: 150,
  RADD2: 120,
  RADD3: 100,
  RADD4: 100,
  RCITY: 120,
  RPIN: 80,
  RSTATE: 120,
  DESIGNATION: 130,
  ORGANISATION_NAME: 160,
  PADD1: 150,
  PADD2: 120,
  PADD3: 100,
  PADD4: 100,
  PCITY: 120,
  PPIN: 80,
  PSTATE: 120,
  REGIONNAME: 130,
  TELEPHONE: 130,
  MOBILENO: 120,
  EMAIL: 180,
  TOTALDUES: 90,
};

const TOTAL_WIDTH = COL_WIDTHS.ACTIONS + SCHEMA_FIELDS.reduce((sum, f) => sum + (COL_WIDTHS[f] || 120), 0);

interface ContextMenuState {
  x: number;
  y: number;
  memberno: string;
  name: string;
  field?: string;
}

export function MemberTable({ members, onDelete, onUpdate }: MemberTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingCell, setEditingCell] = useState<{ memberno: string; field: string } | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<{ name: string; mobile: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const handleCellSave = (memberno: string, field: string, newValue: string) => {
    const member = members.find((m) => m.MEMBERNO === memberno);
    if (!member) return;
    const updatedRecord: MemberRecord = {
      ...member,
      [field]: field === "TOTALDUES" ? parseFloat(newValue) || 0 : newValue,
    };
    onUpdate(memberno, updatedRecord);
    setEditingCell(null);
  };

  const formatCellValue = (field: keyof MemberRecord, value: string | number): string => {
    if (DATE_FIELDS.has(field)) return formatDate(String(value));
    return String(value);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, memberno: string, name: string, field?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, memberno, name, field });
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("click", handleClick); document.removeEventListener("keydown", handleKeyDown); };
  }, []);

  const isCellEditable = (memberno: string, field: string) => {
    return editingRow === memberno || (editingCell?.memberno === memberno && editingCell?.field === field);
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
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {/* Inner container with fixed width for horizontal scroll */}
        <div style={{ width: `${TOTAL_WIDTH}px`, minWidth: "100%" }}>
          {/* Sticky header */}
          <div className="sticky top-0 z-20 bg-card border-b flex" style={{ height: `${ROW_HEIGHT}px` }}>
            <div
              className="shrink-0 flex items-center px-2 font-medium text-muted-foreground text-sm sticky left-0 z-30 bg-card border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]"
              style={{ width: `${COL_WIDTHS.ACTIONS}px` }}
            >
              Actions
            </div>
            {SCHEMA_FIELDS.map((field) => (
              <div
                key={field}
                className="shrink-0 flex items-center px-2 font-medium text-muted-foreground text-sm"
                style={{ width: `${COL_WIDTHS[field] || 120}px` }}
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

              return (
                <div
                  key={member.MEMBERNO}
                  className={`flex border-b border-border/40 hover:bg-muted/40 transition-colors ${isRowEditing ? "bg-muted/30" : isEven ? "bg-card" : "bg-accent/30"}`}
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    position: "absolute",
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: "100%",
                  }}
                >
                  {/* Actions cell */}
                  <div
                    className="shrink-0 flex items-center px-2 sticky left-0 z-10 bg-card border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]"
                    style={{ width: `${COL_WIDTHS.ACTIONS}px` }}
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
                      {member.EMAIL && (
                        <button
                          onClick={() => open(`mailto:${member.EMAIL}`)}
                          className="inline-flex items-center justify-center rounded-md p-1 text-blue-600 hover:bg-blue-100 transition-colors"
                          title={`Email ${member.NAME}`}
                        >
                          <Mail className="h-3.5 w-3.5" />
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
                      className="shrink-0 flex items-center px-2 text-sm font-normal overflow-hidden"
                      style={{ width: `${COL_WIDTHS[field] || 120}px` }}
                      onContextMenu={(e) => handleContextMenu(e, member.MEMBERNO, member.NAME, field)}
                    >
                      <EditableCell
                        value={formatCellValue(field, member[field])}
                        field={field}
                        memberno={member.MEMBERNO}
                        onSave={handleCellSave}
                        linkType={LINK_FIELDS[field]}
                        editable={isCellEditable(member.MEMBERNO, field)}
                      />
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
            className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.field && (
              <button
                className="relative flex w-full select-none items-center rounded-sm px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => {
                  setEditingCell({ memberno: contextMenu.memberno, field: contextMenu.field! });
                  setContextMenu(null);
                }}
              >
                Edit this cell
              </button>
            )}
            <button
              className="relative flex w-full select-none items-center rounded-sm px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => {
                setEditingRow(contextMenu.memberno);
                setContextMenu(null);
              }}
            >
              Edit entire row
            </button>
            {member?.MOBILENO && (
              <button
                className="relative flex w-full select-none items-center rounded-sm px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 cursor-pointer"
                onClick={() => { setWhatsappTarget({ name: member.NAME, mobile: member.MOBILENO }); setContextMenu(null); }}
              >
                WhatsApp
              </button>
            )}
            {member?.EMAIL && (
              <button
                className="relative flex w-full select-none items-center rounded-sm px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer"
                onClick={() => { open(`mailto:${member.EMAIL}`); setContextMenu(null); }}
              >
                Send Email
              </button>
            )}
            <button
              className="relative flex w-full select-none items-center rounded-sm px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={() => {
                onDelete(contextMenu.memberno, contextMenu.name);
                setContextMenu(null);
              }}
            >
              Delete member
            </button>
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
    </div>
  );
}
