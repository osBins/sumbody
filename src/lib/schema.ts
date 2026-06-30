import type { MemberRecord } from "@/types/member";

export const SCHEMA_FIELDS: (keyof MemberRecord)[] = [
  // Identity
  "NAME",
  "SAL",
  "MEMBERNO",
  // Contact
  "MOBILENO",
  "TELEPHONE",
  "EMAIL",
  // Residential Address
  "RCITY",
  "RSTATE",
  "RPIN",
  "RADD1",
  "RADD2",
  "RADD3",
  "RADD4",
  // Professional Info
  "DESIGNATION",
  "ORGANISATION_NAME",
  "PCITY",
  "PSTATE",
  "PPIN",
  "PADD1",
  "PADD2",
  "PADD3",
  "PADD4",
  // Membership & Qualifications
  "MEMCAT",
  "MEMBERSHIPDATE",
  "DOB",
  "AQUALI",
  "REGIONNAME",
  "TOTALDUES",
] as const;

/** Human-readable labels for each column displayed in the UI. */
export const FIELD_LABELS: Record<keyof MemberRecord, string> = {
  MEMBERNO: "Member No.",
  MEMBERSHIPDATE: "Membership Date",
  MEMCAT: "Category",
  SAL: "Sal.",
  NAME: "Name",
  DOB: "DOB",
  AQUALI: "Qualification",
  RADD1: "Res. Address 1",
  RADD2: "Res. Address 2",
  RADD3: "Res. Address 3",
  RADD4: "Res. Address 4",
  RCITY: "Res. City",
  RPIN: "Res. PIN",
  RSTATE: "Res. State",
  DESIGNATION: "Designation",
  ORGANISATION_NAME: "Organisation",
  PADD1: "Prof. Address 1",
  PADD2: "Prof. Address 2",
  PADD3: "Prof. Address 3",
  PADD4: "Prof. Address 4",
  PCITY: "Prof. City",
  PPIN: "Prof. PIN",
  PSTATE: "Prof. State",
  REGIONNAME: "Region",
  TELEPHONE: "Telephone",
  MOBILENO: "Mobile",
  EMAIL: "Email",
  TOTALDUES: "Total Dues",
};
