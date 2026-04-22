import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from "node:crypto";
import type { AIChatResponse, AIProvider, AISettings } from "@/types";

export const AI_PREFS_KEY = "rechly_ai_settings";
const VALID_PROVIDERS: AIProvider[] = ["openai", "anthropic", "openrouter"];
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

export type StoredAISettings = {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key?: string;
    encrypted_api_key?: string;
    encryption_iv?: string;
    encryption_tag?: string;
};

export type ResolvedAISettings = {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key: string;
};

function getEncryptionSecret(): string {
    const secret = process.env.AI_SETTINGS_ENCRYPTION_SECRET?.trim();
    if (!secret) {
        throw new Error("AI_SETTINGS_ENCRYPTION_SECRET is not configured");
    }
    return secret;
}

function getEncryptionKey(): Buffer {
    return createHash("sha256").update(getEncryptionSecret()).digest();
}

function encryptValue(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
        encrypted_api_key: encrypted.toString("base64"),
        encryption_iv: iv.toString("base64"),
        encryption_tag: tag.toString("base64"),
    };
}

function decryptValue(payload: {
    encrypted_api_key: string;
    encryption_iv: string;
    encryption_tag: string;
}): string {
    const decipher = createDecipheriv(
        ENCRYPTION_ALGORITHM,
        getEncryptionKey(),
        Buffer.from(payload.encryption_iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.encryption_tag, "base64"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(payload.encrypted_api_key, "base64")),
        decipher.final(),
    ]);

    return decrypted.toString("utf8").trim();
}

export function isValidAIProvider(value: unknown): value is AIProvider {
    return (
        typeof value === "string" &&
        VALID_PROVIDERS.includes(value as AIProvider)
    );
}

export function sanitizeStoredAISettings(
    value: unknown,
): StoredAISettings | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<StoredAISettings>;
    if (
        !isValidAIProvider(candidate.provider) ||
        typeof candidate.model !== "string"
    ) {
        return null;
    }

    const model = candidate.model.trim();
    if (!model) {
        return null;
    }

    return {
        provider: candidate.provider,
        model,
        system_prompt:
            typeof candidate.system_prompt === "string"
                ? candidate.system_prompt.trim() || undefined
                : undefined,
        api_key:
            typeof candidate.api_key === "string"
                ? candidate.api_key.trim() || undefined
                : undefined,
        encrypted_api_key:
            typeof candidate.encrypted_api_key === "string"
                ? candidate.encrypted_api_key
                : undefined,
        encryption_iv:
            typeof candidate.encryption_iv === "string"
                ? candidate.encryption_iv
                : undefined,
        encryption_tag:
            typeof candidate.encryption_tag === "string"
                ? candidate.encryption_tag
                : undefined,
    };
}

export function toPublicAISettings(
    settings: StoredAISettings | null,
): AISettings | null {
    if (!settings) {
        return null;
    }

    return {
        provider: settings.provider,
        model: settings.model,
        system_prompt: settings.system_prompt,
        api_key_configured: Boolean(
            settings.api_key ||
            (settings.encrypted_api_key &&
                settings.encryption_iv &&
                settings.encryption_tag),
        ),
    };
}

export function buildStoredAISettings(input: {
    provider: AIProvider;
    model: string;
    system_prompt?: string;
    api_key?: string;
    existing?: StoredAISettings | null;
}): StoredAISettings {
    const apiKey = input.api_key?.trim();
    const existing = input.existing;

    const nextSettings: StoredAISettings = {
        provider: input.provider,
        model: input.model.trim(),
        system_prompt: input.system_prompt?.trim() || undefined,
    };

    if (apiKey) {
        Object.assign(nextSettings, encryptValue(apiKey));
    } else if (
        existing?.encrypted_api_key &&
        existing.encryption_iv &&
        existing.encryption_tag
    ) {
        nextSettings.encrypted_api_key = existing.encrypted_api_key;
        nextSettings.encryption_iv = existing.encryption_iv;
        nextSettings.encryption_tag = existing.encryption_tag;
    } else if (existing?.api_key) {
        Object.assign(nextSettings, encryptValue(existing.api_key));
    }

    return nextSettings;
}

export function resolveAISettings(
    settings: StoredAISettings | null,
): ResolvedAISettings | null {
    if (!settings) {
        return null;
    }

    let apiKey: string | undefined;
    if (
        settings.encrypted_api_key &&
        settings.encryption_iv &&
        settings.encryption_tag
    ) {
        apiKey = decryptValue({
            encrypted_api_key: settings.encrypted_api_key,
            encryption_iv: settings.encryption_iv,
            encryption_tag: settings.encryption_tag,
        });
    } else if (settings.api_key) {
        apiKey = settings.api_key;
    }

    if (!apiKey) {
        return null;
    }

    return {
        provider: settings.provider,
        model: settings.model,
        system_prompt: settings.system_prompt,
        api_key: apiKey,
    };
}

async function runOpenAICompatibleChat(
    settings: ResolvedAISettings,
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
    settings: ResolvedAISettings,
    prompt: string,
): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": settings.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: settings.model,
            max_tokens: 800,
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

export async function generateAIText(
    settings: ResolvedAISettings,
    prompt: string,
): Promise<AIChatResponse> {
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

    return {
        content,
        provider: settings.provider,
        model: settings.model,
    };
}
