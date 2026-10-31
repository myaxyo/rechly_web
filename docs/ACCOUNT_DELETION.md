# Account deletion and retention review

## Current behavior

The default is **review**, because the operator has not yet established which
records must be retained. The authenticated user submits a deletion request;
the application saves `rechlyDeletionRequest` in their Appwrite user preferences
with `status: pending_review` and the first request timestamp. It returns HTTP
202 and displays a review acknowledgement. It does not sign the user out, erase
records, or claim that deletion has completed. Repeated requests preserve the
original timestamp. No schema migration or server admin key is needed to record
requests; the user's existing authenticated account updates its preferences.

**An operator must monitor and process these requests. No automatic email is
sent.** To list pending requests using an operator key with `users.read`:

```bash
node --env-file=.env.local scripts/list-deletion-requests.mjs
```

The report contains account IDs and request timestamps. Review their user
preferences in the Appwrite console. Do not consider listing a request or
blocking an account to be evidence of deletion. Verify the requesting person's
identity before handling an email-only request. Decide retained records, their
legal basis, restricted access and retention period with appropriate advice;
then confirm the actual result to the user. Do not promise that account deletion
also removes legally retained records or backups immediately.

## Optional erasure mode

Keep `ACCOUNT_DELETION_MODE` unset (or `review`) until the retention policy and
operations process are ready. Setting it to `erase` enables destructive
self-service erasure for authenticated users after their UI confirmation.
`ACCOUNT_DELETION_HOLD_USER_IDS` is a comma-separated list of Appwrite user IDs
that must always follow the review path, even in erasure mode. This is an
operator-managed safeguard, not an automatic legal classification system.
Configure `NEXT_PUBLIC_APP_URL` to the externally visible site URL so that
same-origin checks work behind a reverse proxy.

Erasure requires the server Appwrite key to have `users.read`, `users.write`,
`documents.read`, `documents.write`, `files.read`, and `files.write` scopes. Verify
these in staging before enabling it. No key is exposed to the browser.

The erasure service removes tenant-owned invoices, offers, recurring templates,
their line items, dunning notices, expenses, bank transactions, products,
customers and company settings. It scans the receipts bucket for files with the
user's delete permission, including abandoned/replaced uploads, rather than
trusting arbitrary expense file references. The Appwrite identity and its
preferences (including saved AI settings/keys) are deleted last via Users.delete.
Only a successful identity deletion clears the server session cookie. Request
bodies cannot choose a target account ID.

Cleanup is ordered and retryable, **not a cross-service transaction**. A failure
can leave some data deleted while keeping the account available to retry. Child
rows are removed before parents so a retry can still find unfinished children.
An already missing individual document/file is tolerated; permission errors and
service failures are not reported as success. Large accounts may require an
operator-controlled cleanup window. Before enabling erasure, establish a process
to prevent concurrent writes during deletion (including direct Appwrite SDK
access); this implementation does not provide a durable background job or a
project-wide write lock. Review mode remains the safe default until then.

Separate systems, server logs, exported documents, backups and third-party
providers require their own retention/deletion procedures. Review-mode requests
can be seen in Appwrite and in the read-only report; they do not schedule cleanup.

## Bug fixes and validation

The former browser flow bypassed the SSR cookie, revoked sessions before its
next authenticated operation, and called Account.updateStatus, which disables
an account instead of deleting it. The new endpoint supports the SSR cookie and
JWT authentication. Browser-SDK-only sessions can mint a JWT if no SSR session
exists. It requires an explicit confirmation header and rejects cross-site
requests. Desktop profiles are excluded from hosted-account deletion.

The confirmation dialog stays open on failures. It distinguishes a review
request from completed deletion, and warns users to export required documents.

```bash
npx tsx --test tests/account-deletion.test.ts
npx tsc --noEmit
npm run build
```

Tests use synthetic records and injected Appwrite operations. No live customer
account was deleted, and no customer email was sent. Live Appwrite behavior,
production key scopes and the actual customer's account still require an
operator verification; this workspace has no configured live Appwrite access.

Seven focused tests cover authorization, retention review, pagination, file
ownership, dependency order, partial failures/retries, and reverse-proxy origins.
A Chromium browser check with mocked API responses verifies a failed attempt
keeps the dialog open, a retry shows the review acknowledgement, and the account
stays signed in with a visible pending-request status. Existing invoice tests
also pass. TypeScript and changed-file lint checks pass.
