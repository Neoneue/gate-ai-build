import { cn } from '@/lib/utils';
import { AVATAR_TONE_CLS, type MonogramProps } from './monogram-types';

/* ─────────────────────────────────────────────────────────────────────────
 * Monogram — avatar initial chip.
 *
 * Extracted 2026-05-17 from duplicated `Avatar` (Team.tsx) and
 * `UserMonogram` (Activity.tsx). Unifies AvatarTone type, AVATAR_TONE_CLS
 * map, and the rendering logic into one primitive.
 *
 * Size variants:
 * 'sm' → size-4 (16px), text-[10px], single initial
 * 'md' → size-7 (28px), text-xs (12px), two initials
 *
 * The `initials` prop accepts the pre-computed initials string. Callers are
 * responsible for deriving initials from a name — Team.tsx uses
 * `initialsOf(name)` for 2-char initials; Activity.tsx uses the first
 * character of the first word for single-char initials. Both helpers stay
 * in their respective pages (they are local formatting utilities, not
 * part of the visual primitive).
 *
 * All tones use saturated 700-step bg + white fg — same recipe as the
 * DashTopBar `CP` monogram. Tones cycle through the existing 700-step
 * palette ramps (no chart-palette borrowing).
 *
 * Non-component types (AvatarTone, AVATAR_TONE_CLS, MonogramProps) live in
 * `./monogram-types` so this file exports only the React component and
 * React Fast Refresh can work correctly.
 * ─────────────────────────────────────────────────────────────────────── */

export function Monogram({ tone, initials, size = 'md' }: MonogramProps) {
 return (
 <span
 aria-hidden
 className={cn(
 'inline-flex items-center justify-center shrink-0 rounded-full font-sans font-medium',
 size === 'sm' ? 'size-4 text-[10px]' : 'size-7 text-xs',
 AVATAR_TONE_CLS[tone],
 )}
 >
 {initials}
 </span>
 );
}
