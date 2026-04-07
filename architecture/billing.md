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
  ├── interval                 — 'month' or 'year'
  ├── pending_interval         — Deferred switch target (yearly→monthly)
  ├── pending_schedule_id      — Stripe SubscriptionSchedule handle
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

Our DB mirrors Stripe's balance in `billing_customers.credit_balance_cents` (positive = credit available). Synced via the `invoice.paid` webhook after any Stripe invoice settles (including feature updates and cycle switches). We do NOT push credits to `customer.balance` manually — Stripe's `always_invoice` proration applies the credit directly on the immediate invoice. Attempting a manual push on top of that causes a double-credit regression.

The checkout UI shows credits in the proration breakdown:
```
Prorated charge          $9.99
Credit applied          -$4.99
─────────────────────────────
Amount due               $5.00
```

## Switch Billing Cycle

Users can switch between monthly and yearly billing from the settings page. The two directions have very different semantics.

### Monthly → Yearly (immediate)

Happens on the spot through a confirmation modal that previews the exact charge.

```
reviewSwitchInterval (PHP)
  ├── calculateCycleSwitch (our calculator, vendor-portable)
  │     ├── currentInvoicePaidCents — fetched from gateway (what the
  │     │    user actually paid for the current period, not list price;
  │     │    accounts for once-coupons and partial refunds)
  │     ├── forever/repeating coupons discount the new yearly subtotal
  │     └── credit = paidAmount × (remaining/total)  (second precision)
  ├── cross-check vs Stripe Invoice::upcoming preview (logs drift > $1)
  └── returns breakdown: subtotal, proration credit, balance credit, amount due

switchInterval (on confirm)
  ├── gateway->updateSubscription(items=yearly, proration_behavior=always_invoice)
  │     Stripe charges (new yearly − prorated credit for unused month)
  ├── resync current_period_start/end from Stripe (Stripe re-anchors to 1y out)
  └── drift detector logs if actual Stripe invoice total != our prediction
```

**No manual `customer.balance` push.** Stripe's `always_invoice` proration credits the unused month directly on the immediate invoice. Pushing an additional credit onto the customer balance is a double-credit bug.

### Yearly → Monthly (deferred, via Stripe Subscription Schedules)

Clicking "Switch to monthly" while on yearly does NOT swap items. Instead it creates a 2-phase **Stripe Subscription Schedule** wrapping the existing subscription:

```
Phase 1: current yearly items, until current_period_end (already paid)
Phase 2: monthly items, starts at period_end, no end
end_behavior: release
```

Stripe enforces the phase transition atomically at `period_end` — no webhook race, no cron, no double charge. The subscription ID is preserved throughout. We store the schedule ID in `billing_website_subscriptions.pending_schedule_id` and mirror the target interval in `pending_interval` for the frontend badge.

**Why this over `invoice.paid` webhook + item swap?** Our first attempt used a webhook hook to swap items after the renewal invoice was paid — which meant the user paid for another full yearly period and then we switched them to monthly. Stripe Schedules are the correct primitive for this.

**Cancel scheduled switch** calls `SubscriptionSchedule::retrieve($id)->release()`, which unwraps the schedule and leaves the subscription in its current phase-1 state (still yearly, no change). Both DB flags are cleared. No confirmation modal — low-stakes reversible action.

**Back-and-forth toggling** works — each new "Switch to monthly" first releases any existing schedule, then creates a fresh one, so there are never orphan schedules.

### Frontend

- `SwitchCycleSummary.jsx` — confirmation modal. Side-by-side current/new plan, proration breakdown, "Charged today" (immediate) or amber "Takes effect on [date]" banner (deferred).
- `PublishedWebsites.jsx` — shows an amber "Switching to monthly on [date]" badge when a pending switch exists; dropdown menu item becomes "Cancel scheduled switch".

### Testing

| CLI Command | What it verifies |
| --- | --- |
| `billing testCycleSwitch` | 70 cases (10 coupons × 7 offsets) — calculator matches `Invoice::upcoming` to within 1 cent |
| `billing testSwitchCycleE2E` | 5 scenarios exercising the real service methods: monthly→yearly with/without coupons, deferred yearly→monthly (asserts new period is ~30d not ~365d, latest invoice is ~$15 not ~$150), and back-and-forth toggle (asserts no orphan schedules) |
| `billing inspectStripe -siteId=N` | Print DB + Stripe state for a site for manual debugging |

### Gotcha — DBConnect null-drop

`DBConnect::update()` silently drops `null` values because `escapeData()` uses `isset($data[$key])`. To clear a nullable column, use raw SQL:

```php
$this->db->applyQuery("UPDATE `tbl` SET `col` = NULL WHERE `id` = $id");
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
- `reviewWebsiteSwitchInterval` — preview a billing cycle switch (powers the confirmation modal)
- `switchWebsiteInterval` — monthly ↔ yearly (immediate monthly→yearly, deferred yearly→monthly via Stripe Schedule)
- `cancelWebsite` — cancel subscription
- `getWebsiteSubscription` — current subscription details

### Admin
- `seedProducts` — seed/reset product catalog + Stripe sync
