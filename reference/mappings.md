---
description: "A mapping says how another system's file corresponds to one of your types: its frame, its fields and paths, conversions, multi Sections, follow, the list and set shapes, and what register refuses."
---

# Mappings

A **mapping** says how another system's file and one of your foundation's types correspond: a
catalog feed's CSV from `@/vehicle`, a lead's XML into `@/lead`, a grader's JSON answer onto a
submission. An [integration](./blueprint.md#integrations) moves entries through one. Each mapping is
a file in the foundation's `src/mappings/`, named by the file, the way `src/schemas/` holds your
types:

```yaml
# src/mappings/vehicle-to-meta.yml
label: Meta catalog
model: '@/vehicle'
direction: out
shape: list
format: { type: csv }
fields:
  - { title: listing.title }
  - { vin: listing.vin }
  - { price: { from: listing.price } }
```

`uniweb register` registers a foundation's mappings with it, and your Application Engine checks
each against the type it names. A mapping that doesn't fit is refused there, with every problem
listed as `where: what`, so you can fix them all in one pass. This page is the language that check
holds a mapping to.

## The one reading rule

A mapping goes **one way**. `direction: in` turns the other system's entries into yours;
`direction: out` turns yours into its file. A case that goes both ways is two mappings.

In every rule, **the left side is what is written, and the right side is where it is read from**:

| | left (written) | right (read) |
|---|---|---|
| `direction: in` | your field, `section.field` | a path in their file |
| `direction: out` | a path in their file | your field, `section.field` |

## The frame

| Key | | |
|---|---|---|
| `label`, `description` | optional | the mapping's name and description, as the Solution Owner Console shows them |
| `model` | required | the type it maps: `@/name` for one of your foundation's, or a type in full |
| `direction` | required | `in` or `out` |
| `shape` | required | `document` (one file, one entry), `list` (one file, many entries) or `set` (one file, several linked types, inbound) |
| `format` | required | `{ type: csv, delimiter?: ',', header?: true }`, `{ type: xml, instructions?: [...] }` or `{ type: json }` |
| `path` | `list` only | where the entries are in the file; leave it out for the file's root (a CSV file, a JSON array) |
| `key` | **inbound `list`: required** | the path, within one entry, of the value that identifies it, so an entry sent again updates rather than duplicates |
| `keys_from` | outbound only | another of your mappings, the inbound one that recorded the other system's keys, so they are written back |
| `follow` | outbound only | other entries to read from (below) |
| `fields` | | your `single` Sections' fields |
| `sections` | | your `multi` Sections |
| `parts` | `set` only | the linked parts (below) |

Any other key is refused. So is a `path` on a `document` (`path: is for the list shape; a document
is one entity`).

## `fields`

`fields` is a **list** of one-entry maps, `- target: rule`, written in the order the other system
expects: CSV columns and XML children are written in that order. A map in its place is refused, and
so is a target named twice.

`fields` holds your **`single` Sections** only. Your side is `section.field`, split at its last `.`,
and a nested Section is named by its path (`media/photos.url`). A `multi` Section goes under
[`sections`](#sections), and naming one here says so (`it is a multi Section: map it under
sections`).

A rule's right side is a string, short for `{ from: <string> }`, or a [rule](#rules).

### The other system's side: paths

One path language serves CSV, XML and JSON:

- **CSV**: the file is its rows; a path is a column's name (`Stock Number`), or its position (`1`,
  `2`, …) with `header: false`. Every value is text.
- **XML**: a child is its name, an attribute is `@name`, and the text is `#text`. A path from the
  file's root starts with the root element (`feed/vehicle`).
- **JSON**: the value as parsed.

Segments are separated by `/`, and each treats a single value as a list of one:

| Segment | Selects |
|---|---|
| `name` | the child `name`, each one when there are several |
| `name[*]` | the same, said explicitly |
| `name[@type='main']` | the children `name` whose attribute `type` is `main` |
| `@attr` | an attribute (last segment only) |
| `#text` | the text (last segment only) |
| `"name"` | a name taken literally, when it holds `/`, `[`, `]` or `.` (`"image[0].url"`) |

Writing out, a path creates what it names: `item[@id='x']/title` writes an `item` element with
`id="x"`. An outbound XML name must be a valid XML name, and an outbound CSV target is one plain
column name.

## Rules

A rule has **exactly one source**:

| Source | | Direction |
|---|---|---|
| `from: <path>` | a value read from the other side | both |
| `constant: <value>` | a fixed value | both |
| `template: "{make} {model}"` | text with `{path}` placeholders from the reading side; `{{` and `}}` are literal braces. A template whose every placeholder is empty writes nothing | both |
| `languages: { en: <path>, fr: <path> }` | one path per language, into a localized field | in |
| `uuid: self`, or `uuid: <alias>` | an entry's own id, or a followed entry's | out, under `fields` |

### Conversions

Conversions apply to a `from` source only, each at most once, in this order:

1. `locale: en`: out only, one language of a localized field, with its fallbacks. Reading a
   localized field out without it is refused.
2. `split: "|"`, then `first: true`: one text into several values; keep the first.
3. **One of** `lookup`, `date` or `number`, applied to each value:
   - `lookup: { Y: true, N: false }`: a value not listed fails its entry, unless the table has a
     `"*"` entry;
   - `date: "MM/yyyy"`: a pattern of `yyyy`, `MM`, `dd`, `HH`, `mm`, `ss` and literal
     characters, in UTC both ways. Inbound, it must be at least as precise as the field;
   - `number: { decimal?: ',', strip?: '$,' }`: `strip` removes characters before reading,
     inbound.
4. `join: ","`: several values into one text.
5. `default: <value>`: the value when nothing is left.

`json_text: true` (inbound) keeps an object or list whole, written as JSON text into a string or
text field; it takes no conversion but `default`.

**A CSV or XML file's values are text.** Reading one into an `int` or `decimal` field needs
`number: {}` (or a `lookup`), and into a boolean a `lookup`. The refusal names the fix:
`the field is a boolean, and this file's values are text: add a lookup (e.g. {"yes": true, "no": false})`.
A JSON file's numbers need nothing.

Where one value is expected and several can arrive, add `first` or `join`: a `split` into a field
that holds one value, or, out, a list into a CSV cell, an attribute or an element's text.

Inbound, a `constant`, a `default` and each `lookup` result must already fit the field, by its JSON
type.

### What a mapping never carries

References (`entity_ref`, `item_ref`), `file` fields and `secret` fields. Out, read a referenced
entry with [`follow`](#follow) instead. A secret is never written by a mapping.

Inbound, every `required` field of each Section the mapping writes must be written by some rule.

## `sections`

One entry per `multi` Section:

| Key | | |
|---|---|---|
| `section` | required | your Section's path (`answers`, `media/photos`) |
| `path` | required | where the repeated elements are, relative to the entry (or the parent's element, nested) |
| `key` | **inbound: required** | the path, within one element, of the value that identifies the item |
| `fields` | | the Section's fields, named by their **bare key** (`url`, not `photos.url`) |
| `sections` | | `multi` Sections nested under this one |
| `of` | outbound, top level | the [`follow`](#follow) alias whose Section this is |

```yaml
sections:
  - section: media/photos
    path: Photos
    key: '#text'
    fields:
      - { url: { from: '#text' } }
```

A CSV row holds one value per column, so an outbound CSV mapping writes a `multi` Section with a
field rule and `join` instead: `{ Photos: { from: photos.url, join: '|' } }`.

## `follow`

An outbound mapping may read entries other than the one it writes, each reached along a reference
field pinned to one type. `follow` is a list of one-entry maps, in order:

```yaml
follow:
  - { quiz: { field: identity.quiz_ref } }                                      # forward: the entry a field names
  - { key:  { model: '@/quiz-key', field: identity.quiz, names: quiz } }       # reverse: the entry whose field names one above
fields:
  - { submission: { uuid: self } }
  - { quiz: 'quiz:identity.slug' }
  - { passing: 'quiz:identity.passing' }
```

A forward line takes `field` (a `single` Section's reference, pinned to one type) and may start
`from` an alias above. A reverse line takes `model` and `field`, and may start from an alias above
with `names`. An alias is a lowercase name other than `self`. Rules read a followed entry as
`alias:section.field`, its id as `{ uuid: alias }`, and its `multi` Section with `of: alias`.

## Shapes

- **`document`**: one file is one entry. `key`, when given, is the other system's id for it.
- **`list`**: one file is many entries.
  - `path` is where they are. Leave it out for CSV. For outbound XML, name the root element and the
    entry element (`feed/vehicle`).
  - Inbound, `key` is required.
  - Outbound, `key` is where an entry's key is written back, with `keys_from` naming the inbound
    mapping that recorded it.
- **`set`**: inbound, from JSON or XML, one file into several linked types. The mapping holds only
  `parts`, and each part has an `id`, a `model`, a `path` and a `key`, its own `fields` and
  `sections`, and optionally `unique`. Exactly one part is the `root`, and every other part lies
  below its path. A part's `key` and `fields` may read a parent with `../`. A rule links parts:
  `{ ref: <part>, at: <path> }` for a reference, or `{ uuid: <part>, at: <path> }` for an id as
  text. The parts may not link in a circle.

## What `register` checks, and what it doesn't

`register` checks everything above against your types, and its refusal lists the problems,
`where: what`, one per line. Your engine checks it again when it starts and when a mapping is used.

Two kinds of problems surface only later:

- **Per entry, when a run reads the data:** a value missing from a `lookup`, a date that doesn't
  match its pattern, several values where one is held. That entry fails, and the run says why.
- **The integration's rules:** whether a mapping fits its channel (a `feed` needs an outbound
  `list`, an `email` or `http` message an outbound `document`), and how an `http` integration's
  `reply` is read. These belong to the [integration](./blueprint.md#integrations), which lists its
  problems and can't be switched on until they're fixed.

## Two complete mappings

An inbound list from CSV:

```yaml
model: '@/vehicle'
direction: in
shape: list
format: { type: csv }
key: VIN
fields:
  - { listing.vin: VIN }
  - { listing.year: { from: Year, number: {} } }
  - { listing.price: { from: Price, number: { strip: '$,' } } }
  - { listing.certified: { from: CPO, lookup: { Y: true, N: false } } }
  - { listing.listed: { from: Listed, date: MM/yyyy } }
  - { listing.title: { languages: { en: TitleEN, fr: TitleFR } } }
sections:
  - section: media/photos
    path: Photos
    key: '#text'
    fields:
      - { url: { from: '#text' } }
```

An outbound document to JSON, sending a submission to a grader with what it needs from the quiz and
its answer key:

```yaml
model: '@/submission'
direction: out
shape: document
format: { type: json }
follow:
  - { quiz: { field: identity.quiz_ref } }
  - { key:  { model: '@/quiz-key', field: identity.quiz, names: quiz } }
fields:
  - { submission: { uuid: self } }
  - { quiz: 'quiz:identity.slug' }
  - { attempt: identity.attempt }
  - { answers: identity.choice_answers }
  - { passing: 'quiz:identity.passing' }
sections:
  - section: answers
    of: key
    path: key
    fields:
      - { question: question }
      - { correct: { from: correct, join: ',' } }
```

**See also:** [Blueprint § Integrations](./blueprint.md#integrations) ·
[Compute Functions](../web-apps/compute-functions.md) ·
[Libraries § Mappings in a library](../development/libraries.md#mappings-in-a-library)
