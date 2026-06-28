import Fuse, { IFuseOptions } from "fuse.js";
import { MemberRecord } from "@/types/member";

export const fuseOptions: IFuseOptions<MemberRecord> = {
  keys: ["NAME", "RCITY", "PCITY", "RSTATE", "PSTATE"],
  threshold: 0.15,        // Very strict — requires very close matches
  distance: 100,
  includeScore: true,
  shouldSort: true,
  minMatchCharLength: 2,
};

export function createSearchIndex(members: MemberRecord[]): Fuse<MemberRecord> {
  return new Fuse(members, fuseOptions);
}
