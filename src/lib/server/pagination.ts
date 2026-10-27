import { Query } from "node-appwrite";

/** Stable cursor traversal: no total customer cap and no Appwrite default-page truncation. */
export async function allDocuments<T extends { $id: string }>(
    page: (queries: string[]) => Promise<{ documents: T[] }>,
    queries: string[],
): Promise<T[]> {
    const documents: T[] = [];
    let cursor: string | undefined;
    for (;;) {
        const result = await page([...queries, Query.orderAsc("$id"), Query.limit(100),
            ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
        documents.push(...result.documents);
        if (result.documents.length < 100) return documents;
        const next = result.documents.at(-1)!.$id;
        if (cursor === next) throw new Error("Pagination did not advance");
        cursor = next;
    }
}
