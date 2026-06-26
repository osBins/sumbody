import { useState, useCallback } from "react";
import type { ImportResult } from "@/types/member";
import { parseImportFile, type ParseResult } from "@/lib/file-parser";
import { importMembers } from "@/lib/tauri-commands";

export function useImport(onSuccess?: () => void) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setProgress(0);
      setResult(null);

      try {
        // Step 1: Parse the file (CSV or XLSX)
        const parseResult: ParseResult = await parseImportFile(file);

        // If there are no valid records, return early with only skipped info
        if (parseResult.valid.length === 0) {
          const emptyResult: ImportResult = {
            imported: 0,
            skipped: parseResult.skipped,
            updated: 0,
            errors: parseResult.errors,
          };
          setResult(emptyResult);
          setProgress(100);
          return emptyResult;
        }

        // Step 2: Send all valid records to the backend in one batch
        const backendResult = await importMembers(parseResult.valid);

        // Step 3: Combine parse-level skipped info with backend result
        const finalResult: ImportResult = {
          imported: backendResult.imported,
          skipped: parseResult.skipped + backendResult.skipped,
          updated: backendResult.updated,
          errors: [...parseResult.errors, ...backendResult.errors],
        };

        setResult(finalResult);
        setProgress(100);

        // Notify caller of successful import so they can refetch members
        onSuccess?.();

        return finalResult;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Import failed";
        const errorResult: ImportResult = {
          imported: 0,
          skipped: 0,
          updated: 0,
          errors: [errorMessage],
        };
        setResult(errorResult);
        return errorResult;
      } finally {
        setIsImporting(false);
      }
    },
    [onSuccess]
  );

  return { isImporting, progress, result, importFile };
}
