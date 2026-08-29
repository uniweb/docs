# Data-Driven Sections

A data-driven section is a section whose content comes from a data source — a YAML collection, a JSON file, an API — and is instantiated via Loom expressions. Instead of writing static text, the content author writes a template with `{placeholders}` that resolve against live data at runtime.

This guide builds progressively: simple substitution first, then aggregation, then repeated iteration, then filtering.

> **Prerequisite**: Your foundation must declare a content handler. The `cv-loom` template is a complete working example. See [Content Handlers](./content-handlers.md) for the setup.

---

## The Setup

Three things connect a section to its data:

**1. Records in `entities/`, published by `records.yml`, reached by a query:**

```yaml
# records.yml — listing an entity is what makes it a record
- profile/*.yml
```

```yaml
# queries.yml — a query names a schema; the published records of that schema are its rows
profile:
  schema: '@/profile'
```

**2. A data reference in `page.yml`:**

```yaml
# page.yml
title: Curriculum Vitae
data: profile
```

**3. Loom expressions in the markdown:**

```markdown
---
type: Header
---
# {first_name} {family_name}
## {role}
{title} -- {affiliation}
```

The collection processor reads every `.yml` file in `entities/profile/` and makes it available as `data.profile`. The content handler resolves `{first_name}` against the profile data before the component sees the content.

---

## Simple Substitution

Any `{field_name}` in the markdown is replaced with the corresponding value from the data. Given this data:

```yaml
# entities/profile/darwin.yml
first_name: Charles
family_name: Darwin
role: Naturalist
affiliation: Down House, Downe, Kent
```

This markdown:

```markdown
# {first_name} {family_name}
## {role}
Based at **{affiliation}**.
```

Produces content equivalent to:

```markdown
# Charles Darwin
## Naturalist
Based at **Down House, Downe, Kent**.
```

The component receives this as ordinary parsed content — `content.title` is "Charles Darwin", `content.subtitle` is "Naturalist". It doesn't know Loom was involved.

---

## Aggregation

Loom expressions can count, total, and average over arrays in the data:

```markdown
**{COUNT OF publications}** published works, including
{COUNT OF publications WHERE type = 'book'} books and
{COUNT OF publications WHERE type = 'article-journal'} journal articles.

Total funding: £{TOTAL OF funding.amount}
(average £{AVERAGE OF funding.amount} per grant).
```

With 17 publications and 5 grants totalling £1,730, this renders as:

> **17** published works, including 14 books and 3 journal articles. Total funding: £1,730 (average £346 per grant).

Aggregate expressions work anywhere in the markdown — titles, paragraphs, list items. The `WHERE` clause filters which items are counted.

Other aggregation forms: `{SHOW research_areas JOINED BY ', '}` concatenates a list into a comma-separated string. `{SHOW publications.title WHERE year > 1870 JOINED BY ', '}` filters and joins a specific field.

---

## The Repeat Pattern

When a section needs to iterate over a data array — education entries, publications, grants — use the `source` frontmatter param and `---` dividers to split the markdown into regions:

```markdown
---
type: CvEntry
source: education
---
# Education
{COUNT OF education} degrees.
---
## {degree}
{institution} -- {field} ({start}--{end})
```

The three regions are:

1. **Header** (before the first `---`): rendered once, with expressions resolved against the full data. Good for headings and summary statistics.
2. **Body** (between dividers): repeated once per item in the `source` array. `{degree}`, `{institution}`, etc. resolve against each item.
3. **Footer** (after the second `---`): rendered once, against the full data. Optional — omit the second divider if you don't need it.

Given two education entries, the component receives content with a title ("Education"), a paragraph ("2 degrees."), and two items — each with its own title and paragraph.

### A footer example

The funding section adds a total at the bottom:

```markdown
---
type: CvEntry
source: funding
---
# Research Funding
{COUNT OF funding} grants.
---
## {title}
{agency} -- £{amount} ({year})
---
**Total: £{TOTAL OF funding.amount}**
```

---

## Filtering with where

Add `where` in frontmatter to iterate over a subset of the source array:

```markdown
---
type: CvEntry
source: publications
where: "type = 'book'"
---
# Books ({COUNT OF publications})
---
**{title}** ({year}), {publisher}
```

Only publications where `type` equals `'book'` are iterated. The `{COUNT OF publications}` in the header reflects the filtered set — it counts books, not all publications.

`where` expressions use Loom Plain form:

| Expression | Meaning |
|---|---|
| `type = 'book'` | Equality |
| `year > 1870` | Comparison |
| `refereed` | Truthy check |
| `type = 'book' AND refereed` | Boolean combination |

---

## Data Conventions

A few conventions make expressions work predictably:

- **Years as numbers.** Write `year: 1859`, not `year: '1859'`. Loom skips locale grouping for 4-digit integers, so 1859 renders as "1859" not "1,859". Comparisons like `WHERE year > 1870` work naturally.
- **Money as numbers.** Write `amount: 1000`, not `amount: '£1,000'`. This lets `TOTAL OF` and `AVERAGE OF` aggregate correctly — Loom adds locale grouping to the output.
- **Pre-sorted lists.** Loom iterates in array order. Sort your data in the YAML file the way you want it displayed. Reverse chronological is common for academic CVs.
- **Dot notation for nested fields.** `{funding.0.amount}` accesses the first funding item's amount. `{TOTAL OF funding.amount}` maps over all items.

---

## Putting It Together

The `cv-loom` template demonstrates the full pattern — a complete academic CV driven by a single YAML profile. Create one with:

```bash
npx uniweb create --template cv-loom
```

The template includes: a profile collection (`entities/profile/darwin.yml`), a foundation with `createLoomHandlers`, and sections for education, employment, publications, funding, teaching, service, and awards — each using the header/body/footer pattern with aggregation and filtering.

---

## See Also

- [Content Handlers](./content-handlers.md) -- Setting up the transform layer in main.js
- [Working with Data](./working-with-data.md) -- Data fetching, collections, and auto-wiring
- [Content Collections](../reference/content-collections.md) -- Building collections from YAML and markdown
