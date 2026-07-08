import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite-server";

export async function POST(request: NextRequest) {
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

        // Verify authentication
        await account.get();

        const body = await request.json();
        const { imageBase64, mimeType } = body;

        if (!imageBase64 || !mimeType) {
            return NextResponse.json(
                { error: "imageBase64 and mimeType required" },
                { status: 400 },
            );
        }

        const apiKey =
            process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "ai_not_configured" },
                { status: 422 },
            );
        }

        const prompt = `Extract the following information from this receipt/invoice image and return JSON only:
{
  "vendor_name": "string",
  "date": "YYYY-MM-DD",
  "amount_gross": number,
  "vat_rate": number (19, 7, or 0),
  "description": "string"
}
If any field is unclear, use null. Return only valid JSON.`;

        let result: {
            vendor_name?: string;
            date?: string;
            amount_gross?: number;
            vat_rate?: number;
            description?: string;
        } = {};

        if (process.env.OPENAI_API_KEY) {
            const res = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: prompt },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: `data:${mimeType};base64,${imageBase64}`,
                                        },
                                    },
                                ],
                            },
                        ],
                        max_tokens: 300,
                    }),
                },
            );

            if (!res.ok) {
                return NextResponse.json(
                    { error: "ai_not_configured" },
                    { status: 422 },
                );
            }

            const json = await res.json();
            const content = json.choices?.[0]?.message?.content || "{}";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    result = JSON.parse(jsonMatch[0]);
                } catch {
                    // fall through
                }
            }
        } else if (process.env.ANTHROPIC_API_KEY) {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 300,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image",
                                    source: {
                                        type: "base64",
                                        media_type: mimeType,
                                        data: imageBase64,
                                    },
                                },
                                { type: "text", text: prompt },
                            ],
                        },
                    ],
                }),
            });

            if (!res.ok) {
                return NextResponse.json(
                    { error: "ai_not_configured" },
                    { status: 422 },
                );
            }

            const json = await res.json();
            const content = json.content?.[0]?.text || "{}";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    result = JSON.parse(jsonMatch[0]);
                } catch {
                    // fall through
                }
            }
        }

        return NextResponse.json({
            vendor_name: result.vendor_name || null,
            date: result.date || null,
            amount_gross: result.amount_gross || null,
            vat_rate: result.vat_rate || null,
            description: result.description || null,
        });
    } catch (error) {
        console.error("OCR error:", error);
        return NextResponse.json({ error: "OCR failed" }, { status: 500 });
    }
}
