# Receiving Content

When you write a section type, the `content` prop arrives already parsed: the author's
markdown has been read into named pieces — `title`, `pretitle`, `subtitle`, body fields,
`items` — before your component runs. This guide is about consuming that structure well:
what the parse promises you, which habits keep a component working across every document an
author will ever feed it, and which habits quietly break.

The short version of the deal: the parser is defensive coding done once, upstream. You get
to write render logic instead of text extraction — no scanning for headings, no null checks,
no "what if the author wrote it in a different order." In exchange, you treat the named
pieces as the interface and let go of assumptions about the markdown that produced them.

The full field-by-field shape is in the [content structure reference](../reference/content-structure.md).
This guide is about how to *think* when consuming it.

---

## The shape is guaranteed

Every content field exists on every section — empty string or empty array when the author
wrote nothing there. That's a load-bearing guarantee, not a convenience: it means you
destructure and map without ceremony.

From `templates/services/foundation/sections/Testimonials/index.jsx`:

```jsx
export default function Testimonials({ content, params }) {
  const { title, items } = content

  return (
    <div>
      {title && <H2 text={title} className="…" />}
      <div className={gridClass}>
        {items.map((item, i) => (
          <figure key={i}>
            {item.paragraphs?.[0] && <P text={item.paragraphs[0]} />}
            …
          </figure>
        ))}
      </div>
    </div>
  )
}
```

`items.map` runs with no existence check because `items` is always an array. And the
`title &&` guard is doing less than it looks like: kit's text components **self-erase** —
`<H2 text="" />` renders `null` — so a bare component needs no guard at all. The guard earns
its place only when a *wrapper* must disappear with the content (a header block with its own
margin). Likewise `item.paragraphs?.[0]` above is a habit the guarantee makes unnecessary —
`paragraphs` always exists, and as the next section shows, the whole conditional can collapse
into one component call.

That's the distinction to hold onto: **conditionals in a section type express design
choices, never fear of missing fields.** If you find yourself writing
`content?.items ?? []`, the defensiveness is aimed at a case that cannot occur, and it will
mislead the next reader into thinking it can.

What the guarantee does *not* cover is meaning. `title` exists but may be `''`; an item may
carry only an icon. Authors legitimately write sparse content, so a component should degrade
by design — decide what a card without a title looks like, rather than assuming one.

---

## Headline slots hold lines, not strings

`title`, `pretitle`, and `subtitle` are each a string — or an **array of strings** when the
part spans several lines. All three, and this is by authorial design, not edge case:

- A split headline: `title` → `["Build the future", "with confidence"]`
- A three-line header (name / role / affiliation, an event's dates / venue): `subtitle` →
  `["Chief Scientist", "Analytical Engines Ltd"]`
- A stacked label: `pretitle` → `["Acme Labs", "Announcing"]`

The habit that makes this free: **pass content fields to the kit text components** —
`Text` and its aliases `H1`–`H6`, `P`, `Span`, `Div`, `PlainText`
(`kit/src/components/Text/Text.jsx`). They speak the parsed shape natively, which is worth
understanding once because it deletes code from every component you write:

- **String or array, one call.** `<H1 text={content.title} />` renders a string as the tag,
  and an array as *one* heading with each line in its own inner element — the multi-line
  headline, no branch on your side.
- **Non-heading tags map the array instead.** `<P text={content.paragraphs} />` renders
  *every* paragraph, one `<p>` per entry, each carrying your `className`. The
  `paragraphs?.[0] &&` conditional from the Testimonials excerpt above is one line:
  `<P text={item.paragraphs} className="text-body italic" />`.
- **Empty content self-erases.** Empty strings, whitespace, and empty array lines render
  `null` — the components absorb the sparse-content tolerance for you.
- **Inline markup and links come out right.** Parsed text carries HTML — `<strong>`, accent
  spans from `[text]{accent}`, anchors — and the components render it and run authored
  hrefs through the same resolution chain structured `<Link>`s get: `page:` references,
  locale prefixes, the deployment base path.
- **`lineAs` controls the per-line tag** when the default (`div` inside headings, `p`
  otherwise) isn't what the design wants: `<Div text={lines} lineAs="span" />`.

The anti-pattern is raw interpolation, and it fails three ways at once:

```jsx
<p className="…">{content.pretitle}</p>     // arrays concatenate with no separator,
                                            // inline markup shows as literal tags,
                                            // authored links never resolve
<P text={content.pretitle} className="…" /> // correct on all three, string or array
```

You'll find both spellings in the templates — the raw form predates multi-line slots and
survives where the content it renders happens to be a single plain line. The kit component
costs nothing and covers everything, so it's the spelling to reach for.

When the design wants the *lines* treated differently — subtitle line one large, line two
small, as a CV header does — reach for CSS on the line elements first (`h2 > div` children
are ordinary selectors away: `:first-child`, `:last-child`). Only when lines need genuinely
different markup, normalize and lay them out yourself:

```jsx
const lines = [].concat(content.subtitle || [])
```

---

## Items are the repetition

`items` is where repeating content lands — cards, questions, entries, tiers — and each item
carries the **same shape as the section**: its own `title`, `pretitle`, `subtitle`,
`paragraphs`, `icons`, `links`, `data`, everything. A pricing tier arrives as
`{ pretitle: "Most popular", title: "Pro", subtitle: "$29 / month", paragraphs: […] }` with
no configuration on your side.

Two habits keep item handling durable:

**Handle 0, 1, and N uniformly.** Authors control the count. A component that assumes three
feature cards breaks on the site that has four; a `grid` that maps whatever arrives doesn't.
When a count genuinely matters to the design (a two-column comparison), declare it in your
content description — and then render exactly what you declared. A component that documents
"up to three items" and receives five ignores the extra two, *silently*: that's the contract
section below applied to counts. Unrendered is the normal state of over-provided content,
and the declaration is what makes the silence legible — the author can read what the design
uses. Treating extra content as a fault to surface is validation thinking imported from
frameworks where input can be invalid; here no content is invalid.

**Read item slots the same way as section slots.** The same kit components, the same
string-or-array handling, the same sparse-content tolerance. Symmetry here is what lets an
author restructure — promote a card's content to the section, split a section into cards —
without the component caring.

One level: items don't nest. Structure deeper than one list per section arrives through
child sections, lists (`content.lists` is recursive), or tagged data blocks — if you're
trying to reconstruct a hierarchy from `items`, the content wants one of those instead.

---

## Slots are roles, not sizes

Heading levels never reach you, on purpose. Whether the author wrote `#` or `###`, what
arrives is *which slot the line fills* — and your component decides everything visual. A
`pretitle` isn't small because the author made it small; it's small because you style
pretitles small. This is the license that makes one section type work across documents
written at different heading depths.

The corollaries:

- **Render `pretitle` independently of `title`.** Authors can label an untitled block (the
  `#>` label line), so a pretitle with an empty title is legal content, not a malformed
  state.
- **Don't infer importance from anything but the slot.** There is no level field to branch
  on, deliberately.
- **Order is yours.** The parse doesn't tell you whether the icon came before the heading in
  the markdown, and your layout shouldn't care — authors write in meaning-order, you arrange
  in design-order. When source order *is* the design (an article body), that's the other
  view:

---

## Two views: grouped and sequence

Everything above is the grouped view — content bucketed into named slots. `content.sequence`
is the other lens: every element in document order, untouched. Both are always present;
choosing is a design decision, not a capability gap.

- **Grouped** suits structured layouts: heroes, grids, tiers — anywhere the design owns the
  arrangement.
- **Sequence** suits prose: articles, documentation bodies — anywhere the *author* owns the
  order. Kit's `Prose` renders it with typography, including `#>` label lines as
  `<p data-role="pretitle">` (style them via `[data-role="pretitle"]`).

Don't straddle: reconstructing document order from grouped fields (interleaving `paragraphs`
and `images` by guesswork) re-implements `sequence` badly. If you're doing that, switch
views.

A note on `headings`: it only ever fills from nested content (headings inside blockquotes or
list items). A section's own headline never lands there, and for a table of contents you
want the `useHeadings()` hook, which works during prerender — not this field.

---

## The content interface is yours to declare

Your `meta.js` carries a `content:` description alongside `params:`. `uniweb docs` collects
every section type's description into the project's `COMPONENTS.md` — the catalog authors
consult before writing. That makes the description your half of a two-way contract:

- **Authors write to what you declare.** Say your Stats section reads a title and items with
  a number-title and one-line label, and that's what you'll receive.
- **You may ignore what you didn't ask for.** Extra content an author provides is parsed and
  present, and skipping it is legitimate — a `compact` param that renders less of the same
  content than `full` is an established pattern, not a bug.
- **Authors may over-provide on purpose.** The content is the superset; params select.

Being honest about the seam: the description is documentation, not validation. Nothing
rejects content that ignores it — a section renders with whatever arrived. `uniweb inspect`
is the shared instrument when the two sides disagree about what a document contains.

---

## When content looks wrong

`uniweb inspect <file>` prints the parsed shape of any section — run it before debugging
your component, because two authoring misfires produce content that *looks* like a component
bug:

1. **The first entry is missing from `items` and an extra subtitle line appeared.** The
   author put their first entry one step under the headline with nothing between; it joined
   the headline as a subtitle line. Author-side fix: entries two steps down, or a lead
   paragraph, or a `---`.
2. **`title` is empty and the headline text shows up in `items[0]`.** The author wrote text
   above their title (usually a hand-made eyebrow); body-before-heading makes the section an
   untitled main with items. Author-side fix: the `#>` label line.

Recognizing these saves you from "fixing" a correct component against misparsed content —
and from adding defensive code for shapes that a one-line content edit resolves.

---

## The interface stops at the front desk

Everything in this guide describes one kind of component: the section type — the component
an author names in `type:`. It has this particular interface because it's the bridge into
the author's world; the parsed shape is what makes it addressable from markdown.

Nothing behind the bridge needs to speak it. The established pattern is the front desk: the
section type reads `content` and `params` once, then delegates to ordinary React components
with whatever props interface suits them — narrow, typed, yours. A `Testimonials` section
that maps items into a plain `<QuoteCard author quote role />` keeps the inner component
reusable anywhere React runs, and keeps the content shape where it belongs. Passing
`content` down through several layers is the smell that the translation didn't happen at
the door.

So the mental model to leave with: one component per section type receives the author's
world and translates it; everything past that point is the React you already write. The
[Front Desk pattern](./component-patterns.md#the-front-desk-pattern) covers the delegation
side in depth.

---

## See Also

- [Content Structure](../reference/content-structure.md) — the field-by-field reference,
  including how headings map to slots
- [Creating Components](./creating-components.md) — component basics, `meta.js`, params
- [Component Patterns](./component-patterns.md) — the Front Desk, structured data,
  multi-source rendering
- [Kit Reference](../reference/kit-reference.md) — the text components, `Prose`,
  `useHeadings()`
