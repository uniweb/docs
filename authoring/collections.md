# Working with Records

Records let you manage repeating content — blog posts, team members, products, case studies, bibliographic references — as a set of files (markdown, YAML, JSON, or BibTeX). You write each one in its own file (or, for BibTeX, drop in the file your reference manager already exports) in your site's `records/` folder, and the framework delivers them to your components as structured data.

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
├── records/             ← 1. YOUR RECORDS — every file in a schema folder is one
│   ├── article/
│   │   ├── getting-started.md
│   │   ├── design-tips.md
│   │   └── our-roadmap.md
│   ├── person/
│   │   ├── alice.md
│   │   ├── bob.md
│   │   └── carol.md
│   └── folder.yml       ← 3. OPTIONAL — folders a query can read one of
├── queries.yml          ← 2. HOW THEY ARE REACHED
└── site.yml
```

**1. `records/{schema}/` — your records.** Putting a file here is what makes it a record; nothing else lists it. The folder it sits in names its **data schema**:

| on disk | schema |
|---|---|
| `records/article/…` | `@/article` — your foundation's own |
| `records/std/person/…` | `@std/person` — the shared standard set |
| `records/acme/project/…` | `@acme/project` — an organization's |

Keep those folders flat. `records/article/design-tips.md` works; `records/article/2025/design-tips.md` is read as the `2025` schema of an `article` organization, which is not what you meant. A file whose name starts with `_` is not a record — somewhere to keep work in progress.

**2. `queries.yml` — how content is reached.** A page never walks the records; it asks a **named query** for a set of them. A query names a schema, and the site's records of that schema are its rows:

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

**3. `records/folder.yml` — folders, when a query needs a slice.** Most sites have none. It sits in `records/` beside the schema folders, the one file there that is not a record, and sorts records into folders so a query can read one of them — see [Organizing Records into Folders](#organizing-records-into-folders).

The file `getting-started.md` becomes the article "Getting Started." The file `alice.md` becomes the team member "Alice." Neither reaches a page until a query asks for it.

> **With a backend**, `uniweb push` sends every record in `records/`, and they are served once the site is published. A site with no `records/` folder leaves the backend's records alone; an *empty* `records/` folder removes them — the CLI asks before it does that.

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

Most sites need none of this. The records are usually flat, and **queries do the
organizing** — a `sort:`, a `where:`, a `limit:` is how you show one slice of them.

Folders exist for one thing: so a query can ask for a **slice of the site's
records** rather than all of them. They are declared in `records/folder.yml`, not as directories.
Every record sits at the top — `path: ""` — unless `folder.yml` places it in a
folder, so a record that belongs at the top needs no line:

```yaml
# records/folder.yml — news/announcement.md sits at the top, path: ""
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

Every record carries a `path` naming the folder it sits in, and they all stay
records of the site — a query over `@/news` still reaches all of them. Folders do not
split anything, and they change a record's URL only under a
[`[...path]`](../reference/dynamic-routes.md#multi-segment-routes--path) page, which
puts the folder in it.

To ask for one branch, give the query a `scope:` — it belongs to the query, so a
`fetch:` that names the query can't carry one:

```yaml
queries:
  news2024:
    schema: '@/news'
    scope: '2024'                      # 2024 and everything inside it
```

```yaml
fetch:
  query: news
  where: { path: '2024' }              # only records directly in 2024
```

See [Predicates](./predicates.md) for `scope:` and the rest of the query language.

**Three things to know.**

- **The question is never "does this want sub-pages?"** It is "will a query ever
  ask for a *slice*?" If none will, do not make the folder.
- **A record belongs to one folder.** Listing the same file twice is an error, and
  the build names both entries. If you want a computed subset — "everything from
  this year", "the five most recent" — that is a **query**, not a second placement.
- **Slugs must stay unique within a schema.** A slug is what a record's page matches
  on, so two records with the same slug — a repeated `slug:` field, or the same entry in
  two data files — both claim `/news/notes`, and only one can have it. The build warns
  and names both; rename one.

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
| `draft` | Keep it off the live site (default: no) | `draft: true` |
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
# records/person/alice-park.yml
title: Alice Park
role: Lead Designer
image: ./alice.jpg
order: 1
bio: Alice leads the design team. She specializes in design systems and accessibility. Previously at Figma and Google. Speaker at Config and SmashingConf.
```

Notice the differences: the article has `date`, `tags`, and `author`; the team member has `role` and `order`. Each schema uses whatever fields make sense for its content.

---

## Declaring Queries

### `queries.yml` — how pages ask for records

A query names a schema, and the site's records of that schema are its rows:

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
    tags: featured
  limit: 100
```

| Option | What it does | Example |
|--------|-------------|---------|
| `schema` | Which records this query is over | `'@/article'`, `'@std/person'` |
| `sort` | Order records by a field | `date desc` (newest first) |
| `where` | Include only matching records (predicate) | `{ tags: featured }` |
| `limit` | How many records the query selects — the first N in its `sort`. Only those get pages | `100` |
| `scope` | One folder of records, and everything inside it | `archive` |
| `excerpt` | How a markdown record's summary is made | `{ maxLength: 200 }` |
| `deferred` | Heavy fields left out of lists (see below) | `[body]` |
| `queryable` | Fields a foundation can offer for filtering UI (see below) | (object) |
| `url` | A public JSON endpoint instead of the site's records | `https://api.example.com/articles` |

Every key, in full: [Queries](../reference/queries.md).

**Sorting:** Add `asc` (A→Z, oldest first) or `desc` (Z→A, newest first) after the field name. For example, `sort: date desc` shows newest articles first. `sort: title asc` sorts alphabetically.

**Filtering:** Narrow with a `where:` predicate. Common shapes:

| Goal | `where:` |
|---|---|
| Tagged "featured" | `{ tags: featured }` |
| Written by one author | `{ author: 'Sarah Chen' }` |
| From 2025 onward | `{ date: { gte: '2025-01-01' } }` |

To read one folder of records and everything inside it, the query takes a
`scope: archive` beside its `where:`, not a predicate.

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

### Lean lists with `deferred:`

If your records have heavy fields that bloat every list — article bodies, long markdown, big nested arrays — you can mark those fields as **deferred**, by their key in the record a component receives: a field, or a section's name. Lists of the query leave them out, and each record's full version is fetched only where it is shown:

```yaml
queries:
  articles:
    schema: '@/article'
    deferred: [body]
```

What this changes:

- The blog's list (`query: articles`) carries every article *without* the body. Cards stay light.
- A `[slug]/` page — one page per article, [below](#individual-pages-for-records) — automatically receives the *full* article, body included. You don't configure anything else.
- A component that wants a body anywhere else (a hover-card preview, an inline modal) fetches the whole record on demand with the `useWholeRecord` kit hook.

Skip `deferred:` for records without heavy fields — the entire record ships, like always.

**External queries.** The above describes the site's own records — the build emits per-record files at `/data/<name>/<slug>.json` automatically. An external query — `url:` instead of a `schema:` — reads records the site doesn't hold, so it can't declare `deferred:`. When its list carries less than a whole record, name the request for one with `record:`:

```yaml
queries:
  articles:
    url: https://api.example.com/articles             # an external query
    record:
      url: https://api.example.com/articles/{slug}    # how to fetch one full record
```

Both the `[slug]` page and `useWholeRecord` use `record:` when it's set. See [Data Fetching → External queries](../reference/queries.md#external-queries).

> **Removed:** `detailUrl:` — its case is `record: { url }`.

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

### The `query:` shorthand

The simplest way is the `query:` line in `page.yml`:

```yaml
# pages/blog/page.yml
title: Blog
query: articles
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

A `fetch:` like this narrows the query for one section: its `where:` keeps the records that also
match, its `sort:` puts them in another order, and its `limit:` takes the first few. It can never
add a record the query leaves out — a `limit:` larger than the query's still shows only what the
query selects — and it cannot change the query's `scope:`: for another folder branch, declare
another query.

---

## Individual Pages for Records

Records become even more useful when each one gets its own page — like `/blog/design-tips` for a blog article or `/team/alice` for a team member.

### The [slug] folder

A folder with square brackets in its name is a **parametric page** — one page with a URL for each record (other tools call these dynamic routes). Create it inside the page that names the query:

```
pages/
└── blog/
    ├── page.yml          ← The blog page: names the query
    ├── list.md
    └── [slug]/           ← Creates a page for each article
        ├── page.yml
        └── article.md
```

```yaml
# pages/blog/page.yml
title: Blog
query: articles
```

The `[slug]` folder tells the site: "For each record the query returns, create a page." The article at `records/article/design-tips.md` becomes the page `/blog/design-tips`. The one at `records/article/getting-started.md` becomes `/blog/getting-started`.

**The query decides which records get a page.** A query with `limit: 100` gives the 100 records it selects a page each, and no other; a `where:` on the query does the same. A `limit:` or `where:` on a section's `fetch:` only changes what that section shows.

The section inside `[slug]/` receives the individual item's content automatically. You don't need to do anything special in the markdown file — just set the section type:

```markdown
<!-- pages/blog/[slug]/article.md -->
---
type: Article
---
```

These generated pages don't appear in navigation menus. They're meant to be reached through the list or direct links — and every list of the query links each record to its page, wherever the list appears.

### More from the same query, beside a record

A record's page often shows a few of its siblings — "more articles", "related posts". Add a section to the `[slug]` folder that names the same query and leaves out the record the page is about:

```markdown
<!-- pages/blog/[slug]/more.md -->
---
type: ArticleTeaser
fetch:
  query: articles
  current: exclude   # every article except this page's
  limit: 3
---

# More from the blog
```

`current: exclude` works on a section inside a `[slug]` folder. `current: include` shows all of them, this one included — for a previous / next pager.

For the full blog recipe with step-by-step setup, see [Recipes](./recipes.md). For everything about these pages — nested folders, `[...path]`, what the URL matches — see [Parametric Pages](../reference/dynamic-routes.md).

---

## Drafts

To keep a record off your live site without deleting it, set `draft: true` in its frontmatter:

```markdown
---
title: Upcoming Feature Announcement
date: 2025-07-01
draft: true
---

This article won't appear on the site until it's no longer a draft.
```

A draft is still a record — it stays in `records/`, and `pnpm dev` shows it, so you can preview it where it will appear. It's left out of what the site delivers: a build for hosting leaves it out of every query. Records without `draft:` are delivered.

This is useful for:

- **Drafts** you're still writing
- **Scheduled content** you've prepared ahead of time
- **Archived items** you want to keep but take off the site

When it's ready, remove the line (or set `draft: false`).

To keep a file out of the site's records altogether — work that isn't a record yet — start its name with `_`: `_new-idea.md` is never read.

---

## Keeping Images with Your Content

You can store images and other files right next to your markdown files. This keeps everything for one item in the same place.

```
records/article/
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

**Tip:** Name your images to match the markdown file they belong to. `design-tips-cover.jpg` clearly belongs to `design-tips.md`. This keeps things organized as your records grow.

---

## Beyond Blogs

Records work for any repeating content, not just articles. Here are a few common patterns.

### Team directory

```
records/person/
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
records/product/
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
records/case/
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

- **Keep schema folders flat.** Put every file directly in its schema folder. `records/article/design-tips.md` works; `records/article/2025/design-tips.md` is read as the `2025` schema of an `article` organization, which is not what you meant. Group in `records/folder.yml` instead.

- **Items vs. records — a rule of thumb.** If you're writing content that fits naturally in one section (a few feature cards, a short FAQ), use items in a single markdown file. If the content is a growing catalog (blog posts, team members, products), use records.

- **Use consistent frontmatter.** If your blog articles use `date`, `author`, and `tags`, add those fields to every article — even if some are optional. Consistency makes your content predictable and easier to maintain.

- **Preview with `pnpm dev`.** Records update automatically during development: add or edit a file in `records/`, or change `records/folder.yml` or `queries.yml`, and the site refreshes.

---

## Quick Reference

| What you want to do | How to do it |
|---------------------|-------------|
| Add records | Put files in `records/<schema>/` — every file there is a record |
| Keep a file out | Start its name with `_` |
| Organize them into folders | `- folder: archive` in `records/folder.yml` (optional) |
| Reach them | Add a query to `queries.yml` — `recent: { schema: '@/article' }` |
| Sort them | `sort: date desc` or `sort: title asc` on the query |
| Filter them | `where: { tags: featured }` on the query |
| Show on a page | `query: articles` in `page.yml` |
| Show a subset | `fetch: { query: articles, limit: 3 }` in section frontmatter |
| Give each record a page | Add a `[slug]/` folder inside the page that names the query |
| Show more beside a record | `fetch: { query: articles, current: exclude, limit: 3 }` in a section of the `[slug]/` folder |
| Keep a record off the live site | `draft: true` in its frontmatter |
| Add an image | Store next to the `.md` file, reference with `./` |
| Write an excerpt | Add `description:` to item frontmatter |

---

## What's Next?

- **[Predicates](./predicates.md)** — Filtering with `where:` clauses and saved views
- **[Writing Content](./writing-content.md)** — How to write sections in markdown
- **[Recipes](./recipes.md)** — Copy-paste patterns including a full blog setup
- **[Site Setup](./site-setup.md)** — Site configuration, pages, locales, and more
- **[Translating Your Site](./translating.md)** — Add multiple languages

For technical details, see [Records](../reference/content-collections.md) and [Queries](../reference/queries.md).
