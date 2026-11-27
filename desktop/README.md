# Electron + SQLite development wrapper (not Rechly Desktop)

**This folder is not the shipped offline product.**

The production offline app is **[Rechly Desktop](https://github.com/myaxyo/rechly_desktop)**
(`myaxyo/rechly_desktop`). Do not market, version, or design this wrapper as a
third UI stack. See [docs/PRODUCT_RULE.md](../docs/PRODUCT_RULE.md).

## What this is

A local Electron shell that loads the **same Next.js web UI** (shadcn) against a
SQLite Appwrite-compatibility layer for development and integration tests.

When `RECHLY_DESKTOP=1`, the API uses `src/lib/desktop/appwrite-compat.ts`.
Documents live in `rechly.sqlite` under `RECHLY_DATA_DIR` (default `.desktop-data`).

```bash
npm run desktop:dev
```

Network-only services (VAT ID check, hosted AI) still need the network. Ollama
can be configured as a local AI provider.

Do not package a development `.desktop-data` directory; Electron Builder
excludes it.
