import type { ApiFieldErrors } from "./api-error";

/**
 * Backend maydon xatolarini react-hook-form `setError` ga uzatadi.
 * `non_field_errors` — forma darajasidagi `root` xatosiga aylanadi.
 *
 * `TFieldName` generic — `UseFormSetError<TFieldValues>` bilan to‘g‘ridan-to‘g‘ri mos keladi.
 */
export function applyApiFieldErrors<TFieldName extends string>(
  error: { fields?: ApiFieldErrors | null } | null | undefined,
  setError: (field: TFieldName, error: { type: string; message: string }) => void,
  fieldMap: Record<string, string> = {}
): boolean {
  if (!error?.fields || typeof setError !== "function") return false;
  let applied = false;
  Object.entries(error.fields).forEach(([sourceField, value]) => {
    const targetField = fieldMap[sourceField] ?? sourceField;
    const message = Array.isArray(value) ? value.join(" ") : String(value);
    setError((targetField === "non_field_errors" ? "root" : targetField) as TFieldName, {
      type: "server",
      message,
    });
    applied = true;
  });
  return applied;
}
