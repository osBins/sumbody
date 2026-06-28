interface DateRangeFilterProps {
  label?: string;
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateRangeFilter({
  label = "Date Range",
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="space-y-2">
        <div className="relative">
          <input
            type="date"
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 pr-7 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Start date"
          />
          {startValue && (
            <button
              type="button"
              onClick={() => onStartChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear start date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="date"
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 pr-7 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="End date"
          />
          {endValue && (
            <button
              type="button"
              onClick={() => onEndChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear end date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
