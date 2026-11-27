# Vault bridge (Web ⇄ Desktop)

Not live sync. Optional **import/export** so users can move accounting data
between editions without a multi-master database.

| Direction | Format | How |
| --- | --- | --- |
| Web → anywhere | `.json` Rechly backup | Migration wizard / API `GET /api/migration/backup` |
| Desktop → Web | `.rechly-backup` (scrypt + AES-256-GCM) | Drop file in migration wizard → password → `POST /api/migration/decrypt-desktop-vault` |
| Desktop → Desktop | `.rechly-backup` | Native backup export/restore in Desktop |
| Web/Desktop JSON | `.json` | Already supported on both sides |

Encrypted Desktop vault decryption runs **server-side** (Node `crypto.scrypt`)
with the same parameters as Desktop (`N=131072`, `r=8`, `p=1`). API keys are
stripped from Desktop exports and never required for the bridge.

See PRODUCT_RULE.md for the dual-product boundary.
