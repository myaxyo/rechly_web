import { NextRequest, NextResponse } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import {
    createSessionClient,
    createAdminClient,
    DATABASE_ID,
    COLLECTIONS,
    STORAGE,
} from "@/lib/appwrite-server";
import { InputFile } from "node-appwrite/file";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        let account;
        try {
            const sessionClient = await createSessionClient();
            account = sessionClient.account;
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const { databases, storage } = await createAdminClient();
        const user = await account.get();

        // Verify expense ownership
        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 },
            );
        }

        // Validate file size (10MB max) and type
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File too large (max 10MB)" },
                { status: 413 },
            );
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/heic",
            "application/pdf",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type" },
                { status: 415 },
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileId = ID.unique();
        const permissions = [
            Permission.read(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
        ];

        await storage.createFile(
            STORAGE.RECEIPTS,
            fileId,
            InputFile.fromBuffer(buffer, file.name),
            permissions,
        );

        // Update expense with file reference
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.EXPENSES, id, {
            receiptFileId: fileId,
        });

        return NextResponse.json({ fileId });
    } catch (error) {
        console.error("Receipt upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload receipt" },
            { status: 500 },
        );
    }
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    try {
        let account;
        try {
            const sessionClient = await createSessionClient();
            account = sessionClient.account;
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 },
            );
        }

        const { databases, storage } = await createAdminClient();
        const user = await account.get();

        const doc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.EXPENSES,
            id,
        );
        if (doc.userId !== user.$id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (!doc.receiptFileId) {
            return NextResponse.json({ error: "No receipt" }, { status: 404 });
        }

        const fileView = storage.getFileView(
            STORAGE.RECEIPTS,
            doc.receiptFileId,
        );
        return NextResponse.json({ url: fileView.toString() });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}
