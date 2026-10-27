import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    if (process.env.RECHLY_DESKTOP !== "1") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { getDesktopClients } = await import("@/lib/desktop/appwrite-compat");
    getDesktopClients();
    return NextResponse.json({ ready: true, storage: "sqlite" });
}
