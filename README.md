# Rechly

Rechly is an open-source invoicing app for freelancers and small businesses. The repository contains the Next.js web app and an optional Django-based ML service used for forecasting and payment-risk insights.

## Stack

- Next.js App Router, React, TypeScript, Ant Design
- Appwrite for auth, database, and server-side admin operations

## Repository Layout

- `src/` - web app routes, UI, shared services, and client/server Appwrite code
- `public/` - static assets and favicons

## Prerequisites

- Node.js 20+
- npm
- An Appwrite project with the database and collections used by the app

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

## Analytics

Revenue forecasting, late-payment risk scoring, customer segmentation, and anomaly detection are computed directly in the Next.js API route (`/api/analytics/insights`). No external ML service is required — the app trains a lightweight logistic regression model on the fly using your invoice history.

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

## Related Repositories

| Repository | Description |
|---|---|
| [rechly_web](https://github.com/myaxyo/rechly_web) | Next.js web app (this repo) |

## Current Gaps

- Appwrite infrastructure is documented but not auto-provisioned.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only).
