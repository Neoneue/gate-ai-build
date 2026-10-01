/**
 * The one column every region of the chat surface shares. Header, thread,
 * landing, composer and composer notice all measure from this, so their left
 * and right edges line up instead of each region picking its own width.
 *
 * 50rem is the site's `--container-chat-measure` (Gate Chat's shipped value:
 * the extra 32px over Tailwind's 48rem `3xl` tier is what a comparison turn
 * needs for two lanes to read as columns). This build's token layer does not
 * carry the chat containers, so the value rides as a layout width here, the
 * same way the shell's `max-w-[1920px]` and the Ask AI column's `w-[368px]`
 * do. One constant, every region reads it.
 */
export const CHAT_MEASURE = "mx-auto w-full max-w-[50rem] px-4 sm:px-6";

/** User message bubble width cap: the site's `--container-chat-bubble`
 *  (78%), a percentage so the bubble tracks the thread's measure. */
export const CHAT_BUBBLE_MAX = "max-w-[78%]";

/** Rail widths. Collapsed keeps the icon rail addressable at 64px. */
export const CHAT_RAIL_EXPANDED = "w-72";
export const CHAT_RAIL_COLLAPSED = "w-16";

/** The top bar's brand column mirrors the rail's width only where the rail
 *  exists (`lg`+). Below `lg` the rail is a drawer, so the column hugs the
 *  logo mark instead of reserving 288px of a 390px phone bar. */
export const CHAT_BRAND_EXPANDED = "lg:w-72";
export const CHAT_BRAND_COLLAPSED = "lg:w-16";

/** The site's `.chat-touch-target` utility, expressed through Tailwind's
 *  pointer variants instead of a bespoke class: chat interaction targets
 *  follow the input device rather than the viewport. A wide touch laptop
 *  still needs a 44px target; a narrow mouse window does not need oversized
 *  icon chrome. */
export const CHAT_TOUCH_TARGET =
  "touch-manipulation pointer-coarse:min-h-11 pointer-coarse:min-w-11 any-pointer-coarse:min-h-11 any-pointer-coarse:min-w-11";

/** The site's `.chat-coarse-visible`: a hover-revealed control stays visible
 *  and clickable on a coarse pointer, which has no hover to reveal it. */
export const CHAT_COARSE_VISIBLE =
  "pointer-coarse:pointer-events-auto pointer-coarse:opacity-100 any-pointer-coarse:pointer-events-auto any-pointer-coarse:opacity-100";
