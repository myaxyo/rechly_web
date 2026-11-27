import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shell = readFileSync(
    "src/components/dashboard/DashboardShellNew.tsx",
    "utf8",
);

test("sidebar footer stays in flow so footer rows can never overlap the menu", () => {
    // Regression (legacy shell): the footer used to be absolutely
    // positioned over the scrolling menu and buried its last items.
    // The shadcn shell keeps the footer in the flex column flow: the
    // nav is the only scrolling region (min-h-0 + overflow-y-auto).
    assert.match(shell, /flex h-full flex-col/);
    assert.match(shell, /min-h-0 flex-1 overflow-y-auto/);
    assert.doesNotMatch(shell, /absolute bottom-0/);
});

test("header search and account boxes shrink instead of overflowing", () => {
    // The header is a fixed-height flex bar; the page title truncates,
    // the search label flexes, and the account e-mail is width-capped
    // with truncation instead of pushing actions off the edge.
    assert.match(shell, /sticky top-0 z-30 flex h-14 items-center/);
    assert.match(shell, /truncate text-base font-semibold/);
    assert.match(shell, /hidden max-w-44 truncate/);
});

test("dashboard brand uses the real logo image, not a letter placeholder", () => {
    assert.match(shell, /src="\/logo\.png"/);
    assert.doesNotMatch(shell, /dashboard-brand-mark">R</);
});

test("command palette colors come from theme tokens (dark-mode visible)", () => {
    const palette = readFileSync("src/components/dashboard/CommandPalette.tsx", "utf8");
    // Regression: hardcoded light hex values rendered near-invisible
    // on the dark surface. The shadcn command dialog uses theme
    // tokens (popover/muted/accent) only.
    assert.doesNotMatch(palette, /"#[0-9a-fA-F]{6}"/);
    assert.match(palette, /@\/components\/ui\/command/);
});
