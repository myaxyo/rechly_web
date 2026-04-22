# Contributing

Thanks for contributing to Rechly.

## Before You Start

- Open an issue for bugs, regressions, or larger features before sending a major pull request.
- Keep pull requests focused. Small, reviewable changes are preferred over broad rewrites.
- Never commit real credentials, production URLs, or private customer data.

## Local Setup

1. Install web dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in local or test values.
3. If you need the ML service, follow `services/ml_api/README.md`.

## Pull Request Checklist

- Update documentation when behavior or setup changes.
- Keep new configuration in `.env.example` or `services/ml_api/.env.example`.
- Run the narrowest validation that covers your change.
- Call out any remaining manual steps in the pull request description.

## Scope

The maintainers may decline changes that introduce unrelated refactors, private infrastructure assumptions, or public API changes without a clear migration path.
