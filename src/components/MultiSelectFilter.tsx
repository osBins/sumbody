import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((v) => v !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const removeChip = (opt: string) => {
    onChange(selected.filter((v) => v !== opt));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="truncate text-muted-foreground">
            {selected.length === 0
              ? `Select ${label}...`
              : `${selected.length} selected`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selected.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {val}
                <button
                  type="button"
                  onClick={() => removeChip(val)}
                  className="ml-0.5 rounded-sm hover:bg-primary/20"
                  aria-label={`Remove ${val}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto px-1 pb-1">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggleOption(opt)}
                      className="h-3.5 w-3.5 rounded border-input"
                    />
                    <span className="truncate text-xs">{opt}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
