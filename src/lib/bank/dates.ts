/**
 * Normalize a bank-statement date to YYYY-MM-DD.
 *
 * Accepts ISO dates/datetimes (`2026-11-17`, `2026-11-17 10:30:00`,
 * `2026-11-17T10:30:00Z`), German `DD.MM.YYYY`, and slash forms
 * `YYYY/MM/DD` / `DD/MM/YYYY`. Returns undefined for anything else
 * (including impossible dates such as 2026-02-31) so callers can
 * fall back instead of persisting a malformed bookingDate.
 */
export function normalizeBookingDate(
    value: string | undefined | null,
): string | undefined {
    if (!value) return undefined;
    const raw = value.trim();
    if (!raw) return undefined;

    let year: number, month: number, day: number;
    let m: RegExpExecArray | null;
    if ((m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ].*)?$/.exec(raw))) {
        year = Number(m[1]);
        month = Number(m[2]);
        day = Number(m[3]);
    } else if (
        (m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[T ].*)?$/.exec(raw))
    ) {
        day = Number(m[1]);
        month = Number(m[2]);
        year = Number(m[3]);
    } else if ((m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw))) {
        year = Number(m[1]);
        month = Number(m[2]);
        day = Number(m[3]);
    } else {
        return undefined;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    // Reject rollover dates such as 2026-02-31.
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return undefined;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${year}-${pad(month)}-${pad(day)}`;
}
