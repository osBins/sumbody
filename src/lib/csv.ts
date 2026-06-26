import Papa from "papaparse";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { SCHEMA_FIELDS } from "@/lib/schema";
import type { MemberRecord } from "@/types/member";

export async function exportToCSV(members: MemberRecord[]): Promise<void> {
  const csv = Papa.unparse(members, { columns: SCHEMA_FIELDS as unknown as string[] });
  const filePath = await save({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    defaultPath: "members_export.csv",
  });
  if (filePath) {
    await writeTextFile(filePath, csv);
  }
}
