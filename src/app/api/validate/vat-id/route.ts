import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite-server";
import { splitVatId } from "@/lib/validation";

/**
 * USt-IdNr. verification via the EU commission's free VIES service.
 * Proxied server-side (VIES has no CORS) and session-gated so this is
 * not an open relay. Used by the web client form and, via the JWT
 * bridge, by the mobile app.
 */
export async function POST(request: NextRequest) {
    try {
        try {
            const { account } = await createSessionClient();
            await account.get();
        } catch {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parts = splitVatId(String(body.vat_id || ""));
        if (!parts) {
            return NextResponse.json(
                { valid: false, error: "invalid_format" },
                { status: 200 }
            );
        }

        const viesResponse = await fetch(
            "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    countryCode: parts.countryCode,
                    vatNumber: parts.vatNumber,
                }),
                signal: AbortSignal.timeout(10_000),
            }
        );

        if (!viesResponse.ok) {
            return NextResponse.json(
                { error: "vies_unavailable" },
                { status: 502 }
            );
        }

        const result = await viesResponse.json();
        return NextResponse.json({
            valid: result.valid === true,
            name:
                result.name && result.name !== "---" ? result.name : undefined,
            address:
                result.address && result.address !== "---"
                    ? result.address.trim()
                    : undefined,
        });
    } catch (error) {
        console.error("VAT id validation failed:", error);
        return NextResponse.json(
            { error: "vies_unavailable" },
            { status: 502 }
        );
    }
}
