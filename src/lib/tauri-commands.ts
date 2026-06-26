import { invoke } from "@tauri-apps/api/core";
import type { MemberRecord, ImportResult } from "@/types/member";

/**
 * Transforms a Tauri invoke error into a consistent Error object.
 */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  return new Error("An unknown error occurred");
}

/**
 * Initializes the SQLite database and creates the members table if it doesn't exist.
 */
export async function initDatabase(): Promise<void> {
  try {
    await invoke("init_database");
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Returns the absolute filesystem path to the SQLite database file.
 */
export async function getDbPath(): Promise<string> {
  try {
    return await invoke<string>("get_db_path");
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Fetches all member records from the database.
 */
export async function getAllMembers(): Promise<MemberRecord[]> {
  try {
    return await invoke<MemberRecord[]>("get_all_members");
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Imports (upserts) member records into the database in a single transaction.
 */
export async function importMembers(
  records: MemberRecord[]
): Promise<ImportResult> {
  try {
    return await invoke<ImportResult>("import_members", { records });
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Updates an existing member record. The original memberno is used to locate
 * the record, and the full updated record replaces it.
 */
export async function updateMember(
  memberno: string,
  record: MemberRecord
): Promise<void> {
  try {
    await invoke("update_member", { memberno, record });
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Creates a new member record. MEMBERNO must be non-empty and unique.
 */
export async function createMember(record: MemberRecord): Promise<void> {
  try {
    await invoke("create_member", { record });
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Deletes a member record by MEMBERNO.
 */
export async function deleteMember(memberno: string): Promise<void> {
  try {
    await invoke("delete_member", { memberno });
  } catch (err) {
    throw toError(err);
  }
}
