// Shared helpers for controlled <input type="number"> fields.
//
// The naive `onChange={(e) => setX(Number(e.target.value))}` pattern makes a
// field impossible to clear: backspacing to an empty box immediately parses
// to `Number("") === 0`, which re-renders the input showing "0" instead of
// staying blank. These helpers store `NaN` (still a valid `number` at the
// type level, so no state/type changes needed) while the field is
// transiently empty, and only coerce it back to a real number at submit time.

export function numberInputValue(value: number | null | undefined): number | string {
  return value === undefined || value === null || Number.isNaN(value) ? "" : value;
}

export function parseNumberInput(raw: string): number {
  return raw === "" ? NaN : Number(raw);
}

export function sanitizeNumber(value: number | null | undefined, fallback = 0): number {
  return value === undefined || value === null || Number.isNaN(value) ? fallback : value;
}
