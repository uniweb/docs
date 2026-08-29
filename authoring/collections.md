# Working with Records

Records let you manage repeating content — blog posts, team members, products, case studies, bibliographic references — as a set of files (markdown, YAML, JSON, or BibTeX). You write each one in its own file (or, for BibTeX, drop in the file your reference manager already exports), say which ones are published, and the framework delivers them to your components as structured data.

This guide covers everything you need to know as a content author. No coding required.

---

## What Records Are

Most of your content lives in `pages/` — one folder per page, with markdown files for each section. That's your site's **static content**: a fixed composition of sections on a fixed set of pages.

Records are different. They're **a small database**. The framework loads them through the data-fetching pipeline and delivers them to components as `content.data`. The same pipeline handles remote APIs, so from a component's point of view a locally-authored record and a backend-served one look identical. Whether the data lives in files or behind an endpoint is a transport concern.

**Three separate things**, and keeping them separate is what makes the rest simple:

```
site/
├── pages/               ← your site's pages
│   ├── home/
│   ├── about/
│   └── blog/
├── entities/            ← 1. THE POOL — everything this site has
│   ├── article/
│   │   ├── getting-started.md
│   │   ├── design-tips.md
│   │   └── our-roadmap.md
│   └── person/
│       ├── alice.md
│       ├── bob.md
│       └── carol.md
├── records.yml          ← 2. WHAT IS PUBLISHED
├── queries.yml          ← 3. HOW IT IS REACHED
└── site.yml
```

**1. `entities/{schema}/` — the pool.** Each file is one entity, and the folder it sits in names its **data schema**:

| on disk | schema |
|---|---|
| `entities/article/…` | `@/article` — your foundation's own |
| `entities/std/person/…` | `@std/person` — the shared standard set |
| `entities/acme/project/…` | `@acme/project` — an organization's |

Keep those folders flat. `entities/article/design-tips.md` works; `entities/article/2025/design-tips.md` is read as the `2025` schema of an `article` organization, which is not what you meant.

**2. `records.yml` — what is published.** A file in `entities/` exists; **listing it here is what makes it a record.** Anything you leave out is a draft, with no flag to set. The common case is two or three lines:

```yaml
# records.yml
- article/*.md
- person/*.md
```

A bare string is a path under `entities/`, naming one file or matching many.

> ⚠️ **An empty `records.yml` is not the same as having none.** No file means "leave the published set alone." An empty file means "nothing is published", which **removes** what was. The CLI asks before it does that.

**3. `queries.yml` — how content is reached.** A page never walks the pool; it asks a **named query** for a set of records. A query names a schema, and the published records of that schema are its rows:

```yaml
# queries.yml
recent:
  schema: '@/article'
  sort: date desc
  limit: 10

team:
  schema: '@/person'
  sort: order asc
```

The file `getting-started.md` becomes the article "Getting Started." The file `alice.md` becomes the team member "Alice." Neither is *published* until `records.yml` lists it, and neither reaches a page until a query asks for it.

---

## Choosing a File Format

A record can be markdown, YAML, JSON, or BibTeX. Pick the format that matches the content:

| Format | Best for | Why |
|---|---|---|
| **Markdown** (`.md`) | Items with prose — articles, blog posts, case studies | Frontmatter holds structured fields (title, date, tags); the body below holds text the author edits in a familiar writing environment |
| **YAML** (`.yml` / `.yaml`) | Structured records with no prose body — team members, products, datasets | Cleaner than squeezing structured data into a markdown frontmatter with an empty body |
| **JSON** (`.json`) | Same as YAML | Pick it if the data is exported from another tool or you prefer JSON syntax |
| **BibTeX** (`.bib`) | Bibliographic references — academic citations, reading lists, archival metadata | Drop the file your reference manager already exports; each `@entry{key, ...}` becomes one record, with the cite key as the lookup id |

All four produce the same shape at runtime — the foundation components see records, not files.

### One file per record, or one file with many

For the three pure-data formats (YAML, JSON, BibTeX), the same authoring choice applies:

- **One record per file** — write a single mapping at the top of the file. The framework uses the filename stem as `slug`. This is the typical pattern when authors hand-edit each entry: `team/alice.yml`, `team/bob.yml`, …
- **Many records per file** — write a top-level array (YAML or JSON) or a `.bib` file with multiple `@entry{...}` blocks. Each record carries its own `slug` (the BibTeX cite key for `.bib`; an explicit `slug:` field for YAML/JSON arrays). This is the typical pattern when the data comes from another tool — a Zotero `.bib` export, a JSON dump from a backend, a YAML file your scripts emit.

Within a single schema folder you can mix and match: array-form files contribute many records each, mapping-form files contribute one each, and the framework merges everything into one combined list. So a `bibliography/` folder can hold an exported `refs.bib` next to a hand-written `extras.yml`; a `team/` folder can hold a bulk `roster.yml` array alongside a single `alice.md` markdown bio for someone who needs a long prose introduction.

Format-specific niceties: markdown items get auto-generated excerpts and first-image extraction. BibTeX entries are normalized to CSL-JSON fields (`author`, `title`, `issued`, `container-title`, `DOI`, …); LaTeX accents (`\"u`, `\'e`) are converted to Unicode automatically. (Configuration files — `site.yml`, `page.yml`, `folder.yml` — are always single mappings; the array-form is a *record* affordance, not a YAML-anywhere one.)

---

## Organizing Records into Folders

Most sites need none of this. The pool is usually flat, and **queries do the
organizing** — a `sort:`, a `where:`, a `limit:` is how you show one slice of it.

Folders exist for one thing: so a query can ask for a **slice of the published
set** rather than all of it. They are declared in `records.yml`, not on disk:

```yaml
# records.yml
- news/announcement.md          # at the root — path: ""

- folder: 2024
  label: 2024                   # a folder may carry a label; a record never does
  records:
    - news/spring.md            # path: "2024"
    - folder: q1
      records:
        - news/report.md        # path: "2024/q1"

- folder: 2023
  records:
    - news/retrospective.md     # path: "2023"
```

Every record carries a `path` naming the folder it sits in, and they all stay in
the same pool — a query over `@/news` still reaches all of them. Folders do not
split anything and do not change a record's URL.

To ask for one branch, query `path`:

```yaml
fetch:
  query: news
  where: { path: { under: '2024' } }   # 2024 and everything inside it
```

```yaml
fetch:
  query: news
  where: { path: '2024' }              # only records directly in 2024
```

See [Predicates](./predicates.md) for `under` and the rest of the query language.

**Three things to know.**

- **The question is never "does this want sub-pages?"** It is "will a query ever
  ask for a *slice*?" If none will, do not make the folder.
- **A record belongs to one folder.** Listing the same file twice is an error, and
  the build names both entries. If you want a computed subset — "everything from
  this year", "the five most recent" — that is a **query**, not a second placement.
- **Slugs must stay unique across the pool.** A slug is what a detail page matches
  on, so two files named `notes.md` in one schema folder both claim `/news/notes`
  and only one can have it. The build warns and names both; rename one.

---

## When to Use Records

Records and items-in-a-section can both show repeating content. Here's how to choose:

| | Items in a section | Records |
|---|---|---|
| **Where content lives** | All in one `.md` file | Each item in its own file |
| **Best for** | A few items that belong together (3–6 features, a short FAQ) | Many items that grow over time (blog posts, team members) |
| **Individual pages** | No | Yes — each item can have its own URL |
| **Sorting and filtering** | No | Yes — by date, tags, or any field |
| **Example** | Feature cards on a landing page | Blog articles with their own pages |

**Rule of thumb:** If you'll keep adding items over weeks and months, use records. If it's a fixed set that belongs to one section, use items in a single markdown file.

---

## Writing a Record

A markdown item has two parts: **frontmatter** (the metadata at the top) and **body content** (the text below). A YAML or JSON item is a single structured record — no frontmatter/body split, just the fields.

### The Frontmatter

Frontmatter is the block between `---` lines at the top of the file. It holds structured information about the item — things like the title, date, and tags.

| Field | What it does | Example |
|-------|-------------|---------|
| `title` | The item's display name | `title: Getting Started` |
| `date` | When it was published | `date: 2025-03-15` |
| `tags` | Categories or labels | `tags: [tutorial, beginner]` |
| `image` | A thumbnail or hero image | `image: ./hero.jpg` |
| `description` | A short summary | `description: Learn the basics` |
| `published` | Whether to include it (default: yes) | `published: false` |
| `author` | Who wrote it | `author: Sarah Chen` |

You can add any other fields you need — `price`, `role`, `location`, `order` — whatever makes sense for your content. The site will pass them through.

### The Body Content

Below the frontmatter, write standard markdown — the same kind you use for page sections. Headings, paragraphs, images, links, lists — it all works.

### A Complete Example

Here's a blog article:

```markdown
---
title: Design Tips for Small Teams
date: 2025-06-10
author: Alice Park
tags: [design, teams]
image: ./design-tips-cover.jpg
description: Practical advice for teams without a dedicated designer.
---

# Design Tips for Small Teams

You don't need a full design team to ship something that looks good.

## Start with Constraints

Pick one font, two colors, and a consistent spacing scale. Constraints make decisions easier.

## Borrow Patterns, Not Pixels

Look at sites you admire. Notice how they handle navigation, cards, and whitespace — then adapt those patterns to your own content.

![Spacing example](./spacing-diagram.svg)

## Ship and Iterate

Don't wait for perfection. Ship something simple, get feedback, and improve.
```

And here's a team member, first as markdown:

```markdown
---
title: Alice Park
role: Lead Designer
image: ./alice.jpg
order: 1
---

Alice leads the design team. She specializes in design systems and accessibility.

Previously at Figma and Google. Speaker at Config and SmashingConf.
```

For a team member, the bio is short and there's no long-form prose — YAML is often cleaner:

```yaml
# entities/person/alice-park.yml
title: Alice Park
role: Lead Designer
image: ./alice.jpg
order: 1
bio: Alice leads the design team. She specializes in design systems and accessibility. Previously at Figma and Google. Speaker at Config and SmashingConf.
```

Notice the differences: the article has `date`, `tags`, and `author`; the team member has `role` and `order`. Each schema uses whatever fields make sense for its content.

---

## Publishing Records, and Declaring Queries

Two files, two questions.

### `records.yml` — which entities are published

```yaml
- article/*.md
- person/*.md
```

That's it. Each line is a path under `entities/`, naming one file or matching
many. Listing an entity is what makes it a **record**; leave one out and it stays
a draft that nothing can reach.

### `queries.yml` — how pages ask for records

A query names a schema, and the published records of that schema are its rows:

```yaml
recent:
  schema: '@/article'
```

If the query's name matches the schema's, you can leave the schema out —
`articles:` alone means `@/articles`. You can also write the whole map under
`queries:` in `site.yml` instead of a separate file, if you prefer one file.

### With options

```yaml
recent:
  schema: '@/article'
  sort: date desc
  where:
    published: { ne: false }
  limit: 100
```

| Option | What it does | Example |
|--------|-------------|---------|
| `schema` | Which records this query is over | `'@/article'`, `'@std/person'` |
| `sort` | Order records by a field | `date desc` (newest first) |
| `where` | Include only matching records (predicate) | `{ published: { ne: false } }` |
| `limit` | Maximum number of records | `100` |
| `deferred` | Heavy fields stripped from list payloads (see below) | `[body]` |
| `queryable` | Fields a foundation can offer for filtering UI (see below) | (object) |
| `url` | A remote source instead of the local pool | `/api/articles` |

**Sorting:** Add `asc` (A→Z, oldest first) or `desc` (Z→A, newest first) after the field name. For example, `sort: date desc` shows newest articles first. `sort: title asc` sorts alphabetically.

**Filtering:** Narrow with a `where:` predicate. Common shapes:

| Goal | `where:` |
|---|---|
| Only published (skip drafts) | `{ published: { ne: false } }` |
| Tagged "featured" | `{ tags: featured }` |
| From 2025 onward | `{ date: { gte: '2025-01-01' } }` |
| Inside one folder | `{ path: { under: 'archive' } }` |

See [Predicates](./predicates.md) for the full operator reference.

### Several queries, and several over one schema

A site can have as many queries as it needs — and **more than one over the same
records**, which is the usual way to show the same set two ways:

```yaml
recent:
  schema: '@/article'
  sort: date desc
  limit: 5

everything:
  schema: '@/article'
  sort: date desc

team:
  schema: '@/person'
  sort: order asc
```

### Lean list payloads with `deferred:`

If your records have heavy fields that bloat list pages — article bodies, long markdown, big nested arrays — you can mark those fields as **deferred**. They're stripped from the cascade payload (`/data/<name>.json`) that list pages get, and emitted as per-record full files for on-demand fetching:

```yaml
queries:
  articles:
    schema: '@/article'
    deferred: [body]
```

What this changes:

- The blog list page (`data: articles`) ships every article *without* the body. Cards stay light.
- A `[slug]/` detail page automatically receives the *full* article (body included) as a single-element array under the query key — `content.data.articles[0]`. The framework knows where the per-record file lives; you don't configure anything else.
- Components that want a body outside a slug page (a hover-card preview, an inline modal) use the `useEntityDetail` kit hook to fetch the full record on demand.

Skip `deferred:` for records without heavy fields — the entire record ships, like always.

**Remote sources.** The above describes file-based records — the build emits per-record files at `/data/<name>/<slug>.json` automatically. For a query over a remote API (`url:` instead of a local `schema:`), tell the framework where to find one full record by setting `detailUrl:`:

```yaml
queries:
  articles:
    url: /api/articles                  # a remote source
    deferred: [body]
    detailUrl: /api/articles/{slug}     # how to fetch one full record
```

Both the dynamic-route auto-detail and `useEntityDetail` consult `detailUrl:` when set; file-based queries leave it null and use the per-record file default.

### Filterable surfaces with `queryable:`

For sites where readers compose their own filtered views — a department dropdown, a "show only featured" toggle, a date-range slider — you declare which fields are filterable, with their type and any type-specific metadata:

```yaml
queries:
  members:
    schema: '@/member'
    queryable:
      department:
        type: enum
        label: Department
        options: [biology, physics, chemistry, geology]
      tenured:
        type: boolean
        label: Tenured
      start_year:
        type: range
        label: Start year
        min: 1800
        max: 2025
```

You declare the *surface* — what the foundation can offer. The foundation reads the metadata and renders matching controls (dropdown, toggle, slider). When the reader picks values, the foundation composes a predicate and fetches the matching records. No extra wiring on your side.

See [Predicates](./predicates.md) for the full pattern, including saved views.

---

## Displaying Records on Pages

Once a query is declared, you can show its records on any page.

### The data shorthand

The simplest way is the `data:` line in `page.yml`:

```yaml
# pages/blog/page.yml
title: Blog
data: articles
```

This tells the page to run the `articles` query. The page's section types then display those articles — as a grid of cards, a list, or however the site's design presents them.

### Showing a few items on another page

Want to show the latest three articles on your homepage? Use `fetch:` in a section's frontmatter:

```yaml
---
type: ArticleTeaser
fetch:
  query: articles
  limit: 3
  sort: date desc
---

# Latest from the Blog
```

This pulls just three articles, sorted newest first, for a teaser section. The full blog page still shows everything.

---

## Individual Pages for Records

Records become even more useful when each one gets its own page — like `/blog/design-tips` for a blog article or `/team/alice` for a team member.

### The [slug] folder

Create a folder with square brackets in the name:

```
pages/
└── blog/
    ├── page.yml          ← The blog list page
    ├── list.md
    └── [slug]/           ← Creates a page for each article
        ├── page.yml
        └── article.md
```

```yaml
# pages/blog/page.yml
title: Blog
data: articles
```

The `[slug]` folder tells the site: "For each record the query returns, create a page." The article at `entities/article/design-tips.md` becomes the page `/blog/design-tips`. The one at `entities/article/getting-started.md` becomes `/blog/getting-started`.

The section inside `[slug]/` receives the individual item's content automatically. You don't need to do anything special in the markdown file — just set the section type:

```markdown
<!-- pages/blog/[slug]/article.md -->
---
type: Article
---
```

These generated pages don't appear in navigation menus. They're meant to be reached through the list page or direct links.

For the full blog recipe with step-by-step setup, see [Recipes](./recipes.md).

---

## Drafts and Unpublished Items

To hide an item from your site without deleting it, set `published: false` in the frontmatter:

```markdown
---
title: Upcoming Feature Announcement
date: 2025-07-01
published: false
---

This article won't appear anywhere on the site.
```

Items without a `published` field are included by default — you only need to add it when you want to hide something.

This is useful for:

- **Drafts** you're still writing
- **Scheduled content** you've prepared ahead of time
- **Archived items** you want to keep on disk but remove from the site

When you're ready to publish, change `published: false` to `published: true` or just remove the line entirely.

---

## Keeping Images with Your Content

You can store images and other files right next to your markdown files. This keeps everything for one item in the same place.

```
entities/article/
├── design-tips.md
├── design-tips-cover.jpg     ← Cover image for the article
├── spacing-diagram.svg       ← Diagram used in the article
├── getting-started.md
└── getting-started-hero.jpg
```

Reference these files with `./` in your markdown:

```markdown
---
title: Design Tips for Small Teams
image: ./design-tips-cover.jpg
---

![Spacing example](./spacing-diagram.svg)
```

The `./` means "in the same folder as this file." The build processes these references automatically — you don't need to worry about where the files end up in the final site.

**Tip:** Name your images to match the markdown file they belong to. `design-tips-cover.jpg` clearly belongs to `design-tips.md`. This keeps things organized as your pool grows.

---

## Beyond Blogs

Records work for any repeating content, not just articles. Here are a few common patterns.

### Team directory

```
entities/person/
├── alice-park.md
├── bob-silva.md
└── carol-wu.md
```

```markdown
---
title: Alice Park
role: Lead Designer
image: ./alice-park.jpg
order: 1
---

Alice leads the design team with a focus on accessibility and design systems.
```

```yaml
# site.yml
queries:
  team:
    schema: '@/person'
    sort: order asc
```

### Product catalog

```
entities/product/
├── starter-plan.md
├── pro-plan.md
└── enterprise-plan.md
```

```markdown
---
title: Pro Plan
price: $49/month
features: [Unlimited projects, Priority support, Custom domains]
image: ./pro-plan-icon.svg
order: 2
---

Everything you need to grow. Includes all Starter features plus priority support and custom domain mapping.
```

```yaml
# site.yml
queries:
  products:
    schema: '@/product'
    sort: order asc
```

### Case studies

```
entities/case/
├── acme-corp.md
├── globex.md
└── initech.md
```

```markdown
---
title: Acme Corp
industry: Manufacturing
image: ./acme-logo.svg
date: 2025-04-20
tags: [enterprise, manufacturing]
---

## The Challenge

Acme needed to consolidate 12 regional websites into a single platform.

## The Solution

We built a multilingual site with dynamic routing for each region.

## Results

- 60% reduction in maintenance costs
- 3x faster content updates
```

```yaml
# site.yml
queries:
  cases:
    schema: '@/case'
    sort: date desc
```

---

## Excerpts

When records are displayed as a list — blog cards, product summaries, search results — each item needs a short preview. These are called excerpts.

**Automatic excerpts:** If you don't do anything special, the site generates an excerpt from the first ~160 characters of your content body. This works fine in most cases.

**Explicit description:** For more control, add a `description` field to your frontmatter:

```markdown
---
title: Design Tips for Small Teams
description: Practical advice for teams without a dedicated designer — constraints, borrowed patterns, and the art of shipping early.
---
```

When a `description` is present, it's used as the excerpt instead of the auto-generated one. This lets you write a polished summary rather than relying on whatever your first paragraph happens to say.

You can also configure excerpt behavior in `site.yml`:

```yaml
queries:
  articles:
    schema: '@/article'
    sort: date desc
    excerpt:
      maxLength: 200          # Characters (default: 160)
      field: description      # Prefer this frontmatter field
```

---

## Tips

- **Start with two or three items.** You can always add more later. Starting small lets you settle on the right frontmatter fields before writing dozens of files.

- **Filenames become URLs.** The file `design-tips.md` creates the slug `design-tips`, which becomes part of the URL (`/blog/design-tips`). Use lowercase, hyphen-separated names.

- **Keep schema folders flat.** Put every file directly in its schema folder. `entities/article/design-tips.md` works; `entities/article/2025/design-tips.md` is read as the `2025` schema of an `article` organization, which is not what you meant. Group in `records.yml` instead.

- **Items vs. records — a rule of thumb.** If you're writing content that fits naturally in one section (a few feature cards, a short FAQ), use items in a single markdown file. If the content is a growing catalog (blog posts, team members, products), use records.

- **Use consistent frontmatter.** If your blog articles use `date`, `author`, and `tags`, add those fields to every article — even if some are optional. Consistency makes your content predictable and easier to maintain.

- **Preview with `pnpm dev`.** Records update automatically during development. Add a file, list it in `records.yml`, and the site refreshes.

---

## Quick Reference

| What you want to do | How to do it |
|---------------------|-------------|
| Add records | Put files in `entities/<schema>/` |
| Publish them | List them in `records.yml` — `- article/*.md` |
| Reach them | Add a query to `queries.yml` — `recent: { schema: '@/article' }` |
| Sort them | `sort: date desc` or `sort: title asc` on the query |
| Filter them | `where: { published: { ne: false } }` on the query |
| Show on a page | `data: articles` in `page.yml` |
| Show a subset | `fetch: { query: articles, limit: 3 }` in section frontmatter |
| Create detail pages | Add a `[slug]/` folder under the list page |
| Hide a draft | `published: false` in item frontmatter |
| Add an image | Store next to the `.md` file, reference with `./` |
| Write an excerpt | Add `description:` to item frontmatter |

---

## What's Next?

- **[Predicates](./predicates.md)** — Filtering with `where:` clauses and saved views
- **[Writing Content](./writing-content.md)** — How to write sections in markdown
- **[Recipes](./recipes.md)** — Copy-paste patterns including a full blog setup
- **[Site Setup](./site-setup.md)** — Site configuration, pages, locales, and more
- **[Translating Your Site](./translating.md)** — Add multiple languages

For technical details on record processing, see [Content Records](../reference/content-collections.md).
