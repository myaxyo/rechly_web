import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync("src/app/dashboard/dashboard.css", "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
);

/** Body of the first top-level rule whose selector starts a line. */
const rule = (selector: string): string => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(match, `rule ${selector} exists`);
    return match[1];
};

test("sidebar footer stays in flow so footer rows can never overlap the menu", () => {
    const footer = rule(".dashboard-sider-footer");
    // Regression: the footer used to be position: absolute at the bottom
    // of the fixed sider, with the menu clearing it via a hardcoded
    // 118px padding. Every added footer row (settings, help, GitHub
    // star, ...) made the footer taller than that clearance and buried
    // the last menu items underneath it.
    assert.doesNotMatch(footer, /position\s*:\s*(absolute|fixed)/);
    assert.match(footer, /flex\s*:\s*0 0 auto/);

    const siderChildren = rule(".dashboard-sider .ant-layout-sider-children");
    assert.match(siderChildren, /display\s*:\s*flex/);
    assert.match(siderChildren, /flex-direction\s*:\s*column/);
});

test("sidebar menu is the single scrolling region without hardcoded footer clearance", () => {
    const menu = rule(".dashboard-menu");
    assert.match(menu, /flex\s*:\s*1 1 auto/);
    assert.match(menu, /min-height\s*:\s*0/);
    assert.match(menu, /overflow-y\s*:\s*auto/);

    // Bottom padding must stay cosmetic (< one menu row). Anything
    // larger means someone re-introduced clearance for an overlaying
    // footer, which silently breaks when footer content changes.
    const padding = /padding\s*:\s*([^;]+);/.exec(menu)?.[1].trim().split(/\s+/) ?? [];
    // Shorthand: 3rd value is bottom when present, else 1st.
    const bottom = padding.length >= 3 ? padding[2] : padding[0];
    const bottomPx = Number.parseFloat(bottom ?? "0");
    assert.ok(bottomPx < 40, `menu bottom padding ${bottom} looks like footer clearance`);
});

test("sidebar footer rows keep their height instead of squishing", () => {
    assert.match(rule(".dashboard-sider-settings"), /flex\s*:\s*0 0 auto/);
    assert.match(
        rule(".dashboard-sider .ant-layout-sider-children > *"),
        /flex-shrink\s*:\s*0/,
    );
});

test("header search and account boxes shrink instead of overflowing", () => {
    // Regression: rigid widths (.dashboard-palette-trigger min-width
    // 168px, fixed-width selects, an e-mail span that could not
    // ellipsize) pushed the header actions off the right edge.
    const trigger = rule(".dashboard-palette-trigger");
    assert.doesNotMatch(trigger, /min-width\s*:\s*(?!0\b)[1-9]/);
    assert.match(trigger, /flex\s*:\s*0 1 /);
    assert.match(trigger, /min-width\s*:\s*0/);

    const label = rule(".dashboard-palette-trigger-label");
    assert.match(label, /min-width\s*:\s*0/);
    assert.match(label, /text-overflow\s*:\s*ellipsis/);

    // Ellipsis on a flex item only works with min-width: 0.
    const email = rule(".dashboard-user-email");
    assert.match(email, /min-width\s*:\s*0/);
    assert.match(email, /text-overflow\s*:\s*ellipsis/);
    assert.match(rule(".dashboard-avatar"), /flex-shrink\s*:\s*0/);
    assert.match(rule(".dashboard-user-button"), /min-width\s*:\s*0/);

    assert.match(css, /\.dashboard-header-actions \{\s*flex: 0 1 auto;/);
    assert.match(rule(".dashboard-header-actions > *"), /min-width\s*:\s*0/);
    assert.match(css, /\.dashboard-header-left \{\s*flex: 1 1 auto;/);
    assert.match(rule(".dashboard-page-title"), /text-overflow\s*:\s*ellipsis/);

    // Compact stages are keyed to the main area width, so they hold
    // with the sider expanded or collapsed.
    assert.match(css, /\.dashboard-main \{\s*container-type: inline-size;/);
    assert.match(css, /@container \(max-width: 860px\) \{[\s\S]{0,400}?\.dashboard-user-email \{ display: none; \}/);
});

test("header controls cannot inherit AntD's 64px line height and overflow vertically", () => {
    // Regression measured in a browser: AntD Layout.Header's inherited
    // 64px line-height made the custom search control 85px tall and
    // the account control 74px tall inside a 64px header.
    assert.match(
        rule(".dashboard-appearance .dashboard-header"),
        /line-height\s*:\s*normal/,
    );

    const trigger = rule(".dashboard-palette-trigger");
    assert.match(trigger, /height\s*:\s*36px/);
    assert.match(trigger, /line-height\s*:\s*1\.25/);
    assert.match(rule(".dashboard-palette-trigger kbd"), /line-height\s*:\s*1\.35/);

    const account = rule(".dashboard-user-button");
    assert.match(account, /height\s*:\s*42px/);
    assert.match(account, /line-height\s*:\s*1\.25/);
});

test("dashboard brand uses the real logo image, not a letter placeholder", () => {
    const shell = readFileSync("src/components/dashboard/DashboardShell.tsx", "utf8");
    assert.doesNotMatch(shell, /dashboard-brand-mark">R</);
    assert.equal(shell.match(/src="\/logo\.png"/g)?.length, 2, "sider and drawer brands use /logo.png");
});

test("command palette colors come from theme tokens (dark-mode visible)", () => {
    const palette = readFileSync("src/components/dashboard/CommandPalette.tsx", "utf8");
    // Regression: hardcoded light hex values (#162033 text, #eef3fd
    // active row) rendered near-invisible on the dark modal surface.
    assert.match(palette, /theme\.useToken\(\)/);
    assert.doesNotMatch(palette, /"#[0-9a-fA-F]{6}"/);
    assert.match(palette, /color: token\.colorText,/);
});
