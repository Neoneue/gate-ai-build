// Workspace member roster shared by the Team page and the notifications
// feed. Lifted out of Team.tsx (2026-08-25) so chrome-level surfaces can
// read the roster without importing the page chunk. The page still owns
// presentation (role labels, filters, row actions).

import type { AvatarTone } from "@/components/ui/monogram-types";
import { authoredDate } from "@/lib/demo-clock";

/** The workspace this build is signed in to. The name was a JSX literal
 *  repeated five times in `workspace-switcher.tsx`; it lives here now so a
 *  surface that needs to NAME the workspace (the contact form's Company
 *  prefill) reads the same string the switcher shows. */
export const WORKSPACE_NAME = "Chad’s workspace";

export type MemberRole = "owner" | "admin" | "member";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  avatarTone: AvatarTone;
  role: MemberRole;
  joined: Date;
};

export const MEMBER_ROWS: MemberRow[] = [
  {
    id: "usr_chad",
    name: "Chad Ponticas",
    email: "chad@constellationnetwork.io",
    avatarTone: "blue",
    role: "owner",
    joined: authoredDate(2026, 3, 20),
  },
  {
    id: "usr_kira",
    name: "Kira Tan",
    email: "kira.tan@acme.io",
    avatarTone: "rose",
    role: "admin",
    joined: authoredDate(2026, 3, 22),
  },
  {
    id: "usr_mate",
    name: "Mateus Silva",
    email: "mateus.silva@ebux.com",
    avatarTone: "emerald",
    role: "member",
    joined: authoredDate(2026, 4, 1),
  },
  {
    id: "usr_jordan",
    name: "Jordan Lee",
    email: "jordan.lee@acme.io",
    avatarTone: "amber",
    role: "member",
    joined: authoredDate(2026, 5, 6), // authored 2026-06-06, the newest member; feeds the "Member added" notification
  },
];

/** The signed-in user, derived from the roster rather than duplicated: the
 *  owner row is who this build is signed in as (`user-menu.tsx` shows the
 *  same name and email). Surfaces that need to PREFILL a form with "you"
 *  read this instead of hard-coding a second copy. */
export const signedInMember = (): MemberRow => {
  const owner = MEMBER_ROWS.find((row) => row.role === "owner");
  if (owner === undefined) {
    throw new Error("roster has no owner row");
  }
  return owner;
};
