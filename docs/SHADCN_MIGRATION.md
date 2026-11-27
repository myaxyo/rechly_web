# shadcn/ui migration

Branch: `migration/shadcn-ui` (from `main`). Goal: replace Ant Design with
shadcn/ui + Tailwind without any visible change for users.

## Principle: coexistence, no big bang

Ant Design stays fully installed and untouched until the last phase.
shadcn/ui primitives live in `src/components/ui/` and are adopted
page-by-page. A page is migrated only when its shadcn version is
pixel-equivalent to the AntD version it replaces.

Visual parity is enforced by tokens, not by eye: `src/app/globals.css`
maps every shadcn variable to the current Rechly palette from
`src/components/PublicTheme.tsx` (AntD `ConfigProvider`):

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

## Next phases

1. **Leaf components** — add `label`, `badge`, `skeleton`, `separator`,
   `tooltip`, `dialog`, `dropdown-menu`, `table`, `tabs`, `switch`,
   `checkbox`, `select`, `sonner` (replaces `message`/`notification`).
   Migrate one leaf component at a time in low-traffic pages first.
2. **Forms** — react-hook-form + zod wrappers replacing AntD `Form`
   in auth pages (`login`, `register`, `forgot-password`), then
   dashboard forms.
3. **Data** — `Table` → TanStack Table + `ui/table`; `Modal` →
   `dialog`; `DatePicker`, `Upload` get dedicated replacements.
4. **Shell** — `DashboardShell` (`Layout`/`Menu`/`Drawer`) → shadcn
   `sidebar` + custom header, last because it frames every page.
5. **Removal** — drop `antd`, `@ant-design/icons`,
   `@ant-design/nextjs-registry`, `AntdRegistry`, `PublicTheme`,
   and the `.ant-*` overrides in `globals.css` / `dashboard.css`.

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
