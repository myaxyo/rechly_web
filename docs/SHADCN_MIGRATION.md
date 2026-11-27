# shadcn/ui migration

**Status: complete on `main`.** Ant Design has been removed. The live UI is
shadcn/ui + Tailwind. Shared brand tokens also live in `src/lib/core/tokens.css`
for Desktop parity (see PRODUCT_RULE.md).

## Historical: coexistence (finished)

During migration, Ant Design stayed installed while shadcn primitives were
adopted page-by-page. That phase is over.

Visual parity used tokens in `src/app/globals.css` (Rechly palette):

| Token | Value | AntD source |
| --- | --- | --- |
| `--primary` | `#2855d9` (dark `#7ea2f8`) | `colorPrimary` |
| `--foreground` | `#152438` | `colorText` |
| `--muted-foreground` | `#526174` | `colorTextSecondary` |
| `--border` | `#e3e9f1` | `colorBorderSecondary` |
| `--input` | `#dbe3ee` | `colorBorder` |
| `--radius` | `0.5rem` (8px) | `borderRadius: 8` |
| Button primary shadow | `0 6px 16px rgba(40,85,217,.20)` | `Button.primaryShadow` |

## Done in Phase 0 (foundation)

- `components.json` (new-york style, Tailwind v4, CSS vars, lucide icons)
- Deps: `class-variance-authority`, `clsx`, `tailwind-merge`,
  `@radix-ui/react-slot`, `tw-animate-css`
- `src/lib/utils.ts` — `cn()`
- `src/app/globals.css` — additive shadcn tokens + `@theme inline`
  mapping; no existing rule changed or removed
- First primitives: `ui/button`, `ui/input`, `ui/card`
- Not changed: `src/app/layout.tsx` (`AntdRegistry`), `PublicTheme`,
  all 87 files importing `antd` — zero UX impact

## Status: migration complete

All pages and components are migrated to shadcn/ui. Ant Design
(`antd`, `@ant-design/icons`, `@ant-design/nextjs-registry`) is
removed from `package.json`, `AntdRegistry`/`PublicTheme` are gone,
and no `.ant-*` selectors remain in the CSS. The dashboard shell is
`src/components/dashboard/DashboardShellNew.tsx`; the opt-in toggle
that protected users during the migration (below) was removed at
cutover — there is now exactly one UI.

## Rollout history: opt-in preview (no forced switch)

Users are never switched automatically. `src/contexts/UiModeContext.tsx`
persists a per-browser choice (`rechly.ui-mode`, default `legacy`):

- Legacy dashboard header shows **“Neue UI testen / Try new UI”**
  (`TryNewUiButton` in `src/components/dashboard/UiModeToggle.tsx`).
- The new shadcn shell (`DashboardShellNew`) always shows
  **“Zur alten UI / Back to old UI”** plus a dismissible Beta banner
  with a feedback link.
- `DashboardShell` branches on the mode; both shells share the same
  routes, page titles, and navigation, so switching is instant and
  reversible. Pages migrate inside the new shell one by one; until a
  page is migrated it simply renders its current UI inside the new
  chrome. Only when every page is migrated does the legacy shell and
  Ant Design get removed (final cutover, announced in advance).

## How the migration was executed

1. **Leaf components** — full primitive library in
   `src/components/ui/` (plus `date-picker`, `steps`); forms use
   controlled state with manual validation (no form library needed).
2. **Forms** — auth pages, then dashboard forms (clients, products,
   settings, invoice/offer/recurring wizards).
3. **Data** — antd `Table` → `ui/table` with client sorting/filter/
   pagination; `Modal` → `dialog`/`alert-dialog`; `DatePicker` →
   dayjs-based `ui/date-picker`; `Upload` → styled file inputs.
4. **Shell** — new `DashboardShellNew` replaced the legacy shell
   behind the opt-in toggle, then became the only shell.
5. **Removal** — antd packages uninstalled, `PublicTheme` and the
   toggle deleted, `.ant-*` CSS stripped, `.legal-prose` and
   dashboard panel selectors updated to plain/shadcn selectors.

## Adding a component

```bash
npx shadcn@latest add <component>   # writes into src/components/ui/
```

Then check the generated file uses the tokens above (it will, via
`globals.css`) and that nothing imports `antd` in the new code.

## Rules for migrated code

- No `antd` / `@ant-design/icons` imports in new or migrated files.
- Icons: `lucide-react`. Colors: theme tokens only, no hex literals.
- Keep German copy and all behavior identical — this is a visual
  migration, not a redesign.
