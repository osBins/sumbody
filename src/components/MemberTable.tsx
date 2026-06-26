import { useState, useRef, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2, Pencil, Check } from "lucide-react";
import { SCHEMA_FIELDS, FIELD_LABELS } from "@/lib/schema";
import { formatDate } from "@/lib/utils";
import { EditableCell } from "@/components/EditableCell";
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

const ROW_HEIGHT = 40;

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
  const menuRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
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
    if (DATE_FIELDS.has(field)) {
      return formatDate(String(value));
    }
    return String(value);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, memberno: string, name: string, field?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, memberno, name, field });
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
    <div className="rounded-md border relative flex flex-col h-full">
      {/* Fixed header */}
      <div className="overflow-x-auto shrink-0 border-b">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-card">
              <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap w-[80px] sticky left-0 z-10 bg-[hsl(var(--card))] border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                Actions
              </th>
              {SCHEMA_FIELDS.map((field) => (
                <th key={field} className="h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                  {FIELD_LABELS[field]}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized scrollable body */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
        >
          <table className="w-full text-sm" style={{ tableLayout: "auto" }}>
            <tbody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const member = members[virtualRow.index];
                const isRowEditing = editingRow === member.MEMBERNO;
                const isEven = virtualRow.index % 2 === 0;

                return (
                  <tr
                    key={member.MEMBERNO}
                    className={`border-b transition-colors ${isRowEditing ? "bg-muted/30" : isEven ? "" : "bg-muted/20"}`}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td className="p-2 align-middle whitespace-nowrap w-[80px] sticky left-0 z-10 bg-[hsl(var(--card))] border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-1">
                        {isRowEditing ? (
                          <button
                            onClick={() => setEditingRow(null)}
                            className="inline-flex items-center justify-center rounded-md p-1.5 text-green-600 hover:bg-green-100 transition-colors"
                            aria-label="Done editing"
                            title="Done editing"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingRow(member.MEMBERNO)}
                            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            aria-label={`Edit member ${member.NAME}`}
                            title="Edit row"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(member.MEMBERNO, member.NAME)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={`Delete member ${member.NAME}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    {SCHEMA_FIELDS.map((field) => (
                      <td
                        key={field}
                        className="p-2 align-middle whitespace-nowrap max-w-[200px] [contain:content]"
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
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
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
      )}
    </div>
  );
}
