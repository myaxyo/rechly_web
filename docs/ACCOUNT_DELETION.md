# Self-Service Account and Data Deletion

## Overview

Users can immediately and permanently delete their own account and all associated data from **Settings → Account → Delete Account** (`DELETE /api/auth/account`) without operator review.

## What is deleted

1. **Storage files**: All files owned by the user in the `receipts` bucket.
2. **Child records**: `invoice_items`, `offer_items`, and `recurring_invoice_items` belonging to the user's documents.
3. **Tenant documents**: All documents in `invoices`, `offers`, `recurring_invoices`, `dunning_notices`, `expenses`, `bank_transactions`, `products`, `clients`, and `user_company` owned by the user.
4. **User identity & preferences**: The Appwrite user record and preferences (including any saved AI settings/keys), followed by clearing the session cookie.

## Verification

```bash
npx tsx --test tests/account-deletion.test.ts
npx tsc --noEmit
npm run build
```
