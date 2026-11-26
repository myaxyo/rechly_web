import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AUTH_LIMITS } from "../src/lib/server/security";

const authContext = readFileSync("src/contexts/AuthContext.tsx", "utf8");
const anonymousRoute = readFileSync(
    "src/app/api/auth/anonymous/route.ts",
    "utf8",
);

test("guest login is rate limited like other account-creating flows", () => {
    assert.deepEqual(AUTH_LIMITS.anonymous, { max: 5, windowMs: 60_000 });
});

test("guest login creates the SSR session used by API routes", () => {
    // Regression: a client-SDK-only anonymous session never set the
    // httpOnly cookie that /api/auth/user and SSR API routes require.
    assert.match(anonymousRoute, /account\.createAnonymousSession\(\)/);
    assert.match(anonymousRoute, /SESSION_COOKIE_NAME, session\.secret/);
    assert.match(anonymousRoute, /httpOnly: true/);
    assert.match(anonymousRoute, /AUTH_LIMITS\.anonymous/);
    // Deliberately no persistent maxAge: guest access is browser-session scoped.
    assert.doesNotMatch(anonymousRoute, /maxAge\s*:/);

    assert.match(
        authContext,
        /fetch\("\/api\/auth\/anonymous", \{\s*method: "POST",\s*\}\)/,
    );
    assert.match(authContext, /fetch\("\/api\/auth\/user"\)/);
});

test("guest login cannot immediately log itself out via storage flags", () => {
    // Regression: loginAnonymously set guestSession=true, then an
    // isAnonymous effect saw that flag and invoked logout() at once.
    assert.doesNotMatch(authContext, /sessionStorage\.(?:getItem|setItem)\("guest(?:Session|HiddenAt)"/);
    assert.doesNotMatch(
        authContext,
        /createAnonymousSession,\s*\n\s*deleteAccount as appwriteDeleteAccount/,
    );
    assert.doesNotMatch(authContext, /await createAnonymousSession\(\)/);
});
