# Pool Domains

Pool domains provide subdomain-based site hosting for Uniweb. Each site gets a URL like `{handle}.{pool-domain}` (e.g., `my-site.uniweb.website`). Multiple pool domains can be configured so users can choose which TLD their site lives on.

## Current Pool Domains

| Domain | Zone ID | Status |
|--------|---------|--------|
| `uniweb.website` | `39f6c40bd01ae607ed31e6944a77a10c` | Active |
| `uniweb.wiki` | `4a3d4d1fc4192759a261259a1f43e1ca` | Active |

## How It Works

1. User picks a pool domain in the Domain panel (e.g., "uniweb.wiki")
2. On publish, the Worker writes `{handle}.{pool} → siteId` to KV
3. Incoming requests to `{handle}.{pool}` hit the Cloudflare zone's Worker route
4. Worker checks `SITE_DOMAINS` to identify pool subdomains, resolves via KV

## Adding a New Pool Domain

### Prerequisites

- A registered domain (any registrar)
- Cloudflare account (same account as existing zones)
- Access to Worker secrets (`npx wrangler secret`)
- Access to PHP `startup.ini`

### Step 1: Add Domain to Cloudflare

1. Cloudflare Dashboard → **Add a Site** → enter the domain
2. Select plan (Free works)
3. Update nameservers at your registrar to Cloudflare's assigned NS
4. Wait for zone activation (usually minutes, up to 24h)

### Step 2: Configure DNS

Add these records in the Cloudflare DNS dashboard (both **proxied** / orange cloud):

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `*` | `proxy.uniweb.website` | Proxied |
| CNAME | `@` | `proxy.uniweb.website` | Proxied |

The wildcard catches all `{handle}.{domain}` subdomains. The `@` record catches the bare domain (shows the 404 page).

### Step 3: Get the Zone ID

```bash
curl -s "https://api.cloudflare.com/client/v4/zones?name=NEW_DOMAIN" \
  -H "Authorization: Bearer $CF_API_TOKEN" | python3 -c "
import sys, json
r = json.load(sys.stdin)
z = r['result'][0] if r['result'] else None
print(f'Zone ID: {z[\"id\"]}') if z else print('Not found')
print(f'Status: {z[\"status\"]}') if z else None
"
```

### Step 4: Update Worker Configuration

**wrangler.toml** — add the route and update `SITE_DOMAINS`:

```toml
[vars]
SITE_DOMAINS = "uniweb.website,uniweb.wiki,NEW_DOMAIN"

[[routes]]
pattern = "*/*"
zone_name = "NEW_DOMAIN"
```

### Step 5: Update Worker Secrets

Add the new zone ID to the comma-separated `CF_ZONE_IDS` secret:

```bash
# Get current value, append new zone ID
echo "EXISTING_ZONE_IDS,NEW_ZONE_ID" | npx wrangler secret put CF_ZONE_IDS
```

### Step 6: Deploy Worker

```bash
cd uniweb-edge && npx wrangler deploy
```

Verify the output shows the new route:
```
Deployed site-router triggers
  */* (zone name: uniweb.website)
  */* (zone name: uniweb.wiki)
  */* (zone name: NEW_DOMAIN)        ← new
```

### Step 7: Update PHP Configuration

**`startup.ini`** — add the pool domain and update zone IDs:

```ini
[app]
websiteSubdomain[] = 'uniweb.website'
websiteSubdomain[] = 'uniweb.wiki'
websiteSubdomain[] = 'NEW_DOMAIN'

[cloudflare]
zoneId = 'zone1,zone2,NEW_ZONE_ID'
```

### Step 8: Verify

```bash
# Root domain should show styled 404
curl -s -o /dev/null -w "Status: %{http_code}\n" https://NEW_DOMAIN/

# Any subdomain should show "not published yet" 404
curl -s https://test.NEW_DOMAIN/ | grep -o '<p>.*</p>'

# After publishing a site with this pool: should serve the site
curl -s -o /dev/null -w "Status: %{http_code}\nTier: %header{X-Render-Tier}\n" https://HANDLE.NEW_DOMAIN/
```

## Architecture Notes

- **Worker routes**: Each zone needs its own `[[routes]]` entry in `wrangler.toml`
- **KV entries**: Pool subdomains are plain strings (`siteId`), not JSON
- **Cache purge**: `CF_ZONE_IDS` is comma-separated; Worker purges all zones in parallel on publish
- **PHP `zoneId`**: Also comma-separated; first zone is used for custom hostname APIs, all zones for cache purge
- **Custom domains**: Still route through `proxy.uniweb.website` (Cloudflare for SaaS fallback origin), independent of pool domains
- **Pool selector**: UI reads `websiteSubdomain[]` from PHP config to populate the dropdown
