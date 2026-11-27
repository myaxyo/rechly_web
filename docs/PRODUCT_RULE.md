# Rechly dual-product rule

Rechly is **one brand, two runtimes**. Do not grow both as full copies of each other.

## The rule

| | **Web** (`rechly_web`) | **Desktop** (`rechly_desktop`) |
|--|--|--|
| **Job** | Anywhere access, accounts, automation, public surfaces | Offline vault, privacy, native OS, local AI |
| **Owns** | Auth/Appwrite, recurring invoices, dunning, bank matching, Termine booking, SEO tools hub, share links | SQLite vault, encrypted `.rechly-backup`, OS notifications/print/updater, Ollama model install, ZUGFeRD PDF/A-3 hybrid |
| **UI stack** | Next.js + React + shadcn/ui | Vanilla HTML/CSS/JS (no React/shadcn rewrite) |
| **Shared** | Brand tokens, pure domain math (`src/lib/core` / Desktop copies), German compliance semantics | Same |

## Porting rule

- Port **domain logic** (GiroCode, tax/XML helpers, decimal parsing) via shared pure modules (`src/lib/core` on web; mirrored helpers on desktop).
- Port **features** one way when the product rule says the other edition owns them — do not forever race “who’s ahead.”
- Prefer **encrypted vault bridge** (backup import/export) over live multi-master sync.

## Not a third product

`rechly_web/desktop/` is an **Electron + SQLite development wrapper** for the Next.js app. It is **not** Rechly Desktop and must not be marketed, versioned, or designed as a third UI stack. Shipped offline installs come only from [rechly_desktop](https://github.com/myaxyo/rechly_desktop).

## UI stacks

- **Do not** adopt shadcn/React on standalone desktop unless product intentionally merges to one frontend.
- **Do** keep visual parity through shared CSS design tokens.
- **Do** keep web on shadcn after the Ant Design cutover.
