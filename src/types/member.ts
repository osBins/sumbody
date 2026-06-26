export interface MemberRecord {
  MEMBERNO: string;
  MEMBERSHIPDATE: string;
  MEMCAT: string;
  SAL: string;
  NAME: string;
  DOB: string;
  AQUALI: string;
  RADD1: string;
  RADD2: string;
  RADD3: string;
  RADD4: string;
  RCITY: string;
  RPIN: string;
  RSTATE: string;
  DESIGNATION: string;
  ORGANISATION_NAME: string;
  PADD1: string;
  PADD2: string;
  PADD3: string;
  PADD4: string;
  PCITY: string;
  PPIN: string;
  PSTATE: string;
  REGIONNAME: string;
  TELEPHONE: string;
  MOBILENO: string;
  EMAIL: string;
  TOTALDUES: number;
}

export interface FilterState {
  TELEPHONE: string;
  EMAIL: string;
  RCITY: string[];
  PCITY: string[];
  RSTATE: string[];
  PSTATE: string[];
  AQUALI: string[];
  MEMCAT: string[];
  REGIONNAME: string[];
  SAL: string[];
  membershipDateStart: string;
  membershipDateEnd: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  updated: number;
  errors: string[];
}
