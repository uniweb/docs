# Records

Blog posts, team members, schedules, references — any repeating structured content — are **records**: one file each in `records/`, reached by a query. `.md` holds rich content with body text, `.yml`/`.yaml` pure structured data, `.json` data exported from another tool, and `.bib` bibliographic references.

This page covers the records themselves: where they live, how they are organized, and what a compiled record holds. What a query can say about them is [Queries](./queries.md); how a page names a query is [Data Fetching](./data-fetching.md).

## The Data Layer

Three files answer three separate questions, and keeping them apart is the whole design:

| | question | answer |
|---|---|---|
| `records/{schema}/` | what does this site **have**? | one file per record; the folder names its data schema |
| `records.yml` | how is it **organized**? | optional — folders a query can read one of |
| `queries.yml` | how is it **reached**? | named queries; a page names one |

A page names a query, never a file. A site with no backend reads the file a build generates from the query in `public/data/`; the same site published to a host that serves records live reads them from there, with nothing in the page changed.

There are two ways to provide data to components:

**Records** (`records/`) — author content as files. Markdown records get ProseMirror content bodies, excerpts, and co-located assets automatically; YAML and JSON records pass through as they are. Use `.md` for content with body text (blog posts, case studies), `.yml` or `.json` for purely structured data (schedules, pricing tiers).

**External queries** (`url:` in `queries.yml`) — for records another system holds and serves as public JSON. Components receive them the same way, through `content.data`. See [Queries → External queries](./queries.md#external-queries).

**Rule of thumb:** if authors maintain the content, use records in `records/`. If it comes from an external system at request time, use an external query.

> **Don't write to `public/data/`.** It is the build's output directory. A file you put there is overwritten without warning as soon as a query takes the same name, and it gets none of what a record provides — no i18n extraction, no schema validation, no per-record files, no editor support. Data exported from another tool belongs in `records/` as well: a `.json` or `.yml` file containing a top-level array becomes one record per entry.

---

## Quick Start

### 1. Put records in a schema folder

Every file in `records/` is a record. The folder names the data schema —
`records/article/` is `@/article`, your foundation's own; `records/std/article/`
is `@std/article`, a shared standard.

```
site/
└── records/
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

### 3. Declare a query in `queries.yml`

```yaml
# queries.yml
articles:
  schema: '@/article'
  sort: date desc
```

### 4. Name the query on a page

```yaml
# pages/blog/page.yml
title: Blog
query: articles
```

The query's records reach the page's sections whose component declares `articles`. On a site with no backend, the build generates `public/data/articles.json` from the query, and that is what the page reads. To show fewer — `fetch: { query: articles, limit: 3 }` — see [Data Fetching → Narrowing a query](./data-fetching.md#narrowing-a-query).

---

## The `records/` Folder

Every file in `records/` is a record — putting it there is what makes it one. **The folder it sits in names its data schema:**

| on disk | schema |
|---|---|
| `records/article/getting-started.md` | `@/article` — the foundation's own |
| `records/std/person/alice.yml` | `@std/person` — the shared standard set |
| `records/acme/project/cinder.json` | `@acme/project` — an organization's |

A file whose name starts with `_` is not a record, and neither is anything in a folder whose name does — a place for work in progress. `site.yml` can move the folder: `paths: { records: ../shared/records }`.

Keep schema folders flat. A folder two levels deep names an organization's schema, so `records/article/2025/design-tips.md` is read as the `2025` schema of an `article` organization — outside every `@/article` query. Files three or more levels deep are skipped, with a warning. To group records, place them in [folders](#folders) in `records.yml` instead.

A data schema gives records a typed shape, used for validation, field defaults and i18n extraction. When a query's schema marks a section `brief: true`, lists of that query leave the other fields out — see [Queries → `deferred`](./queries.md#deferred--fields-a-list-leaves-out).

---

## Folders: `records.yml`

`records.yml` is optional. **Folders exist so a query can read a branch**, not to build a navigation tree, and most sites need none. Every record sits at the top of the site's records folder unless `records.yml` places it in one:

```yaml
# records.yml
- folder: archive
  label: The Archive            # only a folder takes a label; a record has its own title
  records:
    - article/2019-*.md         # path: "archive"
```

A path under a folder is relative to `records/`, naming one file or matching many; `*` matches within one folder. Each record carries the `path` of the folder it sits in — `""` at the top — and a query reads one branch with [`scope: archive`](./queries.md#scope--a-branch-of-the-folder). The organization is yours to choose: it does **not** mirror the `records/` layout, which names schemas and nothing else. Under a [`[...path]`](./dynamic-routes.md#multi-segment-routes--path) parametric page, a record's folder becomes part of its URL.

**A record sits in one folder.** Placing the same file twice is an error, and the build names both entries. A computed subset — "this year", "the five most recent" — is a **query**, not a second placement.

`records.yml` never lists records at the top level — every file in `records/` is a record already — so a path there is reported as an error. A `records.yml` the build cannot read as a list — invalid YAML, or a mapping — stops the build.

### With a backend

`uniweb push` sends the site's records, and the backend holds them in the site's folder:

| | on a build (`uniweb build`, `pnpm dev`) | on `uniweb push` |
|---|---|---|
| no `records/` folder | no records | the backend's records are left as they are |
| a `records/` folder | every record in it | every record in it is sent |
| an empty `records/` folder | no records | the backend's records are removed — the CLI asks first |

Records pushed to a backend are served once the site is published.
---

## File Formats

| File type | What it is | A compiled record holds |
|-----------|---------------|--------|
| `.md` | a content record (article-like) | `slug`, the frontmatter fields, `content`, `excerpt`, `image` |
| `.yml`/`.yaml` | a data record | `slug` and the fields you write |
| `.json` | a data record, or many | an object: `slug` and its fields. An array: each entry, as written |
| `.bib` | bibliographic references | one record per `@entry`, its cite key as `slug` |

Every record also carries `path`, its folder in `records.yml`, and `$name`, its handle. A single schema folder can hold all of them: some team members with a markdown bio, others as plain YAML.

### Markdown

The frontmatter holds the fields, and the body becomes the record's `content`:

```markdown
---
title: Getting Started with Uniweb
date: 2025-01-15
author: Sarah Chen
tags: [tutorial, beginner]
---

Learn how to build your first site with Uniweb.
```

### YAML

For records that are pure structured data — no body text, no excerpts, no images:

```yaml
# records/schedule/keynote.yml
title: Opening Keynote
speaker: Ada Lovelace
time: "09:00"
room: Main Hall
track: general
```

A YAML record skips ProseMirror conversion, excerpt generation and image detection: it compiles to `slug`, `path`, `$name` and the fields you wrote.

### JSON

A `.json` file holding an object is one record, its `slug` taken from the filename:

```json
// records/person/alice.json
{
  "name": "Alice",
  "role": "Engineer",
  "avatar": "/images/alice.jpg"
}
```

A `.json` file holding an array contributes each entry as a record — useful for importing an existing dataset. Array entries should carry their own `slug`, since there is no filename to infer one from:

```json
// records/product/catalog.json
[
  { "slug": "widget-a", "name": "Widget A", "price": 29 },
  { "slug": "widget-b", "name": "Widget B", "price": 49 }
]
```

### `published: false`

A markdown, YAML or single-object JSON record with `published: false` is left out of every query the build compiles. A record without the field is included. Entries of a JSON array are not filtered this way — use the query's `where:`.

---

## What a Compiled Record Holds

| Field | Source | Notes |
|-------|--------|-------|
| `slug` | Filename | `getting-started.md` → `"getting-started"`; a `slug:` field overrides it |
| `$name` | `slug` | The record's handle — the same value as its final `slug`. A `[slug]` or `[...path]` page matches it, on every site |
| `path` | `records.yml` | The folder the record is placed in — `""` at the root, `"archive"` inside a `folder: archive`. A query reads a branch with [`scope:`](./queries.md#scope--a-branch-of-the-folder) |
| `content` | Markdown body | ProseMirror JSON |
| `excerpt` | Frontmatter or body | Markdown records — see [Excerpts](#excerpts) |
| `image` | Frontmatter or body | Markdown records — see [Images](#images) |
| *your fields* | Frontmatter / file | Everything you write passes through: `title`, `date`, `author`, `tags`, … |

Once a query delivers a record to a component, it also carries `$route`, the URL of the page that shows it — see [Parametric Pages → Linking to a record](./dynamic-routes.md#linking-to-a-record).

### Example

```json
[
  {
    "slug": "getting-started",
    "title": "Getting Started with Uniweb",
    "date": "2025-01-15",
    "author": "Sarah Chen",
    "tags": ["tutorial", "beginner"],
    "excerpt": "Learn how to build your first site with Uniweb.",
    "content": { "type": "doc", "content": [...] },
    "path": "",
    "$name": "getting-started"
  }
]
```

---

## Excerpts

A markdown record's `excerpt` is the first of these that exists, cut to 160 characters by default:

1. the record's own `excerpt:` field;
2. the frontmatter field the query's `excerpt.field` names, such as `description`;
3. the body's plain text, cut at a word boundary with `...`.

The query sets the length and the field — see [Queries → `excerpt`](./queries.md#excerpt--a-records-summary).

## Images

A markdown record's `image` is its `image:` field, or else the first image in its body:

```markdown
---
title: My Post
image: /images/hero.jpg  # explicit, from the site's public/ folder
---

Or automatically extracted from:

![Hero](./auto-detected.jpg)
```

---

## Co-located Assets

A record can reference files stored beside it, with a relative path — the record and its images move together.

```
site/
└── records/
    └── article/
        ├── getting-started.md
        ├── getting-started-diagram.svg
        ├── design-patterns.md
        └── design-patterns-architecture.png
```

```markdown
---
title: Getting Started
---

Here's how the architecture works:

![Architecture Diagram](./getting-started-diagram.svg)
```

At build time a `./` or `../` path in a markdown record's body or frontmatter — or in a YAML or JSON record's field — is copied to `public/records/`, at its path under `records/`, and rewritten to that URL:

```
public/
└── records/
    └── article/
        ├── getting-started-diagram.svg
        └── design-patterns-architecture.png
```

```json
{
  "slug": "getting-started",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "image",
        "attrs": {
          "src": "/records/article/getting-started-diagram.svg",
          "alt": "Architecture Diagram"
        }
      }
    ]
  }
}
```

A file keeps its place under `records/`: beside its record it is `/records/article/pic.png`, in a subfolder `/records/article/img/pic.png`, and a `../shared/logo.svg` elsewhere in `records/` is `/records/shared/logo.svg` — so two files that share a name never collide, and a record reachable by two queries has one copy at one URL. A file outside `records/` is copied to `/records/_external/`, with a short hash of its path in front of its name.

| Path | Resolution |
|-------------|------------|
| `./file.jpg` | The record's folder |
| `../shared/logo.svg` | Relative to the record's folder |
| `/images/hero.jpg` | The site's `public/` folder |
| `https://...` | External URL (unchanged) |

Co-located assets work for any media — images, `{role=video}` videos, `{role=pdf}` documents.

---

## Complete Example: Blog

```
site/
├── queries.yml            # how it is reached
├── records/               # every file is a record — the folder names the data schema
│   └── article/
│       ├── getting-started.md
│       ├── design-patterns.md
│       └── advanced-features.md
└── pages/
    └── blog/
        ├── page.yml       # query: articles
        ├── 1-list.md      # type: ArticleList
        └── [slug]/
            └── 1-article.md  # type: Article
```

```yaml
# queries.yml
articles:
  schema: '@/article'
  sort: date desc
```

```yaml
# pages/blog/page.yml
title: Blog
query: articles
```

The `[slug]` folder is a [parametric page](./dynamic-routes.md): it takes its parent's query, and each record gets a page — `/blog/getting-started`, `/blog/design-patterns`. Its sections receive the record the URL names as a list of one, `content.data.articles[0]`. Any other page can show a few of the same records — `fetch: { query: articles, limit: 3 }` — each linking to its page through `$route`.

---

## Development and Build

During development (`pnpm dev`):

- `records/` is watched: a record added, edited or removed regenerates the query files, and the page reloads.
- The runtime fetches local records live, as it would from a host, so what you see matches production.
- `site.yml`, `queries.yml` and `records.yml` are watched too: an edit regenerates the query files and reloads, including a `records.yml` created while the server runs.

During a production build (`pnpm build`), each query compiles to `public/data/<query>.json` before the Vite build, and the files are included in `dist/`.

---

## Edge Cases

| Situation | Behavior |
|-----------|----------|
| A query's schema folder is missing | Warning logged, the query has no records |
| A query matching no records | Warning logged, the query answers `[]` |
| Invalid frontmatter, YAML or JSON | Error naming the file, the file skipped |
| A `records.yml` that is not a list | The build stops, naming the problem |
| A record with `published: false` | Left out (`.md`, `.yml`, and single-object `.json`) |
| Sorting by a field some records lack | Those records sort last, in either direction |
| A folder two levels deep in `records/` | Names an organization's schema |
| A path at the top level of `records.yml` | Reported as an error; every record in `records/` is one already |
| A folder three or more levels deep | Skipped, with a warning |

---

## Translating Record Data

Record text is extracted for translation alongside page content (see [Internationalization](../development/internationalization.md#records-i18n)), using one of two strategies to find translatable strings.

### Schema-guided extraction

Provide a companion schema file in `records/`, named for the query whose records it describes. It tells the extractor exactly which fields contain translatable text:

```
records/
├── events/
│   └── events.json
└── events.schema.js    # for the `events` query
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

1. Companion file: `records/<query name>.schema.js`
2. Standard schema: a matching name in `@uniweb/schemas` (with simple singularization — `events` matches the `event` schema)
3. No schema found → heuristic fallback

### Heuristic extraction (no schema)

When no schema is found, the extractor walks the record data and extracts every string that looks like human-readable text. It skips:

- **Structural field names** — `slug`, `id`, `type`, `status`, `href`, `url`, `email`, `icon`, `target`, dates, etc.
- **Structural string patterns** — URLs, email addresses, ISO dates, hex colors, file paths, currency codes, plain numbers

This works well for most data but may occasionally include strings you don't want translated (or miss strings you do). For precise control, provide a companion schema.

### Record identification

Records are identified by `slug`, `id`, or `name` (checked in that order). If none is found, the record is labeled `unknown` in the manifest. Make sure your records have at least one of these fields for clear translation context.

---

## See Also

- [Queries](./queries.md) — which records a query selects: `schema`, `scope`, `where`, `sort`, `limit`, `deferred`
- [Data Fetching](./data-fetching.md) — naming a query from a page or section
- [Parametric Pages](./dynamic-routes.md) — one page per record
- [Working with Records](../authoring/collections.md) — the author's guide to records and queries
- [Entity Content Structure](./entity-content.md) — how a record of a multi-section schema is written
- [Content Structure](./content-structure.md) — how markdown content is parsed
