import { useState, useRef, useEffect } from "react";

type LinkType = "mailto" | "tel" | undefined;

interface EditableCellProps {
  value: string;
  field: string;
  memberno: string;
  onSave: (memberno: string, field: string, newValue: string) => void;
  linkType?: LinkType;
  editable: boolean;
}

export function EditableCell({ value, field, memberno, onSave, linkType, editable }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Exit edit mode when row switches to non-editable
  useEffect(() => {
    if (!editable) {
      setIsEditing(false);
      setEditValue(value);
    }
  }, [editable, value]);

  const handleSave = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(memberno, field, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing && editable) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full min-w-[60px] rounded border border-input bg-background px-2 py-1 text-sm"
      />
    );
  }

  // Render clickable link for email/phone fields
  if (linkType && value) {
    const href = linkType === "mailto" ? `mailto:${value}` : `tel:${value}`;
    return (
      <span className="flex items-center gap-1 min-w-[40px] max-w-[180px]">
        <a
          href={href}
          className="text-primary underline underline-offset-2 text-sm truncate hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
        {editable && (
          <button
            onClick={() => setIsEditing(true)}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </span>
    );
  }

  // Editable mode: click to edit
  if (editable) {
    return (
      <span
        onClick={() => setIsEditing(true)}
        className="cursor-pointer truncate block max-w-[180px] min-w-[40px] px-1 py-0.5 rounded hover:bg-muted border border-transparent hover:border-input"
        title="Click to edit"
      >
        {value || "\u00A0"}
      </span>
    );
  }

  // Read-only mode: show full value on hover via title
  return (
    <span
      className="truncate block max-w-[180px] min-w-[40px] px-1 py-0.5 select-all"
      title={value}
    >
      {value || "\u00A0"}
    </span>
  );
}
