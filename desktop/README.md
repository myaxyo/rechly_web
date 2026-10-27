# Rechly Desktop

The desktop app runs the production Next.js standalone server as a child of
Electron and displays it only on a random loopback port. The renderer has no
Node.js access; Electron context isolation and sandboxing stay enabled.

When `RECHLY_DESKTOP=1`, the existing server API uses the compatibility layer in
`src/lib/desktop/appwrite-compat.ts`. Documents are stored in `rechly.sqlite`
inside Electron's application-data directory. Receipt files live beside the
database. The hosted web app continues to use Appwrite.

The current local adapter supports the document queries used by the Rechly API,
local user preferences, and receipt storage. Network-only services such as VAT
ID verification and hosted AI remain network features. Ollama can be configured
as a local AI provider.

For releases, build and sign each platform on that platform. Do not package a
development `.desktop-data` directory; the Electron Builder configuration
explicitly excludes it.
