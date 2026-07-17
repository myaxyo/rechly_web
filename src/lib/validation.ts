/**
 * Pure validation helpers (no native imports — unit tested and kept in
 * sync with lib/validation.ts (mobile)).
 */

/**
 * IBAN validation via the ISO 13616 mod-97 checksum.
 * Accepts IBANs with or without spaces, case-insensitive.
 */
export const isValidIban = (input: string): boolean => {
    const iban = input.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
    // German IBANs are exactly 22 characters
    if (iban.startsWith("DE") && iban.length !== 22) return false;

    // Move the first four chars to the end, then map letters to numbers
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let remainder = 0;
    for (const char of rearranged) {
        const value =
            char >= "0" && char <= "9"
                ? char
                : String(char.charCodeAt(0) - 55); // A=10 … Z=35
        for (const digit of value) {
            remainder = (remainder * 10 + Number(digit)) % 97;
        }
    }
    return remainder === 1;
};

/**
 * Syntactic check for a German USt-IdNr. (DE + 9 digits).
 * Existence is verified separately against VIES.
 */
export const isValidGermanVatIdFormat = (input: string): boolean =>
    /^DE[0-9]{9}$/.test(input.replace(/\s/g, "").toUpperCase());

/** Split any EU VAT id into country code + number for the VIES API */
export const splitVatId = (
    input: string
): { countryCode: string; vatNumber: string } | null => {
    const vatId = input.replace(/\s/g, "").toUpperCase();
    const match = vatId.match(/^([A-Z]{2})([A-Z0-9+*]{2,12})$/);
    if (!match || !/[0-9]/.test(match[2])) return null;
    return { countryCode: match[1], vatNumber: match[2] };
};
