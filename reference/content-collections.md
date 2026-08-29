# Content Records

Author content in markdown, YAML, or JSON and automatically generate data files. Records let you maintain blog posts, team members, schedules, or any structured data as individual files in `entities/` — `.md` for rich content with body text, `.yml`/`.yaml` for pure structural data, `.json` for existing JSON data or API responses.

## The Data Layer

Three files answer three separate questions, and keeping them apart is the whole design:

| | question | answer |
|---|---|---|
| `entities/{schema}/` | what does this site **have**? | one file per entity; the folder names its data schema |
| `records.yml` | what is **published**? | a list — listing an entity makes it a record |
| `queries.yml` | how is it **reached**? | named queries; a page asks one by name |

The build converts what a query returns to JSON in `public/data/`, which is an output directory — you don't need to interact with it directly.

There are two ways to provide data to components:

**Records** (`entities/` + `records.yml`) — Author content as `.md`, `.yml`, or `.json` files. The build converts them to JSON. Markdown records get ProseMirror content bodies, excerpts, and co-located assets automatically. YAML and JSON records pass through as-is. Use `.md` for content with body text (blog posts, case studies), `.yml` or `.json` for purely structural data (schedules, pricing tiers).

**Runtime data** (API fetch) — For production sites where a CMS or backend manages content and serves pre-localized data. Components receive it the same way as static data (via `content.data`).

**Rule of thumb:** If authors maintain the content, use records in `entities/`. If it comes from an external system at request time, use runtime fetch.

> **Don't write to `public/data/`.** It is the build's output directory. A file you put there is overwritten without warning as soon as a query takes the same name, and it gets none of what a record provides — no i18n extraction, no schema validation, no per-record files, no editor support. Data exported from another tool belongs in `entities/` as well: a `.json` or `.yml` file containing a top-level array becomes one record per entry.

---

## Overview

Records separate **content authoring** from **page structure**:

- **Pages** (in `pages/`) define what components render where
- **Entities** (in `entities/`) are the site's stored things, one file each
- **`records.yml`** decides which of them are published
- **`queries.yml`** names the queries pages ask for
- At build time, each query's result becomes a JSON file in `public/data/`
- Pages reference a query using `data: query-name`

This keeps content portable and component-independent.

---

## Quick Start

### 1. Put entities in a schema folder

The folder names the data schema — `entities/article/` is `@/article`, your
foundation's own; `entities/std/person/` is `@std/person`.

```
site/
└── entities/
    └── article/
        ├── getting-started.md
        ├── design-patterns.md
        └── advanced-features.md
```

### 2. Write content with frontmatter

```markdown
---
title: Getting Started with Uniweb
date: 2025-01-15
author: Sarah Chen
tags: [tutorial, beginner]
---

Learn how to build your first site with Uniweb.

## Installation

First, create a new project...
```

### 3. Publish them in `records.yml`

Listing an entity is what makes it a **record**. Leave one out and it stays a
draft — it exists, but nothing can reach it.

```yaml
# records.yml
- article/*.md
```

### 4. Declare a query in `queries.yml`

A query names a schema; the published records of that schema are its rows.

```yaml
# queries.yml
articles:
  schema: '@/article'
  sort: date desc
```

### 5. Use in pages

```yaml
# pages/blog/page.yml
title: Blog
data: articles
```

The build generates `public/data/articles.json` from the query's result, and `data: articles` makes it available to your components.

For more control, use the full fetch syntax: `fetch: /data/articles.json` or `fetch: { query: articles, limit: 10 }`.

---

## Query Configuration

### `queries.yml` syntax

`queries.yml` is a **bare map** — name → query, with no root key. The same
declarations can live under `queries:` in `site.yml` instead, if you prefer one
file; `queries.yml` wins per key when both are present.

```yaml
# Simple form — the query name IS the schema name
articles:

# Naming a different schema
recent:
  schema: '@/article'

# Extended form
articles:
  schema: '@/article'
  sort: date desc           # Field + direction
  where:
    published: { ne: false }
  limit: 100                # Max records (0 = unlimited)
  excerpt:
    maxLength: 160          # Auto-excerpt character limit
    field: description      # Use this frontmatter field if present
```

> **A query names no path.** `entities/{schema}/` is the pool and `schema:`
> addresses it, so there is no directory for a query to point at. `path:`/`url:`
> mean something only for a **remote** source, whose address nothing local can
> derive.

### Several queries

```yaml
articles:
  schema: '@/article'
  sort: date desc

products:
  schema: '@/product'
  sort: price asc

team:
  schema: '@/person'
  sort: order asc
```

Each query generates its own JSON file: `/data/articles.json`, `/data/products.json`, `/data/team.json`. **More than one query may cover the same schema** — that is the usual way to show one set of records two ways.

---

## Mapping a schema, and organizing the folder

### Where a schema comes from

**The path names it.** `entities/article/` is `@/article` — your foundation's own
`schemas/article`; `entities/std/person/` is `@std/person`, a bundled standard
schema; `entities/acme/project/` is `@acme/project`. A query then names the same
ref, or leaves `schema:` out when its own name already matches.

A data schema gives records a typed shape, used for validation and i18n
extraction.

> **The pool folder used to be the collection name, and the schema was config.**
> That is why `schema:` existed on a declaration at all: the directory could not
> carry a scoped ref. It can now, so a query naming `@std/person` and a folder at
> `entities/std/person/` say the same thing once.

**Lean lists come from the schema.** If a schema marks a section `brief: true`,
that section *is* the list shape — the card, the row, the summary. Every other
field is loaded only when one record is the focus: the list payload carries the
brief fields, and the full record is fetched on demand (automatically on a
`[slug]` page, or via `useEntityDetail` elsewhere).

You don't configure this. Declaring `deferred:` by hand still works and takes
precedence, but with a schema you rarely need it — the brief already says what a
summary is, and saying it twice invites the two to disagree.

### Organizing the folder — for querying, not for browsing

`records.yml` can group records into folders. **They exist so a query can ask for
a slice**, not to build a navigation tree, and most sites need none:

```yaml
# records.yml
- article/*.md                  # the pool, flat — path: ""

- folder: archive
  label: The Archive            # only a folder takes a label; a record has its own title
  records:
    - article/2019-*.md         # path: "archive"
```

Each record carries the `path` of the folder it sits in, and a query slices on it
with `where: { path: { under: 'archive' } }`. The organization is yours to choose:
it does **not** mirror the `entities/` layout, which names schemas and nothing
else.

⛔ **A record belongs to one folder.** Listing the same file twice is an error, and
the build names both entries. A computed subset — "this year", "the five most
recent" — is a **query**, not a second placement.

---

## Content Item Fields

Each `.md` file in `entities/` becomes a JSON object with the following fields. For `.yml`/`.yaml` and `.json` files, see [Data Items (YAML)](#data-items-yaml) and [Data Items (JSON)](#data-items-json) — they produce only `slug` plus whatever fields you declare.

| Field | Source | Notes |
|-------|--------|-------|
| `slug` | Filename | `getting-started.md` → `"getting-started"` |
| `path` | `records.yml` | The folder the record is PLACED in — `""` at the root, `"archive"` inside a `folder: archive`. Query it with [`under`](../authoring/predicates.md) |
| `title` | Frontmatter | Typically required |
| `date` | Frontmatter | ISO date string |
| `author` | Frontmatter | String or object |
| `tags` | Frontmatter | Array of strings |
| `published` | Frontmatter | Boolean (default: `true`) |
| `image` | Frontmatter or auto | First image in content if not specified |
| `excerpt` | Frontmatter or auto | First ~160 chars if not specified |
| `content` | Parsed body | ProseMirror JSON structure |
| `lastModified` | File system | ISO timestamp |
| *custom* | Frontmatter | All other fields pass through |

### Example generated JSON

```json
[
  {
    "slug": "getting-started",
    "title": "Getting Started with Uniweb",
    "date": "2025-01-15",
    "author": "Sarah Chen",
    "tags": ["tutorial", "beginner"],
    "published": true,
    "excerpt": "Learn how to build your first site...",
    "content": { "type": "doc", "content": [...] },
    "lastModified": "2025-01-15T10:30:00.000Z"
  }
]
```

---

## Data Items (YAML)

For records that are pure structural data — no body text, no excerpts, no images — use `.yml` or `.yaml` files instead of markdown. The file extension signals intent:

| File type | What it means | Output |
|-----------|---------------|--------|
| `.md` | Content item (article-like) | slug + frontmatter + body + content + excerpt + image + lastModified |
| `.yml`/`.yaml` | Data item (structural) | slug + YAML fields only |
| `.json` | Data item or multi-item file | Object → slug + JSON fields. Array → all items directly |

A YAML item skips ProseMirror conversion, body extraction, excerpt generation, image detection, and file stat — its output is just `slug` plus the fields you declare.

### Example: Conference schedule

```
site/
└── entities/
    └── schedule/
        ├── keynote.yml
        ├── workshop-react.yml
        └── panel-ai.yml
```

```yaml
# entities/schedule/keynote.yml
title: Opening Keynote
speaker: Ada Lovelace
time: "09:00"
room: Main Hall
track: general
```

Generated JSON:

```json
[
  {
    "slug": "keynote",
    "title": "Opening Keynote",
    "speaker": "Ada Lovelace",
    "time": "09:00",
    "room": "Main Hall",
    "track": "general"
  }
]
```

No `body`, `content`, `excerpt`, `image`, or `lastModified` — just the data you declared.

### Mixing file types

A single schema folder can contain `.md`, `.yml`, and `.json` files together. This is useful when some items need rich body content and others are purely structural:

```
site/
└── entities/
    └── team/
        ├── alice.md       # Has a bio (rich content)
        ├── bob.md         # Has a bio
        └── vacant.yml     # Open position — just metadata
```

Filtering, sorting, and limiting work identically across both file types.

### `published: false`

Just like markdown items, YAML items with `published: false` are excluded from the output:

```yaml
# Excluded from generated JSON
published: false
title: Coming Soon
```

---

## Data Items (JSON)

For existing JSON data — API responses, exports from other tools, or data you already have in JSON format — place `.json` files in the schema folder. JSON records work like YAML records: pure data, no ProseMirror conversion.

### Single-item files

A `.json` file containing an object is treated as a single item. The slug comes from the filename:

```json
// entities/person/alice.json
{
  "name": "Alice",
  "role": "Engineer",
  "avatar": "/images/alice.jpg"
}
```

Output: `{ "slug": "alice", "name": "Alice", "role": "Engineer", ... }`

### Multi-item files

A `.json` file containing an array contributes all items directly — useful for importing existing datasets or API responses:

```json
// entities/product/catalog.json
[
  { "slug": "widget-a", "name": "Widget A", "price": 29 },
  { "slug": "widget-b", "name": "Widget B", "price": 49 }
]
```

Both records are added. Array entries should include their own `slug` field, since there is no filename to infer one from.

### `published: false`

Single-item JSON files with `published: false` are excluded, just like YAML items. For array entries, filtering is not applied per-entry — use the query's `where:` instead.

---

## Filtering

Filter items with a `where:` predicate — a structured object whose keys are field names. Bare values match by equality; operators nest as objects:

```yaml
queries:
  articles:
    schema: '@/article'
    where:
      published: { ne: false }
```

Common shapes:

| Goal | `where:` |
|---|---|
| Only published | `{ published: { ne: false } }` |
| After a date | `{ date: { gt: '2025-01-01' } }` |
| Tagged "featured" | `{ tags: featured }` |
| In a category | `{ category: tutorial }` |

Operators: `eq` `ne` `gt` `gte` `lt` `lte` `in` `nin` `like` `exists`. Compose with `and:` / `or:` / `not:`. Full reference and the saved-views pattern: [Predicates](../authoring/predicates.md).

---

## Sorting

Sort by one or more fields:

```yaml
queries:
  articles:
    schema: '@/article'
    sort: date desc         # Newest first

  products:
    schema: '@/product'
    sort: price asc         # Cheapest first

  team:
    schema: '@/person'
    sort: order asc, name asc  # By order, then alphabetically
```

### Sort direction

- `asc` — Ascending (A-Z, 1-9, oldest first)
- `desc` — Descending (Z-A, 9-1, newest first)

---

## Limiting

Limit the number of items in the output:

```yaml
queries:
  # Latest 10 articles only
  articles:
    schema: '@/article'
    sort: date desc
    limit: 10
```

Use `limit: 0` (or omit) for no limit.

---

## Unpublished Content

Items with `published: false` in frontmatter are excluded from the generated JSON:

```markdown
---
title: Draft Post
published: false
---

This won't appear in the output.
```

By default, items without a `published` field are included (treated as `published: true`).

---

## Excerpts

Excerpts are automatically generated from content:

```yaml
queries:
  articles:
    schema: '@/article'
    excerpt:
      maxLength: 200        # Character limit (default: 160)
      field: description    # Prefer this frontmatter field
```

### Excerpt precedence

1. Explicit `excerpt` in frontmatter
2. `field` specified in config (e.g., `description`)
3. Auto-extracted from content body

### Auto-extraction

The first ~160 characters of plain text are extracted, truncated at a word boundary with `...` appended.

---

## Images

The `image` field is populated from:

1. Explicit `image` in frontmatter
2. First image found in the markdown content

```markdown
---
title: My Post
image: /images/hero.jpg  # Explicit
---

Or automatically extracted from:

![Hero](images/auto-detected.jpg)
```

---

## Co-located Assets

A record can reference assets stored alongside its markdown file using relative paths. This keeps related content together and makes it easy to manage.

### Directory Structure

```
site/
└── entities/
    └── articles/
        ├── getting-started.md
        ├── getting-started-diagram.svg    # Co-located with article
        ├── design-patterns.md
        └── design-patterns-architecture.png
```

### Referencing Co-located Assets

Use `./` to reference files in the same folder:

```markdown
---
title: Getting Started
---

Here's how the architecture works:

![Architecture Diagram](./getting-started-diagram.svg)

The system consists of three main parts...
```

### Build Processing

At build time, the record processor:

1. **Detects relative paths** — Any `./` or `../` path in the content
2. **Copies assets** — Files are copied to `public/collections/<query>/`
3. **Updates paths** — References become site-root-relative (`/entities/article/diagram.svg`)

This means your content stays portable—move an article and its assets together, and everything still works.

### Supported Asset Types

Co-located assets work for all media types:

```markdown
<!-- Images -->
![Diagram](./architecture.svg)
![Photo](./team-photo.jpg)

<!-- Videos -->
![Demo](./demo.mp4){role=video poster=./demo-poster.jpg}

<!-- Documents -->
![Download](./whitepaper.pdf){role=pdf preview=./whitepaper-preview.png}
```

### Path Resolution

| Path Format | Resolution |
|-------------|------------|
| `./file.jpg` | Same folder as the markdown file |
| `../shared/logo.svg` | Parent folder |
| `/images/hero.jpg` | Site's `public/` folder (unchanged) |
| `https://...` | External URL (unchanged) |

### Output Location

Co-located assets are copied to `public/collections/<query-name>/`:

```
public/
└── entities/
    └── articles/
        ├── getting-started-diagram.svg
        └── design-patterns-architecture.png
```

The JSON output references these processed paths:

```json
{
  "slug": "getting-started",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "image",
        "attrs": {
          "src": "/entities/article/getting-started-diagram.svg",
          "alt": "Architecture Diagram"
        }
      }
    ]
  }
}
```

---

## Complete Example: Blog

### Directory structure

```
site/
├── site.yml
├── records.yml            # what is published
├── queries.yml            # how it is reached
├── entities/              # the pool — the folder names the data schema
│   └── article/
│       ├── getting-started.md
│       ├── design-patterns.md
│       └── advanced-features.md
├── pages/
│   └── blog/
│       ├── page.yml
│       ├── list.md
│       └── [slug]/
│           ├── page.yml
│           └── article.md
└── public/
    └── data/
        └── articles.json  # Auto-generated, one per query
```

### records.yml

```yaml
- article/*.md
```

### queries.yml

```yaml
articles:
  schema: '@/article'
  sort: date desc
```

### entities/article/getting-started.md

```markdown
---
title: Getting Started with Uniweb
date: 2025-01-15
author: Sarah Chen
tags: [tutorial, beginner]
---

Learn how to build your first site with Uniweb.

## Installation

First, create a new project:

\`\`\`bash
uniweb create my-site
\`\`\`

## Configuration

Edit `site.yml` to set your site name...
```

### pages/blog/page.yml

```yaml
title: Blog
data: articles
```

### Using with Dynamic Routes

Combine a query with [dynamic routes](./dynamic-routes.md) for individual article pages:

```yaml
# pages/blog/[slug]/page.yml
title: Article
```

The parent's fetched data (`articles`) cascades to the dynamic route. Each generated page (`/blog/getting-started`, `/blog/design-patterns`, etc.) receives the matched record under the query key as a single-element array — the detail section reads `content.data.articles[0]`.

See [Dynamic Routes](./dynamic-routes.md) for details.

### Referencing a Query in Other Pages

Use the `data:` shorthand to fetch a query's records anywhere in your site:

```yaml
# pages/home/teaser.md
---
type: ArticleTeaser
data: articles
---

# Latest from the Blog
```

This fetches from `/data/articles.json` and makes it available as `content.data.articles`.

For more control (filtering, sorting, limiting), use the full `fetch:` syntax:

```yaml
# pages/home/teaser.md
---
type: ArticleTeaser
fetch:
  query: articles   # Fetches from /data/articles.json
  limit: 3               # Only 3 articles
  sort: date desc        # Most recent first
---

# Latest from the Blog
```

See [Data Fetching](./data-fetching.md#collection-references) for details.

---

## Dev Mode

During development (`pnpm dev`):

- `entities/` is watched for changes
- `/data/*.json` regenerates automatically when a record is added, edited, or removed
- The browser reloads and the change appears — no dev-server restart needed. In dev the runtime fetches local records live, exactly like a remote data source, so what you see matches production behavior

---

## Build Output

During production build (`pnpm build`):

1. Records are processed before the Vite build
2. JSON files are written to `public/data/`
3. They're included in the final `dist/` output

---

## Edge Cases

| Situation | Behavior |
|-----------|----------|
| Missing schema folder | Warning logged, empty array generated |
| Query matching no records | Warning logged, empty array `[]` generated |
| Invalid frontmatter (`.md`) | Error with filename, file skipped |
| Invalid YAML (`.yml`) | Error with filename, file skipped |
| Invalid JSON (`.json`) | Error with filename, file skipped |
| Unpublished items | Excluded from output (`.md`, `.yml`, and single-object `.json`) |
| No date field with date sort | Items sorted by filename |
| Mixed `.md`, `.yml`, and `.json` files | All processed; same filtering/sorting/limiting applies |
| Nested folders | Not supported (flat structure only) |

---

## i18n for JSON Data

The i18n extraction pipeline identifies translatable strings in record data using one of two strategies:

### Schema-guided extraction

Provide a companion schema file beside the schema folder it describes. The schema tells the extractor exactly which fields contain translatable text:

```
entities/
├── events/
│   └── events.json
└── events.schema.js    # Companion schema, named for the schema folder
```

```js
// events.schema.js
export default {
  name: 'event',
  fields: {
    title: { type: 'string' },                    // Extracted (string → translatable by default)
    description: { type: 'markdown' },             // Extracted (markdown → always translatable)
    slug: { type: 'string', translatable: false },  // Skipped (explicit opt-out)
    type: { type: 'string', enum: ['workshop', 'talk'] },  // Skipped (enum → not translatable)
    startDate: { type: 'datetime' },               // Skipped (datetime → never translatable)
    location: {
      type: 'object',
      fields: {
        name: { type: 'string' },                  // Extracted (nested string)
        url: { type: 'url' },                      // Skipped (url → never translatable)
      }
    },
    tags: {
      type: 'array',
      items: { type: 'string' }                    // Extracted (array of strings)
    },
  }
}
```

**Type-based defaults:**

| Type | Default | Override with |
|------|---------|--------------|
| `string` | translatable | `translatable: false` to skip |
| `string` + `enum` | NOT translatable | `translatable: true` to include |
| `markdown` | always translatable | — |
| `number`, `boolean`, `date`, `datetime` | never | — |
| `url`, `email`, `image` | never | — |
| `object` | recurse into `fields` | — |
| `array` | recurse into `items` | — |

**Schema discovery order:**

1. Companion file: `entities/<name>.schema.js`
2. Standard schema: matching name in `@uniweb/schemas` (with automatic singularization — `events` matches the `event` schema)
3. No schema found → heuristic fallback

### Heuristic extraction (no schema)

When no schema is found, the extractor recursively walks the JSON data and extracts all strings that look like human-readable text. It skips:

- **Structural field names** — `slug`, `id`, `type`, `status`, `href`, `url`, `email`, `icon`, `target`, dates, etc.
- **Structural string patterns** — URLs, email addresses, ISO dates, hex colors, file paths, currency codes, plain numbers

This works well for most data but may occasionally include strings you don't want translated (or miss strings you do). For precise control, provide a companion schema.

### Item identification

Records are identified by `slug`, `id`, or `name` (checked in that order). If none is found, the record is labeled `unknown` in the manifest. Make sure your JSON records have at least one of these fields for clear translation context.

---

## See Also

- [Dynamic Routes](./dynamic-routes.md) — Generate pages from a query's records
- [Data Fetching](./data-fetching.md) — The `data:` shorthand and advanced `fetch:` syntax
- [Content Structure](./content-structure.md) — How markdown content is parsed
