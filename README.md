# Rechly

Rechly is an open-source invoicing app for freelancers and small businesses. The repository contains the Next.js web app and an optional Django-based ML service used for forecasting and payment-risk insights.

## Stack

- Next.js App Router, React, TypeScript, Ant Design
- Appwrite for auth, database, and server-side admin operations
- Django REST Framework and Python-based ML workflows in `services/ml_api`

## Repository Layout

- `src/` - web app routes, UI, shared services, and client/server Appwrite code
- `services/ml_api/` - optional ML and analytics service
- `public/` - static assets and favicons

## Prerequisites

- Node.js 20+
- npm
- An Appwrite project with the database and collections used by the app
- Python 3.12+ if you want to run the ML service

## Web App Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

The app expects the Appwrite database and collections defined in `src/lib/appwrite.ts` and `src/lib/appwrite-server.ts`. Rechly does not yet ship Appwrite provisioning automation, so self-hosters need to create those resources in their own Appwrite project.

## ML Service Setup

The ML service is optional. The web app will still run without it, but analytics features that rely on forecasting or risk scoring will degrade gracefully.

1. Follow the setup instructions in `services/ml_api/README.md`.
2. Set `ML_API_URL` and `ML_API_SECRET` in `.env.local` once the service is running.

## Open-Source Release Notes

- Do not commit `.env.local` or any real credentials.
- Rotate any secrets that existed in local or historical tracked files before publishing this repository.
- Google Analytics is disabled by default unless `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is set.
- All deploy-specific URLs, repo links, and contact details should be configured via environment variables.
- User-provided AI API keys are encrypted server-side and require `AI_SETTINGS_ENCRYPTION_SECRET` to be set.
- AI requests are rate-limited per user through `AI_DAILY_REQUEST_LIMIT` to reduce accidental provider cost spikes.

## Development Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Gaps

- Appwrite infrastructure is documented but not auto-provisioned.
- The ML service requires Appwrite data and trained artifacts for full functionality.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).
