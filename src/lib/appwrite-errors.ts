/**
 * Checks if an Appwrite error indicates a missing collection or attribute.
 * Returns true if the error is something the user can't fix (missing infra).
 */
export function isCollectionNotFound(error: unknown): boolean {
    const msg =
        (error as { message?: string })?.message || String(error);
    const code = (error as { code?: number })?.code;

    return (
        code === 404 ||
        msg.includes("Collection with the requested ID could not be found") ||
        msg.includes("Database not found") ||
        msg.includes("collection_not_found")
    );
}

/**
 * Checks if the error is about an unknown/missing attribute in the collection.
 */
export function isUnknownAttribute(error: unknown): boolean {
    const msg =
        (error as { message?: string })?.message || String(error);
    return msg.includes("Unknown attribute") || msg.includes("Invalid document structure");
}
