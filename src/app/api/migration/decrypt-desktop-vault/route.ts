import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite-server";
import {
    decryptDesktopVault,
    desktopVaultToBackupBundle,
    isEncryptedDesktopBackup,
    MAX_DESKTOP_BACKUP_BYTES,
} from "@/lib/migration/desktopVault";

export const runtime = "nodejs";

/** Decrypt a Rechly Desktop `.rechly-backup` and return a web backup bundle. */
export async function POST(request: Request) {
    try {
        try {
            const { account } = await createSessionClient();
            await account.get();
        } catch {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const form = await request.formData();
        const file = form.get("file");
        const password = form.get("password");
        if (!(file instanceof File) || typeof password !== "string") {
            return NextResponse.json({ error: "file and password required" }, { status: 400 });
        }
        if (file.size > MAX_DESKTOP_BACKUP_BYTES) {
            return NextResponse.json({ error: "Backup larger than 64 MB" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        if (!isEncryptedDesktopBackup(buffer)) {
            return NextResponse.json({ error: "Not a Rechly Desktop encrypted backup" }, { status: 400 });
        }

        const vault = await decryptDesktopVault(buffer, password);
        const bundle = desktopVaultToBackupBundle(vault);
        return NextResponse.json({ bundle });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Decrypt failed";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
