import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite-server";
import type { AIChatResponse, AIProvider } from "@/types";

const AI_PREFS_KEY = "rechly_ai_settings";

type StoredAISettings = {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key?: string;
};

function sanitizeStoredSettings(value: unknown): StoredAISettings | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<StoredAISettings>;
    if (
        (candidate.provider !== "openai" &&
            candidate.provider !== "anthropic" &&
            candidate.provider !== "openrouter") ||
        typeof candidate.model !== "string"
    ) {
        return null;
    }

    const model = candidate.model.trim();
    const apiKey =
        typeof candidate.api_key === "string"
            ? candidate.api_key.trim() || undefined
            : undefined;

    if (!model || !apiKey) {
        return null;
    }

    return {
        provider: candidate.provider,
        model,
        system_prompt:
            typeof candidate.system_prompt === "string"
                ? candidate.system_prompt.trim() || undefined
                : undefined,
        api_key: apiKey,
    };
}

async function runOpenAICompatibleChat(
    settings: StoredAISettings,
    prompt: string,
    baseUrl: string,
): Promise<string> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${settings.api_key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: settings.model,
            temperature: 0.3,
            messages: [
                ...(settings.system_prompt
                    ? [{ role: "system", content: settings.system_prompt }]
                    : []),
                { role: "user", content: prompt },
            ],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "AI provider request failed");
    }

    const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
        throw new Error("AI provider returned an empty response");
    }

    return content;
}

async function runAnthropicChat(
    settings: StoredAISettings,
    prompt: string,
): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": settings.api_key!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: settings.model,
            max_tokens: 600,
            system: settings.system_prompt,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "AI provider request failed");
    }

    const payload = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
    };

    const content = payload.content
        ?.filter((item) => item.type === "text" && item.text)
        .map((item) => item.text?.trim())
        .filter(Boolean)
        .join("\n\n");

    if (!content) {
        throw new Error("AI provider returned an empty response");
    }

    return content;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { prompt?: unknown };
        const prompt =
            typeof body.prompt === "string" ? body.prompt.trim() : "";

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 },
            );
        }

        const sessionClient = await createSessionClient();
        const user = await sessionClient.account.get();
        const prefs = (user.prefs || {}) as Record<string, unknown>;
        const settings = sanitizeStoredSettings(prefs[AI_PREFS_KEY]);

        if (!settings) {
            return NextResponse.json(
                {
                    error: "AI settings are incomplete. Save provider, model, and API key first.",
                },
                { status: 400 },
            );
        }

        let content: string;
        if (settings.provider === "anthropic") {
            content = await runAnthropicChat(settings, prompt);
        } else if (settings.provider === "openrouter") {
            content = await runOpenAICompatibleChat(
                settings,
                prompt,
                "https://openrouter.ai/api/v1",
            );
        } else {
            content = await runOpenAICompatibleChat(
                settings,
                prompt,
                "https://api.openai.com/v1",
            );
        }

        const response: AIChatResponse = {
            content,
            provider: settings.provider,
            model: settings.model,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error running AI chat:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to run AI request",
            },
            { status: 500 },
        );
    }
}
