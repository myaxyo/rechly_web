type RequiredEnvKey =
    | "NEXT_PUBLIC_APPWRITE_ENDPOINT"
    | "NEXT_PUBLIC_APPWRITE_PROJECT_ID";

function trimTrailingSlashes(value: string): string {
    return value.replace(/\/+$/, "");
}

function getEnvValue(key: string): string | undefined {
    const value = process.env[key]?.trim();
    return value ? value : undefined;
}

export function getRequiredEnv(key: RequiredEnvKey): string {
    const value = getEnvValue(key);

    if (!value) {
        throw new Error(`${key} is not configured`);
    }

    return value;
}

export function getOptionalEnv(key: string): string | undefined {
    return getEnvValue(key);
}

export function getAppwriteEndpoint(): string {
    return trimTrailingSlashes(getRequiredEnv("NEXT_PUBLIC_APPWRITE_ENDPOINT"));
}

export function getAppwriteProjectId(): string {
    return getRequiredEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
}

export function getSiteUrl(): string {
    const value = getOptionalEnv("NEXT_PUBLIC_APP_URL");
    return value ? trimTrailingSlashes(value) : "http://localhost:3000";
}

export function getOptionalMlApiUrl(): string | undefined {
    const value = getOptionalEnv("ML_API_URL");
    return value ? trimTrailingSlashes(value) : undefined;
}

export function getMlApiSecret(): string | undefined {
    return (
        getOptionalEnv("ML_API_SECRET") || getOptionalEnv("CLEANUP_API_SECRET")
    );
}

export function getOptionalAnalyticsId(): string | undefined {
    return getOptionalEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID");
}

export function getRepoUrl(): string {
    return (
        getOptionalEnv("NEXT_PUBLIC_REPOSITORY_URL") ||
        "https://github.com/your-org/rechly"
    );
}

export function getContactEmail(): string {
    return getOptionalEnv("NEXT_PUBLIC_CONTACT_EMAIL") || "contact@example.com";
}

export function getOptionalLinkedInUrl(): string | undefined {
    return getOptionalEnv("NEXT_PUBLIC_LINKEDIN_URL");
}

export function getTwitterHandle(): string | undefined {
    return getOptionalEnv("NEXT_PUBLIC_TWITTER_HANDLE");
}
