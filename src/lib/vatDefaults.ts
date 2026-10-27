/** A default for new lines only; never rewrite saved documents or user edits. */
export function defaultVatRate(smallBusiness: boolean | undefined, productRate?: number | null): number {
    return smallBusiness ? 0 : (productRate ?? 19);
}
