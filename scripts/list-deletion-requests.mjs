// Read-only operator report; never sends messages or deletes accounts.
import { Client, Users, Query } from "node-appwrite";
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const key = process.env.APPWRITE_API_KEY;
if (!endpoint || !project || !key) throw new Error("Configure Appwrite endpoint, project and server key (users.read).");
const users = new Users(new Client().setEndpoint(endpoint).setProject(project).setKey(key));
let cursor;
for (;;) {
    const page = await users.list([Query.orderAsc("$id"), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])]);
    for (const user of page.users) {
        const request = user.prefs.rechlyDeletionRequest;
        if (request?.status === "pending_review") console.log(JSON.stringify({ userId: user.$id, requestedAt: request.requestedAt }));
    }
    if (page.users.length < 100) break;
    const next = page.users.at(-1).$id;
    if (next === cursor) throw new Error("Pagination did not advance");
    cursor = next;
}
