import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import type { MemberRecord } from "@/types/member";

export interface ParseResult {
  valid: MemberRecord[];
  skipped: number;
  errors: string[];
}

/**
 * Maps a raw record (from CSV or XLSX) to a MemberRecord.
 * Very forgiving — any missing field defaults to empty string or 0.
 * Handles case-insensitive header matching.
 */
function mapRowToMember(raw: Record<string, string>): MemberRecord {
  // Build a case-insensitive lookup
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    record[key.trim().toUpperCase()] = value != null ? String(value) : "";
  }

  return {
    MEMBERNO: (record["MEMBERNO"] ?? "").trim(),
    MEMBERSHIPDATE: record["MEMBERSHIPDATE"] ?? "",
    MEMCAT: record["MEMCAT"] ?? "",
    SAL: record["SAL"] ?? "",
    NAME: record["NAME"] ?? "",
    DOB: record["DOB"] ?? "",
    AQUALI: record["AQUALI"] ?? "",
    RADD1: record["RADD1"] ?? "",
    RADD2: record["RADD2"] ?? "",
    RADD3: record["RADD3"] ?? "",
    RADD4: record["RADD4"] ?? "",
    RCITY: record["RCITY"] ?? "",
    RPIN: record["RPIN"] ?? "",
    RSTATE: record["RSTATE"] ?? "",
    DESIGNATION: record["DESIGNATION"] ?? "",
    ORGANISATION_NAME: record["ORGANISATION_NAME"] ?? "",
    PADD1: record["PADD1"] ?? "",
    PADD2: record["PADD2"] ?? "",
    PADD3: record["PADD3"] ?? "",
    PADD4: record["PADD4"] ?? "",
    PCITY: record["PCITY"] ?? "",
    PPIN: record["PPIN"] ?? "",
    PSTATE: record["PSTATE"] ?? "",
    REGIONNAME: record["REGIONNAME"] ?? "",
    TELEPHONE: record["TELEPHONE"] ?? "",
    MOBILENO: record["MOBILENO"] ?? "",
    EMAIL: record["EMAIL"] ?? "",
    TOTALDUES: parseFloat(record["TOTALDUES"]) || 0,
  };
}

function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const valid: MemberRecord[] = [];
    const errors: string[] = [];
    let skipped = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step(row) {
        try {
          const member = mapRowToMember(row.data as Record<string, string>);
          if (!member.MEMBERNO) {
            skipped++;
            return;
          }
          valid.push(member);
        } catch {
          skipped++;
          errors.push(`Row skipped due to parse error`);
        }
      },
      complete() {
        resolve({ valid, skipped, errors });
      },
      error(err) {
        resolve({ valid, skipped, errors: [...errors, `Parse error: ${err.message}`] });
      },
    });
  });
}

async function parseXLSX(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  if (workbook.SheetNames.length === 0) {
    return { valid: [], skipped: 0, errors: ["Empty workbook — no sheets found"] };
  }

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
    header: 1,
    raw: false, // Get everything as strings for consistency
    defval: "",
  });

  if (rows.length === 0) {
    return { valid: [], skipped: 0, errors: ["Empty spreadsheet"] };
  }

  // First row is headers — normalize them (trim + uppercase for matching)
  const headers = (rows[0] as (string | number | null)[]).map((h) =>
    String(h ?? "").trim()
  );

  const valid: MemberRecord[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !cell && cell !== 0)) {
      continue; // Skip completely empty rows
    }

    try {
      const record: Record<string, string> = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] != null ? String(row[idx]) : "";
      });

      const member = mapRowToMember(record);
      if (!member.MEMBERNO) {
        skipped++;
        errors.push(`Row ${i + 1}: Missing MEMBERNO, skipped`);
        continue;
      }

      valid.push(member);
    } catch {
      skipped++;
      errors.push(`Row ${i + 1}: Parse error, skipped`);
    }
  }

  return { valid, skipped, errors };
}

/**
 * Parses an import file. Tries XLSX first for Excel-like extensions,
 * falls back to CSV for everything else. Very forgiving about formats.
 */
export async function parseImportFile(file: File): Promise<ParseResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  try {
    if (["xlsx", "xls", "xlsm", "xlsb"].includes(extension)) {
      return await parseXLSX(file);
    }

    // For CSV and anything else, try PapaParse (handles TSV, txt, etc.)
    return await parseCSV(file);
  } catch (err) {
    // Last resort: if something totally unexpected goes wrong, report it
    const message = err instanceof Error ? err.message : "Unknown error parsing file";
    return { valid: [], skipped: 0, errors: [message] };
  }
}
