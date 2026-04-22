import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite-server";
import type { AIProvider, AISettings, AISettingsUpdate } from "@/types";

const AI_PREFS_KEY = "rechly_ai_settings";
const VALID_PROVIDERS: AIProvider[] = ["openai", "anthropic", "openrouter"];

type StoredAISettings = {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key?: string;
};

function isValidProvider(value: unknown): value is AIProvider {
    return (
        typeof value === "string" &&
        VALID_PROVIDERS.includes(value as AIProvider)
    );
}

function sanitizeStoredSettings(value: unknown): StoredAISettings | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<StoredAISettings>;
    if (
        !isValidProvider(candidate.provider) ||
        typeof candidate.model !== "string"
    ) {
        return null;
    }

    return {
        provider: candidate.provider,
        model: candidate.model.trim(),
        system_prompt:
            typeof candidate.system_prompt === "string"
                ? candidate.system_prompt.trim() || undefined
                : undefined,
        api_key:
            typeof candidate.api_key === "string"
                ? candidate.api_key.trim() || undefined
                : undefined,
    };
}

function toPublicSettings(
    settings: StoredAISettings | null,
): AISettings | null {
    if (!settings) {
        return null;
    }

    return {
        provider: settings.provider,
        model: settings.model,
        system_prompt: settings.system_prompt,
        api_key_configured: Boolean(settings.api_key),
    };
}

async function getCurrentUserAndPrefs() {
    const sessionClient = await createSessionClient();
    const user = await sessionClient.account.get();

    return {
        account: sessionClient.account,
        user,
        prefs: (user.prefs || {}) as Record<string, unknown>,
    };
}

export async function GET() {
    try {
        const { prefs } = await getCurrentUserAndPrefs();
        const settings = sanitizeStoredSettings(prefs[AI_PREFS_KEY]);
        return NextResponse.json(toPublicSettings(settings));
    } catch {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { account, prefs } = await getCurrentUserAndPrefs();
        const existingSettings = sanitizeStoredSettings(prefs[AI_PREFS_KEY]);
        const body = (await request.json()) as Partial<AISettingsUpdate>;

        if (!isValidProvider(body.provider)) {
            return NextResponse.json(
                { error: "Invalid AI provider" },
                { status: 400 },
            );
        }

        const model = typeof body.model === "string" ? body.model.trim() : "";
        if (!model) {
            return NextResponse.json(
                { error: "Model is required" },
                { status: 400 },
            );
        }

        const apiKey =
            typeof body.api_key === "string" ? body.api_key.trim() : "";
        const providerChanged =
            existingSettings?.provider &&
            existingSettings.provider !== body.provider;

        if (providerChanged && !apiKey) {
            return NextResponse.json(
                {
                    error: "Please provide a new API key when changing provider",
                },
                { status: 400 },
            );
        }

        const nextSettings: StoredAISettings = {
            provider: body.provider,
            model,
            system_prompt:
                typeof body.system_prompt === "string"
                    ? body.system_prompt.trim() || undefined
                    : undefined,
            api_key: apiKey || existingSettings?.api_key,
        };

        if (!nextSettings.api_key) {
            return NextResponse.json(
                { error: "API key is required for the initial AI setup" },
                { status: 400 },
            );
        }

        await account.updatePrefs({
            ...prefs,
            [AI_PREFS_KEY]: nextSettings,
        });

        return NextResponse.json(toPublicSettings(nextSettings));
    } catch (error) {
        console.error("Error saving AI settings:", error);
        return NextResponse.json(
            { error: "Failed to save AI settings" },
            { status: 500 },
        );
    }
}
