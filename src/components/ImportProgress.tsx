import { ImportResult } from "@/types/member";
import { cn } from "@/lib/utils";

interface ImportProgressProps {
  isImporting: boolean;
  progress: number;
  result: ImportResult | null;
}

export function ImportProgress({
  isImporting,
  progress,
  result,
}: ImportProgressProps) {
  if (!isImporting && !result) return null;

  return (
    <div className="w-full space-y-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      {isImporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Importing...</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
              )}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}

      {!isImporting && result && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-green-600">Import Complete</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{result.imported}</span> imported
            </span>
            <span>
              <span className="font-medium text-foreground">{result.updated}</span> updated
            </span>
            <span>
              <span className="font-medium text-foreground">{result.skipped}</span> skipped
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
