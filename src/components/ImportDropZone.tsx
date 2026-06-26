import { useState, useCallback, useRef } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface ImportDropZoneProps {
  onFileDrop: (file: File) => void;
  disabled?: boolean;
}

export function ImportDropZone({ onFileDrop, disabled }: ImportDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      // Accept any file — the parser will handle it or report errors
      onFileDrop(files[0]);
    },
    [onFileDrop, disabled]
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const files = e.target.files;
      if (!files || files.length === 0) return;
      onFileDrop(files[0]);
      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [onFileDrop, disabled]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer bg-card",
        isDragOver
          ? "border-primary bg-accent text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2 h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="text-sm font-medium">
        {isDragOver
          ? "Drop file to import"
          : "Drag & drop a file here, or click to browse"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Supports .xlsx, .xls, and .csv files
      </p>
    </div>
  );
}
