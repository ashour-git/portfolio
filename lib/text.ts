/**
 * Display-time copy cleanup.
 *
 * lib/data.ts also feeds the copilot's prebuilt embedding index, so its
 * strings are left untouched. The UI renders them through these helpers
 * instead: dash pairs become parentheses, single dashes become commas.
 */
export function tidy(input: string): string {
  let s = input;
  // a parenthetical pair: "x — a, b — y" -> "x (a, b) y"
  s = s.replace(/\s+[—–]\s+([^—–]+?)\s+[—–]\s+/g, " ($1) ");
  // a lone clause dash
  s = s.replace(/\s*[—–]\s*/g, ", ");
  return s.replace(/,\s*,/g, ",").replace(/\s+([,.)])/g, "$1");
}

/** Date ranges use a plain hyphen. */
export function period(input: string): string {
  return input.replace(/\s*[—–]\s*/g, " - ");
}

/** Short lists read as prose, not dot-separated strips. */
export function list(items: string[]): string {
  return items.join(", ");
}
