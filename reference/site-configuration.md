# Site Configuration

The `site.yml` file in your site root defines global settings, page ordering, language support, and feature toggles.

## Quick Start

A minimal site.yml:

```yaml
name: My Site
```

That's all you need to get started. Everything else has sensible defaults.

## Full Reference

```yaml
# Identity
name: My Site
description: A brief description for SEO
keywords: [components, react, cms]   # Default meta keywords (pages can override)
seo:                                 # Site-level social card + SEO defaults
  image: /og-default.png             # Default Open Graph / social-sharing image
  ogTitle: My Site

# Page Ordering
pages: [home, about, ...]            # Inclusive order (first is homepage, ... = rest)
pages: [home, about, docs]           # Strict order (unlisted hidden from nav)
index: home                          # Or just name the homepage

# Languages
defaultLanguage: en
languages: [en, es, fr]              # Or '*' to auto-discover from locales/

# Code — the foundation and its extensions
foundation: '@acme/marketing@1.2.3'  # Or a workspace package name, or a full URL
extensions:                          # Secondary foundations (optional)
  - '@acme/effects@0.3.1'

# Features
search:
  enabled: true

# An app backend, if this site has one
api: /_api                           # where it answers — same in dev and production
$devApi: ./mock/api.js               # what answers it locally (never published)

# Build Options
build:
  prerender: true                    # Generate static HTML

# Data Sources
fetch:
  path: /data/global.json
  as: siteConfig

# Content Collections
queries:
  articles:
    schema: '@/article'
    sort: date desc

# Custom Content Paths (optional, for external content)
paths:
  pages: ../docs/pages             # Default: pages/
  layout: ../docs/layout           # Default: layout/
  entities: ../content             # Default: entities/
```

---

## Identity

```yaml
name: My Site
description: Build modern websites with components
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Site name (used in `<title>`, metadata) |
| `description` | string | Default meta description |

---

## Code: Foundation and Extensions

A site is content; the code that renders it comes from two declarations, which take
the same kinds of value because **an extension is a foundation**.

```yaml
foundation: '@acme/marketing@1.2.3'   # the primary — required
extensions:                            # secondary foundations — optional
  - '@acme/effects@0.3.1'
```

You don't declare a runtime version. A site ships no JavaScript — content, config,
data and assets only — so nothing in it links against the runtime and nothing in it
breaks when the runtime moves. The host serves a runtime compatible with whatever
foundation the site loads.

### `foundation`

The component system your pages are composed from. Four accepted shapes:

| Shape | Example | Meaning |
|---|---|---|
| workspace package name | `src` | a foundation in this repo (follow the `file:` dep to its folder) |
| versioned catalog ref | `@acme/marketing@1.2.3` | published; loaded by the host |
| full URL | `https://cdn.example.com/entry.js` | loaded from that URL |
| object form | `{ url: 'https://…' }` | same, with an explicit CSS URL if needed |

A **versionless** `@org/name` is an error rather than a shorthand — the build asks for
a version. Foundations are never npm packages; don't `npm install` one.

### `extensions`

Secondary foundations that contribute additional section types. Each entry accepts the
**same shapes** as `foundation:`, and the primary wins on a name collision.

```yaml
extensions:
  - '@acme/effects@0.3.1'              # catalog ref  — recommended
  - effects                            # a workspace package name (local development)
  - https://cdn.example.com/e/entry.js # an absolute URL
```

> **A site-relative URL (`/effects/entry.js`) only works where the site serves its own
> files** — `uniweb export` and `uniweb deploy --host=<adapter>`. A site published to
> Uniweb hosting ships no JS, so nothing serves that path; `uniweb publish` rejects it
> and points you at the catalog-ref form. Register the extension
> (`uniweb register` in its directory) and reference it like any other foundation.

When you reference a **workspace-local** extension, `uniweb publish` brings it along the
same way it does the primary: it releases the extension if its code changed or isn't
registered yet, and pins the released `@scope/name@version` on the published site.

---

## SEO & Social Sharing

Site-level metadata for the homepage's social card and search — and the defaults every page inherits. These mirror the page-level `seo:` / `keywords:` in [page.yml](./page-configuration.md#seo-configuration), hoisted to the site root.

```yaml
keywords: [components, react, cms]   # Default keywords (pages can override)
seo:
  image: /og-default.png             # Default Open Graph / social-card image
  ogTitle: Acme — Build with Components
  ogDescription: The component content platform.
  noindex: false                     # Set true to keep the whole site out of search
```

| Field | Type | Description |
|-------|------|-------------|
| `keywords` | string[] | Default meta keywords; a page's own `keywords` override |
| `seo.image` | string | Default Open Graph / social-sharing image (the site's social card) |
| `seo.ogTitle` | string | Default social title; a page's own title or `seo.ogTitle` wins |
| `seo.ogDescription` | string | Default social description; a page's description or `seo.ogDescription` wins |
| `seo.noindex` | boolean | Keep the entire site out of search engines (cascades to every page) |

**Cascade:** site-level `seo` and `keywords` are *defaults*. Each page overrides any field it sets — the page wins, the site fills the gaps. The social image is the field most worth setting once at the site level.

These render into the static HTML `<head>` (Open Graph, Twitter Card, canonical, robots) for the homepage and every page, so crawlers and social unfurlers see them without running JavaScript. For arbitrary tags beyond these, use [Custom Head Injection](#custom-head-injection).

---

## Page Ordering

Control the order of top-level pages and designate your homepage.

### Inclusive Order (Recommended)

```yaml
pages: [home, about, ...]
```

The `...` wildcard means "all remaining pages here." Pages before `...` appear first in that order; pages after `...` appear last. Everything else fills the middle.

- First item becomes the homepage (route `/`)
- Other items get their folder name as route (`/about`, `/docs`, `/pricing`)
- `...` expands to all pages not explicitly listed, in their natural order

```yaml
# home first, contact last, everything else in between
pages: [home, ..., contact]

# home first, about second, rest after
pages: [home, about, ...]

# rest first, legal last
pages: [..., legal]
```

### Strict Order

```yaml
pages: [home, about, docs]
```

Without `...`, only listed pages appear in navigation. Unlisted pages are still built and reachable by URL, but suppressed from every nav menu (equivalent to `hideIn: ['*']` — a nav-only exclusion, not `hidden`, which would drop them from the published site).

Use this when you want precise control over what appears in the nav — for example, a landing page with only a few pages in the header.

### Just Set the Homepage

```yaml
index: home
```

Only specify which page is the homepage. Other pages are auto-discovered and sorted by their `order` property.

### Auto-Discovery (Default)

Omit `pages`, `index`, and `order` to auto-discover all pages. They're sorted by the `order` property in each page's `page.yml`, and the lowest `order` becomes the homepage.

---

## Content Mode

By default, `.md` files in a folder are sections of a single page (**page mode**). By placing a `folder.yml` in a directory, you switch it to **folder mode** — where each `.md` file becomes its own page.

| Config file | Mode | Folder is... | `.md` files are... |
|------------|------|--------------|-------------------|
| `page.yml` | page mode | A page | Sections of that page (default) |
| `folder.yml` | folder mode | A container | Individual child pages |

### Folder Mode

Ideal for documentation sites where each file is a standalone article:

```
pages/docs/
├── folder.yml               # Activates folder mode
├── getting-started.md       # → /docs/getting-started
├── configuration.md         # → /docs/configuration
└── advanced/
    ├── folder.yml
    ├── plugins.md           # → /docs/advanced/plugins
    └── themes.md            # → /docs/advanced/themes
```

Page titles come from the H1 heading in each markdown file. Frontmatter remains section configuration (`type:`, `background:`, etc.).

To activate folder mode for the entire site, place a `folder.yml` in the `pages/` directory itself.

### Mode Cascade

The mode set by `folder.yml` or `page.yml` cascades to descendant folders:

1. `folder.yml` in a directory → folder mode for that folder and all descendants
2. `page.yml` in a directory → page mode for that folder and all descendants
3. Neither → inherit from parent (default: page mode)

A single `folder.yml` at the top of a docs tree applies folder mode to the entire tree. A subfolder can override back to page mode with a `page.yml`.

### folder.yml

The configuration file for container folders in folder mode. Analogous to `page.yml` but signals that `.md` files are pages, not sections:

```yaml
# folder.yml
title: Documentation
description: API reference and guides
pages: [getting-started, configuration, ...]
index: getting-started
label: Docs
layout:
  left: true
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Container title (for navigation, breadcrumbs) |
| `description` | string | Meta description |
| `pages` | array | Child page ordering with `...` wildcard support |
| `index` | string | Which child becomes the index page |
| `label` | string | Short navigation label |
| `hidden` | boolean | Hide from navigation |
| `layout` | object | Layout panel overrides |
| `seo` | object | SEO overrides |
| `id` | string | Stable ID for `page:` links |

### Ordering in Folder Mode

Child pages are ordered by:

1. `pages:` array in `folder.yml` with `...` wildcard support (same semantics as site-level)
2. Numeric file prefix (`1-intro.md` before `2-setup.md`)
3. Alphabetical by filename

```yaml
# folder.yml
title: Documentation
pages: [getting-started, configuration, ...]
```

---

## Languages

Enable multi-language support.

```yaml
defaultLanguage: en
languages: [en, es, fr]
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `defaultLanguage` | string | Primary language (no URL prefix). Defaults to the first entry in `languages`, or `en` |
| `languages` | array | Supported languages — the working set you author in |
| `publishLanguages` | array | Which declared languages ship in a published build. Absent = all of them |

### Language Formats

```yaml
# Just codes (display names from @uniweb/kit)
languages: [en, es, fr]

# With custom labels
languages:
  - code: en
    label: English
  - code: es
    label: Español
  - code: fr
    label: Français

# Auto-discover from locales/ folder
languages: '*'
```

Plain string codes are the canonical form; the object form is legacy and only
affects switcher labels (`@uniweb/kit` provides display names for plain codes).

### Draft Languages (`publishLanguages`)

`languages` is your working set; `publishLanguages` declares which of them a
published build actually ships. A declared language you're still translating
stays fully previewable in `uniweb dev` but is excluded from production
output until you add it to the list:

```yaml
languages: [en, fr, de]        # working on all three
publishLanguages: [en, fr]     # de is still a draft — dev-only
```

Rules:

- **Absent field** — every declared language is published (the default, and
  the behavior of all existing sites).
- **Published builds** exclude unlisted languages everywhere a visitor could
  see them: no `dist/{locale}/` output, no locale-switcher entry, no sitemap
  or `hreflang` references. To visitors, a draft language is indistinguishable
  from an undeclared one.
- **`uniweb dev` ignores the list** — drafts render normally so you can work
  on them, the same way `hidden` pages stay previewable in dev.
- **The default language must be published.** A `publishLanguages` that
  excludes the effective default (or an empty list) fails the build with a
  clear error.
- **Codes not in `languages` are kept but inert.** If you remove a language
  from `languages` while it's listed in `publishLanguages`, the entry stays
  (with a build warning) — re-declaring the language later restores it as
  published without touching the list again.
- `uniweb i18n` commands keep operating on the full declared set — drafts are
  exactly what you're translating.

### Translation Workflow

Translations are extracted and managed through a hash-based system:

```bash
uniweb i18n extract    # Extract translatable strings
uniweb i18n sync       # Detect changes
uniweb i18n status     # Check coverage
```

This generates `locales/manifest.json` with all translatable content, and you provide translations in `locales/{locale}.json` keyed by content hash.

### Generated Routes

| Page | Default Locale | Other Locales |
|------|----------------|---------------|
| Home | `/` | `/es/`, `/fr/` |
| About | `/about` | `/es/about`, `/fr/about` |

See [Internationalization](../development/internationalization.md) for the full guide.

### Advanced i18n Options

Less common settings remain under the `i18n:` key:

```yaml
i18n:
  routeTranslations: ...
  localesDir: translations         # Default: locales
```

---

## Search

Enable built-in full-text search. Search is **on by default** — you only need to write this to turn
it off or to set an option.

```yaml
search: true       # shorthand
search: false      # turn it off
```

The shorthand and the object form mean the same thing, so `search: false` and
`search: { enabled: false }` are interchangeable. Use the object form when you want any of the other
options below.

```yaml
search:
  enabled: true
```

### Full Options

```yaml
search:
  enabled: true
  include:
    pages: true
    sections: true
    headings: true
    paragraphs: true
  exclude:
    routes: [/admin, /draft]
    components: [CodeBlock]
```

See [Site Search](../authoring/search.md) for details.

---

## Agent-Readable Artifacts

Every build emits an index and per-page markdown that an AI agent can read directly. **Free
and on by default** — this block only turns things off or narrows them.

```yaml
agents:
  index: true            # /llms.txt — an annotated index of the site
  markdown: true         # /{route}.md — each page as clean markdown
  branchIndexes: true    # /docs/llms.txt for branches large enough to want one
  branchMinPages: 5      # how large is large enough
  exclude: [/internal]   # keep a branch out of both (cascades to its subtree)

agents: false            # or turn the whole capability off in one word
```

`exclude` takes route path prefixes and excludes the whole branch. The leading slash is
optional and a trailing one is ignored, so `/internal`, `internal` and `/internal/` are the
same. Matching is by whole segment — `/internal` excludes `/internal/pay` and does **not**
exclude `/internally-facing`. **Wildcards are not supported**: `/internal*` matches nothing
and silently excludes nothing.

`seo.noindex` pages, `hidden` pages, `_`-prefixed drafts, dynamic route templates and
[knowledge pages](./page-configuration.md#agent-content-knowledge) are excluded already.

### Expected origins

If the site runs an agent, declare where its requests are expected to come from. This suits a
site that exists to serve someone else's app — a chat endpoint your web app calls — rather
than its own visitors.

```yaml
agents:
  expectedOrigins:
    - https://app.example.com
    - https://partner.example.org
```

**It is a declaration, not a gate.** You are telling the host where you expect callers from; a
host that offers an agent may then decline requests whose browser-sent `Origin` is not among
them, before spending anything on an answer. Where it is honoured:

| | |
|---|---|
| not declared | no check at all — nothing happens unless you ask for it |
| your own site's origin | always accepted, without listing it |
| a request with no `Origin` | **accepted** — see below |
| matching | exact, per entry; no wildcards |

> ⛔ **This is not a spend limit and cannot be made into one.** `Origin` is set by the browser
> and enforced by the browser — anything that is not a browser sends whatever it likes, or
> nothing at all. It stops **casual misuse and third-party embedding**, such as someone
> dropping your endpoint into their own page. It does not stop anyone determined to run up
> your bill. Do not size a budget on it.

A request with no `Origin` is accepted deliberately, because there are two shapes of caller
and this sees only one: your app's **JavaScript** sends `Origin` and is covered; your app's
**server** never sends one, and refusing it would break the integration this partly exists
for. Server-to-server callers are authenticated by arrangement with your host.

> **Never put a shared secret in `site.yml`.** Everything in it is delivered to every visitor
> as part of the site payload.

Unknown keys in `agents:` are forwarded to your host as opaque data and simply never acted
on, so a typo is silent. `uniweb doctor` flags them.

---

## An App Backend

A site can have its own backend — accounts, per-visitor data, content its members
create. `api:` says where that backend answers:

```yaml
api: /_api
```

Components never see this value. They ask [`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api),
which reads it and answers "there is no backend" on a site that declares none — so a
foundation works unchanged on a site with a backend and on a site without one.

### Developing against it: `$devApi`

Building an app against a live backend is slow, and it puts a shared database behind
your experiments. Name a local handler instead:

```yaml
api: /_api                 # unchanged — the address is the same everywhere
$devApi: ./mock/api.js     # development only
```

`./mock/api.js` default-exports a function that takes a `Request` and returns a
`Response`:

```js
export default (request) => Response.json({ entities: [], matched: 0 })
```

The dev server mounts it at your `api:` address. Because that is the **same address**
production uses, nothing in your foundation knows which one it is talking to — and
because it is **same-origin**, sign-in cookies behave exactly as they will in
production.

Anything can sit behind it: a hand-written stub, recorded fixtures, or your real
service running as a function. If you are building against Uniweb's own app backend,
`@uniweb/api` ships one that speaks it:

```js
// mock/api.js
import { createMockBackend } from '@uniweb/api/mock'
export default createMockBackend({ seed }).fetch
```

> **`$devApi` is never published.** Keys beginning with `$` are local to your working
> copy and are stripped from the built site, so a visitor cannot reach your local
> handler and a build cannot ship it by accident. Delete the line and the site still
> works — it simply has no backend, and the features that need one disappear rather
> than break.

The `conference` template is a worked example — a programme that reads as a static
site, and becomes an editable app for the people running the event:

```bash
uniweb create my-event --template conference
```

## Form Submissions

Declare where this site's forms send their submissions.

```yaml
submit: /forms
```

**Optional, and often unnecessary.** A form's destination comes from the first
of these that applies:

1. `submit:` here, if you set it.
2. One the host supplies — a site published to Uniweb Cloud gets submission
   handling from the platform and normally needs no `submit:`.
3. Neither, in which case forms render disabled rather than posting a visitor's
   answers to an endpoint that may not exist.

So set this when *you* are providing the endpoint — `uniweb export`, or a
`deploy --host` target with its own form handling. Setting it on Uniweb Cloud
overrides what the platform would have supplied.

### Full Options

```yaml
submit: /forms                              # shorthand

submit:
  endpoint: /forms                          # object form

submit: https://forms.example.com/intake    # another origin
```

A relative endpoint resolves against the site's `base:`, so one spelling works
whether the site is served from the root or from a subdirectory. An absolute
URL is used as written.

See [Receiving Form Submissions](../development/receiving-form-submissions.md)
for the component side.

---

## Tracking

Where this site's usage events go. One destination, one stream: page views and
anything a component reports share it.

```yaml
tracking: https://collector.example.com/events
```

Off unless you set it. With no destination configured, nothing is collected and
nothing is sent — components that report events simply do nothing.

### Full Options

```yaml
tracking: /collect                              # shorthand — a path on your own site

tracking:
  endpoint: https://collector.example.com/events   # object form
  consent: required                             # hold everything until the visitor agrees
  scripts:                                      # a vendor's own script — see below
    - https://vendor.example.com/tag.js
```

A relative endpoint resolves against the site's `base:`, the same way `submit:`
and `search:` do. An absolute URL is used as written.

A host may also provide a destination, in which case you need nothing here. Your
own `tracking:` always wins over the host's.

> **The endpoint is yours to provide.** Events are sent in the format below, so
> the destination has to be something that accepts it — your own collector, a
> function you deploy, or an endpoint your host offers. A third-party analytics
> product's public API expects that product's own format and will not understand
> these events. Some accept the request and discard the contents, which looks
> exactly like success.

### What your collector receives

One `POST` per flush, batched, with `Content-Type: application/json`:

```json
{
  "events": [
    { "event": "page_view", "visit": "b3f1…", "path": "/about", "first_of_load": true, "referrer": "https://news.example/post" },
    { "event": "page_view", "visit": "b3f1…", "path": "/pricing", "referrer": "https://news.example/post" },
    { "event": "video_milestone", "visit": "b3f1…", "path": "/about", "section": "Hero", "milestone": 50 }
  ]
}
```

Reply with any 2xx. The response body is ignored and a failed send is never
retried — the last flush of a visit goes out as the page unloads, where there is
nothing left to retry with.

**Every event carries `event`, `visit` and `path`.** Components add their own
fields beyond that, and the framework constrains none of them.

**`visit`** is an opaque value generated when the page loads, so your collector
can tell that a set of events came from the same page load and reconstruct what
someone did in what order.

### The events

Three events are sent automatically, with no component involvement.

`page_view` goes out on every route change, including the first:

- **`path`** is site-relative — a site deployed at `/docs/` reports `/about`.
- **`referrer`** is the external page the visitor arrived from, if any.
  Same-site navigation is not a referral and is not reported.
- **`utm_source`, `utm_medium`, `utm_campaign`** ride along when the visitor
  arrived with them.

**`first_of_load`** appears on the one `page_view` that opened the document, and
on no other. A site is a single-page app: after the first load, moving between
pages sends more `page_view` events without loading anything, and those do not
carry it. It is sent **only when true**.

It exists so a collector that stores nothing per-event can still answer questions
about the page load. With it, "which page did this load start on" is a single
field on a single event — no need to remember which `visit` values you have
already seen. ⚠️ It says *first view of this page load*, never *this visitor's
first ever view*: nothing in this system survives the document, so that second
question cannot be asked at all.

**`continues`** appears on a `page_view` when the visitor was already on your
site and something loaded a fresh page rather than navigating within the app —
switching language is the usual cause. It is sent **only when true**.

It exists because that case and a genuine first arrival otherwise look
identical: a visitor arriving from elsewhere carries a `referrer`, and a visitor
coming from one of your own pages has that referrer dropped (your site should
not appear as its own top referrer) — leaving both with nothing. Without this
field, a "landing pages" report counts every language switch as somebody
arriving on the translated page.

⚠️ It says only *this page load continues a visit* — never which one, and
nothing links the two. And a site that sends `no-referrer` suppresses the signal
it is derived from, so the field will not appear there.

⛔ **`continues` describes the page load, not the individual view — so it is
repeated on every `page_view` of that load.** A site is a single-page app: after
the first load, moving between pages sends more `page_view` events without
loading anything, and each one carries the same `continues` the load started
with. Counting *every* view that lacks `continues` therefore counts one arrival
again for every page the visitor then reads.

To build a landing-pages report: **count a `page_view` that carries
`first_of_load` and does not carry `continues`.** That needs no grouping and no
stored state — the two fields on one event answer it.

⚠️ Three different situations leave `continues` absent and you cannot tell them
apart: a genuine arrival, a site sending `no-referrer`, and a site still running
a framework release from before the field existed. Requiring `first_of_load`
keeps the third one safe: a site too old to send it is left out of the report
entirely, which undercounts, rather than counted as an arrival on every page —
an undercount you can describe, instead of a number that grows on its own as
sites update.

Referrer and campaign values are read **once, when the page first loads**, and
attached to each view of that visit — they exist in the URL only on arrival. So
a per-view count of `utm_source` tells you *views by visitors who **arrived** via
X*, never *views that carried X*. Same numbers, different sentence.

`outbound_click` goes out when a visitor follows a link that leaves your site.
It carries **`hostname`** — the destination host and nothing else. The path and
query string never leave the page, so a link someone shares with a search term
or a token in it cannot deposit that into your analytics.

`section_view` goes out the first time a section is at least half visible, once
per section per page view. It is **off unless a page asks for it** with
`trackSections: true` in that page's `page.yml`, because every section of every
page is a volume of data most sites have no question for.

Everything else is sent by components. Two ship with the framework's component
kit, so they are worth recognising if you build a dashboard:

| event | sent by | fields |
| --- | --- | --- |
| `page_view` | the runtime, automatically | `path`, `first_of_load?`, `continues?`, `referrer?`, `utm_*?` |
| `outbound_click` | the runtime, automatically | `hostname` |
| `section_view` | the runtime, on pages with `trackSections` | `section`, `section_id` |
| `video_milestone` | `<Media>` playing a video | `milestone`, `src` |
| `read_depth` | `useReadingDepth()` in a long section | `depth` — 25, 50, 75, 100 |

Any other event name is one a component chose; there is no list of permitted
names. See the AGENTS.md guide in your project for the component side.

### Choosing what is sent (`emit`)

A site sends `page_view`, `outbound_click` and `section_view` unless it says
otherwise — or, where your host supplies the collector, whatever that host
declares it collects (see *Where your host supplies the collector*, below):

```yaml
tracking:
  endpoint: https://collector.example.com/events
  emit: standard
```

`emit` stands on its own. Where your host supplies the collector you declare
only what to send, and the address comes from the host:

```yaml
tracking:
  emit: minimal
```

The two are read key by key, so naming `emit` alone overrides nothing else the
host declared. Declaring your own `endpoint:` always wins over the host's.

| value | sends |
| --- | --- |
| `minimal` | `page_view` |
| `standard` | `page_view`, `outbound_click`, `section_view` — the default when you supply your own `endpoint:` |
| `all` | everything the framework emits, **including events added in later releases** |
| a list | exactly those event names, e.g. `[page_view, section_view]` |

`standard` and `all` select the same events today. They differ the moment a new
automatic event ships: `all` picks it up, `standard` does not, so **a framework
release never grows what a site sends**.

### Where your host supplies the collector

Naming `emit` is how you decide, and it always wins. **Saying nothing is
different depending on who supplies the address:**

| your site | saying nothing about `emit` means |
| --- | --- |
| declares its own `endpoint:` | `standard` — the curated set above. A later framework release never grows it |
| uses a host-supplied collector | **whatever that host declares it collects** |

The second case is the one to know about. A site on a host has no address of its
own — the arrangement is that the host does analytics for it — so leaving `emit`
unset means *whatever my host offers*, and the set grows if your host starts
collecting something new. That is your host's decision, announced by them, and
it is the same event that changes your bill or your quota.

**If you would rather pin it, name it.** `emit: standard` gives you exactly the
three events above and nothing a host adds later; `emit: minimal` gives you one;
a list gives you precisely what you write. Any of those beats the host's default,
including narrowing to less than the host offers.

**`emit` does not limit what components send.** `block.track()` and
`useTracker()` are unaffected — it governs only the events the framework emits
on its own. A host that supplies your collector may narrow the list further if
it will not store an event; it can never widen it beyond what you asked for.

### Batching (`flushIntervalMs`)

Events are batched and sent on a timer — every 5 seconds by default. A page view
is sent immediately rather than waiting, and whatever is still queued is flushed
when the page is hidden or closed.

```yaml
tracking:
  endpoint: https://collector.example.com/events
  flushIntervalMs: 30000        # milliseconds
```

Raising it means fewer, larger requests. The cost is **tail loss**: events from
the last few seconds of a visit are more likely to be missed if the browser is
closed abruptly, since the flush on hide is best-effort.

A host that supplies your collector may set this for you, and your own value
overrides theirs — so this is mainly for a site pointing at a collector it
chose, where there is no host to set it.

⚠️ **The unit is milliseconds, and the name says so on purpose.** `30` here is
thirty *milliseconds*, not thirty seconds — which would flush about thirty times
a second. A value that is not a positive number is ignored and the default is
used.

### Third-party scripts

If you also use a vendor's own analytics or tag manager, name its script and the
framework loads it:

```yaml
tracking:
  scripts:
    - https://vendor.example.com/tag.js
```

⭐ **This works on every host**, including Uniweb Cloud — the runtime loads the
script, so nothing depends on who builds your pages. That is the practical
difference from pasting the same tag into
[`head.html`](#custom-head-injection), which only applies where the framework
builds them. If you are declaring a vendor's tracking script, this is the place
to put it.

You can add it alongside a `tracking:` endpoint or on its own — the two are
independent:

```yaml
tracking:
  endpoint: /collect          # optional — your own collector
  consent: required           # optional — gates both
  scripts:
    - https://vendor.example.com/tag.js
```

The vendor's script measures its own way, with its own storage, and reports to
the vendor. Nothing is shared or translated between it and the events above.

What the framework guarantees about the load:

- **Once per page load**, as an `async` script in `<head>`.
- **Only after consent**, when `consent: required` is set — the script is not
  merely suppressed, it is never fetched.
- **Never inside an iframe**, so composing a site in an editing preview does not
  register as traffic.
- **Never during prerendering** — loading a script is a browser-only step.

A relative path resolves against the site's `base:`, the same as the endpoint.

Each entry is **a URL, and nothing else** — there is no field for inline script.
Get it from your vendor's own install instructions.

> **Check that install snippet before relying on this.** Some vendors give you a
> single `<script src="…">` and nothing more, which is exactly what this loads.
> Others also run a few inline lines to configure themselves, and those lines
> have nowhere to go here — for that, use
> [`head.html`](#custom-head-injection), noting which hosts apply it.

### What is and isn't stored

> **Nothing is stored on the visitor's device.** No cookie, no local storage —
> the `visit` key lives in memory and is gone on refresh, in a new tab, or
> tomorrow. It identifies **one page load**, not a person: it cannot be linked to
> another visit, another tab, or another site. There is no visitor id, no session
> that spans days, and no fingerprint.

That is a trade, not only a property, and it is worth knowing before you compare
numbers with another tool. Counting **unique people**, **sessions**, returning
visitors or bounce rate all require storing an identifier on the device that
outlives the page — which is how analytics products reporting those numbers get
them. This stores nothing, so it counts page views and events and stops there.

### Consent

`consent: required` holds every event until a visitor answers. Nothing leaves
the browser before then; agreeing sends what was held, declining discards it.

Without it, tracking starts as soon as the page loads. Declaring a destination
is treated as your decision to track — the framework does not assume which laws
apply to your site. The section above states what is and isn't stored, by this
and by the alternatives, so that the decision is yours to make on the facts.

> **A consent banner is an ordinary component.** Because tracking now comes from
> the site itself rather than a third-party script, browser blockers and consent
> tools cannot intercept it — so if you need consent, use this option and a
> component that sets it.

---

## Build Options

Configure the production build.

```yaml
build:
  prerender: true
  splitContent: auto
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `prerender` | `true` | Generate static HTML for all pages (SSG) |
| `splitContent` | `auto` | Split page content into separate files for lazy loading |

When `prerender: true`:
- All pages are rendered to HTML at build time
- JavaScript hydrates for interactivity
- Fast initial load, SEO-friendly
- Pages work without JavaScript

When `prerender: false`:
- Single `index.html` with client-side rendering
- Pages render in the browser
- Smaller initial bundle

### Split Content

By default, all page content is embedded in every HTML file. For small sites this is fine — JSON compresses well. For content-heavy sites (large documentation, university websites), the payload grows to several megabytes, duplicated across every prerendered page.

`splitContent` separates page content into individual files (`_pages/*.json`) that are fetched on demand as the user navigates. Only the current page's content is embedded in each HTML file — other pages load lazily.

| Value | Behavior |
|-------|----------|
| `auto` | Split when total content exceeds 100KB (default) |
| `true` | Always split |
| `false` | Never split — all content inline in every HTML file |

With `auto`, a 5-page marketing site stays bundled (fast, no extra requests), while a 50-page docs site splits automatically.

Once a page's content is loaded, it stays cached for the rest of the session — returning to a visited page is instant with no additional fetch.

When [view transitions](../development/view-transitions.md#interaction-with-split-content) are active, the content fetch is hidden behind the transition animation — the user never sees a loading state.

---

## Global Data Fetching

Load data available to all pages.

```yaml
fetch:
  path: /data/site-config.json
  as: config
```

Every section on every page receives this data automatically in `content.data.config`.

### Options

| Option | Description |
|--------|-------------|
| `path` | Local file in `public/` |
| `url` | Remote URL |
| `schema` | Key in `content.data` |
| `prerender` | Build-time vs runtime fetch |

See [Data Fetching](./data-fetching.md) for the full reference.

---

## Content Collections

Define collections of markdown content that generate JSON data files.

```yaml
queries:
  articles:
    schema: '@/article'
    sort: date desc
    where:
      published: { ne: false }

  team:
    schema: '@/person'
    sort: order asc
```

### Collection Options

| Option | Description |
|--------|-------------|
| `path` | Folder containing markdown files |
| `route` | Base route for the collection's detail pages — see below |
| `sort` | Sort expression (`field asc/desc`) |
| `where` | Filter predicate (where-object) |
| `limit` | Maximum items |
| `excerpt.maxLength` | Auto-excerpt character limit |
| `excerpt.field` | Frontmatter field for excerpt |

Collections generate JSON files in `public/data/`. Use `data: collection-name` in pages to fetch them.

#### `route:` — where a record's detail page lives

Set `route:` when the collection has a detail page behind a dynamic route, and every record gains a `route` field of `<route>/<slug>`:

```yaml
queries:
  articles:
    schema: '@/article'
    route: /blog          # pairs with a pages/blog/[slug]/ dynamic route
```

```jsonc
// public/data/articles.json — each record now carries its own link
[{ "slug": "my-post", "title": "My Post", "route": "/blog/my-post" }]
```

A component links a card with `item.route` rather than composing the URL itself, so the base route is declared once and read everywhere. Without `route:`, compiled records carry no link and a card has nothing to point at.

A trailing slash is normalized away: `route: /blog/` and `route: /blog` both produce `/blog/my-post`.

See [Content Collections](./content-collections.md) for details.

---

## Custom Content Paths

By default, site content is read from standard directories relative to the site root: `pages/`, `layout/`, and `entities/`. You can override these locations using the `paths:` group in `site.yml`:

```yaml
paths:
  pages: ../shared-content/pages
  layout: ../shared-content/layout
  entities: ../shared-content/entities
```

Paths are resolved relative to the site root. Absolute paths are also supported.

### Per-Subfolder Mounting

You can mount individual page subfolders from external locations. This is useful when some pages live in a different repository (e.g., a docs submodule) while the rest are local:

```yaml
paths:
  pages/docs: ../../../docs
```

This makes the external `docs/` directory appear as the `docs` subfolder under `pages/`. The site's own `pages/` directory provides the rest of the pages. Multiple subfolder mounts are supported:

```yaml
paths:
  pages/docs: ../../../docs
  pages/blog: ../../../blog-content
```

#### Giving a mounted route a layout or a title

Add a local folder for the route holding a `folder.yml` — `folder.yml` rather than `page.yml`, because what is mounted is a folder of pages, and that filename is also what tells the build how to read the mounted tree:

```
site/
├── site.yml              # paths: { pages/docs: ../../../docs }
└── pages/
    └── docs/
        └── folder.yml    # layout, title, SEO for the branch
```

```yaml
# pages/docs/folder.yml
title: Documentation
layout: DocsLayout        # cascades to every page under /docs
```

**The two configs layer.** The mounted directory's own `folder.yml` supplies what your stub leaves out — its ordering, its title — and anything the stub declares wins. So a docs repository that orders its own sections keeps that order, and your site only states what it wants to differ.

If the mounted directory is empty — an unfetched git submodule, most often — the build says so rather than quietly producing a route with no pages under it. In a production build it fails outright.

### Use Cases

- **Separate content repo** — Content in a git submodule, maintained by a different team
- **Shared content** — Multiple sites reading from the same pages or collections
- **Existing docs** — Point `pages` at an existing folder of markdown files
- **Mixed sources** — Some pages local, others from external repos via per-subfolder mounting

When `paths.entities` is set, every query reads its records from that pool instead of `entities/` at the site root.

### Editing external content in dev

Every directory reached through `paths:` is watched, mounts included — editing a file in a mounted docs repository rebuilds and reloads exactly as editing a local page does. Nothing to configure. Files that arrive in bulk count too, so fetching a git submodule while the server is running brings its pages in without a restart.

**Changing the paths themselves still needs a restart.** Watchers are set up once, from the `paths:` in effect at startup, so pointing a mount somewhere new — or adding one — takes hold on the next `uniweb dev`.

---

## Custom Head Injection

Place a `head.html` file in your site root to inject HTML into `<head>` on every page. The file contents are inserted verbatim — no processing, no YAML wrapping.

```
site/
├── site.yml
├── theme.yml
├── head.html      ← optional, injected into <head>
├── pages/
└── layout/
```

**Common uses:** analytics and tag managers, error monitoring (Sentry), third-party widgets, custom meta tags, font preconnects.

> **`head.html` applies when the framework builds your pages** — `uniweb export`, or `uniweb deploy --host=<adapter>`. On **Uniweb Cloud** (`uniweb publish`) the pages are generated by the host from your synced content, so `head.html` is **not applied there**. The file is still kept and synced, so nothing is lost — but a script placed in it will not run on that host.

> ⭐ **If what you are adding is a vendor's tracking script and their snippet is a single `<script src="…">`, put the URL in [`tracking.scripts`](#third-party-scripts) instead.** Same script, same vendor, same data — but the runtime loads it, so it works on **every** host rather than only the ones where the framework builds your pages. Reach for `head.html` when the vendor's snippet also runs inline configuration lines, which have nowhere to go in a URL field.

> **And separately, on what to measure with.** A vendor's script sets its own cookies, which is what lets it report sessions and unique users; it counts page loads, so in-app navigation needs its own handling. [`tracking:`](#tracking) loads no script and stores nothing on the visitor's device, reports every route change, and sends to an endpoint you provide — so it counts page views and events but not users or sessions. Different numbers, not better ones; many sites run both.

> For social/SEO meta (Open Graph image, title, description, canonical, robots), use the structured [`seo:` block](#seo--social-sharing) instead — the runtime renders those into every page's `<head>`. Reserve `head.html` for everything else.

### Example: Google Analytics

```html
<!-- site/head.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Replace `G-XXXXXXXXXX` with your Measurement ID from Google Analytics.

### How it works

- The build reads `head.html` and injects it before all other head content (theme CSS, SEO tags, site data).
- In dev mode, changes to `head.html` trigger a page reload automatically.
- In production, the content is baked into every pre-rendered HTML file.
- If the file doesn't exist, nothing is injected — there's no error.

**Note:** For Google Fonts, you don't need to add preconnect links manually. When your `theme.yml` includes font imports, the build injects `<link rel="preconnect">` tags automatically. See [Site Theming → Typography](./site-theming.md#typography).

---

## Complete Example

```yaml
# site.yml

# Identity
name: Acme Corp
description: Building the future of widgets

# Structure
pages: [home, products, about, ..., contact]

# Languages
defaultLanguage: en
languages:
  - code: en
    label: English
  - code: es
    label: Español

# Features
search:
  enabled: true

# Build
build:
  prerender: true

# Global data
fetch:
  path: /data/site-config.json
  as: config

# Collections
queries:
  articles:
    schema: '@/article'
    sort: date desc

  products:
    schema: '@/product'
    sort: name asc
```

---

## See Also

- [Page Configuration](./page-configuration.md) — page.yml reference
- [Content Collections](./content-collections.md) — Markdown-based data
- [Data Fetching](./data-fetching.md) — Loading external data
- [Site Search](../authoring/search.md) — Full-text search setup
- [Internationalization](../development/internationalization.md) — Multi-language support
