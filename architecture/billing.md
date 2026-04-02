# Billing System Architecture

Usage-based website subscriptions with Stripe integration.

## Overview

Sites are billed per-feature, not per-plan. Each feature (hosting, languages, search, analytics, low TTL) is an independent line item with its own Stripe product and pricing.

## Feature Pricing (Website)

| Feature | Type | Monthly | Yearly | Default |
|---------|------|---------|--------|---------|
| Website Hosting | boolean | $10 | $100 | Required |
| Additional Language | quantity | $5/extra | $50/extra | 1 included |
| Site Search | boolean | $5 | $50 | Off |
| Integrated Analytics | boolean | $5 | $50 | Off |
| Low Cache TTL | boolean | $5 | $50 | Off (24h default) |

## Data Model

```
billing_customers          — One per user, links to Stripe customer
  ├── credit_balance_cents — Synced from Stripe balance (for display)
  └── stripe_customer_id

billing_features           — One per feature, each is its own Stripe product
  ├── stripe_product_id    — Per-feature Stripe product
  ├── stripe_price_id_*    — Monthly/yearly Stripe prices
  └── price_cents_*        — Our canonical prices

billing_website_subscriptions — One per site
  ├── stripe_subscription_id
  ├── stripe_payment_method_id — Per-subscription PM
  ├── features (JSON)          — Current feature set
  └── current_period_start/end — For proration calculation
```

## Checkout Flow

```
PublishWithPayment (review modal)
  │── Feature toggles save to website metadata
  │── reviewWebsite → checks subscription vs metadata
  │── If no changes → publish directly
  │── If changes → open Checkout modal
  │
  ├── NewFeatureSummary (no subscription yet)
  │     └── PaymentScreen → createWebsite → publishSite
  │
  └── UpdateFeatureSummary (has subscription)
        ├── Shows: changes, current vs new, proration + credits
        ├── If charge > $0.10 → PaymentScreen → updateFeatures → publishSite
        └── If credit/zero → "Update & Publish" → updateFeatures → publishSite
```

## Proration

Matches Stripe's calculation exactly:

```
prorated_cents = round(price_cents × remaining_seconds / total_period_seconds)
```

- `remaining_seconds`: from change time to period end (second-level precision)
- `total_period_seconds`: actual billing period (`period_end - period_start`)
- `round()`: standard rounding (matches Stripe)
- Remaining capped at `total - 1` to prevent fraction = 1.0 from clock skew

## Credit Balance

Credits arise from downgrades (removing features mid-cycle). Stripe stores them as negative customer balance and auto-applies on the next invoice.

Our DB mirrors Stripe's balance in `billing_customers.credit_balance_cents` (positive = credit available). Synced after:
- `updateFeatures()` — any feature change
- `switchInterval()` — billing cycle switch
- `handleInvoicePaid()` — webhook on monthly renewal

The checkout UI shows credits in the proration breakdown:
```
Prorated charge          $9.99
Credit applied          -$4.99
─────────────────────────────
Amount due               $5.00
```

## Entitlements

Feature flags are baked into the publish JWT (signed by PHP, verified by Worker):

```json
{
  "entitlements": {
    "dynamicCacheTtl": 60,
    "searchEnabled": true,
    "analyticsEnabled": false
  }
}
```

The Worker reads these from the trusted JWT claims and stores them in `meta.json` on R2. The serve path uses `meta.dynamicCacheTtl` for edge cache TTL:

| Feature | meta.json field | Effect |
|---------|----------------|--------|
| Low Cache TTL | `dynamicCacheTtl: 60` | Dynamic pages cached 60s instead of 24h |
| Site Search | `searchEnabled: true` | Reserved for future Worker search feature |
| Analytics | `analyticsEnabled: true` | Reserved for future Worker analytics |

## Security

- **Stale request protection**: `create()` and `updateFeatures()` validate that frontend-sent features match `getRequestedFeatures()` from the DB. Rejects with a clear error if mismatched (e.g., old browser tab).
- **No trusted amounts**: Frontend never sends dollar amounts. Backend calculates all prices from the product catalog. Stripe prices come from synced products.
- **Entitlements in JWT**: Worker reads feature flags from the signed token, not from the request body. Frontend cannot tamper with entitlements.
- **Per-subscription PM**: Payment method stored on the Stripe subscription, not just the customer default.

## Stripe Product Structure

Each billing feature is its own Stripe product (not prices under a shared product). This gives clear invoice line items:

```
Invoice #0042
  Remaining time on Site Search         $5.00
  Remaining time on Integrated Analytics $5.00
  Remaining time on Low Cache TTL       $5.00
  Applied balance                      -$4.99
  ─────────────────────────────────────────
  Amount charged                       $10.01
```

To re-create products from scratch (e.g., test mode reset):
```
billing.php?action=seedProducts&reset=1  (admin only)
```

## API Endpoints (billing.php)

### Auth (logged in)
- `getClientSecret` — Stripe SetupIntent for adding a card
- `listPaymentMethods` — list saved cards
- `attachPaymentMethod` — attach a card after SetupIntent
- `detachPaymentMethod` — remove a card
- `getAddress` / `updateAddress` — billing address on Stripe customer
- `validateCoupon` — check promo code
- `getFeatures` — product catalog with prices

### Edit (requires site edit access)
- `reviewWebsite` — pre-publish billing check (features, proration, credits)
- `createWebsite` — new subscription
- `updateWebsiteFeatures` — change features mid-cycle
- `switchWebsiteInterval` — monthly ↔ yearly
- `cancelWebsite` — cancel subscription
- `getWebsiteSubscription` — current subscription details

### Admin
- `seedProducts` — seed/reset product catalog + Stripe sync
