import { useState, useCallback } from "react";
import type { ImportResult } from "@/types/member";
import { parseImportFile, type ParseResult } from "@/lib/file-parser";
import { importMembers, getAllMembers } from "@/lib/tauri-commands";

export interface PendingImport {
  file: File;
  parseResult: ParseResult;
  newCount: number;
  updateCount: number;
}

export function useImport(onSuccess?: () => void) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);

  // Step 1: Parse file and compute what will happen (without importing)
  const prepareImport = useCallback(
    async (file: File) => {
      setResult(null);

      try {
        const parseResult: ParseResult = await parseImportFile(file);

        if (parseResult.valid.length === 0) {
          // Nothing to import — show result immediately
          const emptyResult: ImportResult = {
            imported: 0,
            skipped: parseResult.skipped,
            updated: 0,
            errors: parseResult.errors.length > 0
              ? parseResult.errors
              : ["No valid records found in file"],
          };
          setResult(emptyResult);
          return;
        }

        // Check how many records already exist in DB
        const existingMembers = await getAllMembers();
        const existingIds = new Set(existingMembers.map((m) => m.MEMBERNO));

        let newCount = 0;
        let updateCount = 0;
        for (const record of parseResult.valid) {
          if (existingIds.has(record.MEMBERNO)) {
            updateCount++;
          } else {
            newCount++;
          }
        }

        setPending({ file, parseResult, newCount, updateCount });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to parse file";
        setResult({
          imported: 0,
          skipped: 0,
          updated: 0,
          errors: [errorMessage],
        });
      }
    },
    []
  );

  // Step 2: User confirms → actually run the import
  const confirmImport = useCallback(async () => {
    if (!pending) return;

    setIsImporting(true);
    setProgress(0);
    setPending(null);

    try {
      const backendResult = await importMembers(pending.parseResult.valid);

      const finalResult: ImportResult = {
        imported: backendResult.imported,
        skipped: pending.parseResult.skipped + backendResult.skipped,
        updated: backendResult.updated,
        errors: [...pending.parseResult.errors, ...backendResult.errors],
      };

      setResult(finalResult);
      setProgress(100);
      onSuccess?.();

      return finalResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Import failed";
      setResult({
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: [errorMessage],
      });
    } finally {
      setIsImporting(false);
    }
  }, [pending, onSuccess]);

  // User cancels the pending import
  const cancelImport = useCallback(() => {
    setPending(null);
  }, []);

  return { isImporting, progress, result, pending, prepareImport, confirmImport, cancelImport };
}
