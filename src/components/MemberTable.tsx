import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, Pencil, Check } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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

interface ContextMenuState {
  x: number;
  y: number;
  memberno: string;
  name: string;
  field?: string; // If right-clicked on a specific cell
}

export function MemberTable({ members, onDelete, onUpdate }: MemberTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editingCell, setEditingCell] = useState<{ memberno: string; field: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCellSave = (memberno: string, field: string, newValue: string) => {
    const member = members.find((m) => m.MEMBERNO === memberno);
    if (!member) return;

    const updatedRecord: MemberRecord = {
      ...member,
      [field]: field === "TOTALDUES" ? parseFloat(newValue) || 0 : newValue,
    };
    onUpdate(memberno, updatedRecord);
    // Clear single-cell editing after save
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

  // Close context menu on click outside or Escape
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

  return (
    <div className="overflow-x-auto rounded-md border relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap w-[80px] sticky left-0 z-10 bg-[hsl(var(--card))] border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">Actions</TableHead>
            {SCHEMA_FIELDS.map((field) => (
              <TableHead key={field} className="whitespace-nowrap">
                {FIELD_LABELS[field]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={SCHEMA_FIELDS.length + 1}
                className="h-24 text-center text-muted-foreground"
              >
                No members to display.
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const isRowEditing = editingRow === member.MEMBERNO;
              return (
                <TableRow key={member.MEMBERNO} className={`${isRowEditing ? "bg-muted/30" : "even:bg-muted/30"}`}>
                  <TableCell className="whitespace-nowrap sticky left-0 z-10 bg-[hsl(var(--card))] border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
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
                  </TableCell>
                  {SCHEMA_FIELDS.map((field) => (
                    <TableCell
                      key={field}
                      className="whitespace-nowrap max-w-[200px] [contain:content]"
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
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
