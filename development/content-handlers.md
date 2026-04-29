# Content Handlers

Content handlers are a transform layer between data assembly and your component. They run per section, declared once in `main.js`, and let you reshape content before the component sees it. The most common use is Loom instantiation — resolving `{placeholder}` expressions in markdown against live data.

---

## The Three Hooks

The foundation declares handlers as an object in its default export:

```js
// src/main.js
export default {
  handlers: {
    data:    (data, block) => { /* ... */ },
    content: (data, block) => { /* ... */ },
    props:   (content, params, block) => { /* ... */ },
  },
}
```

All three are optional. Each runs per block and is error-isolated — a failing handler logs a warning and falls back to default behavior.

| Hook | When it runs | Receives | Returns | Purpose |
|---|---|---|---|---|
| `data` | After data assembly | `(data, block)` | New data object, or null | Filter, reshape, or augment assembled data |
| `content` | After data hook | `(data, block)` | ProseMirror document, or null | Transform raw content (Loom instantiation, template expansion) |
| `props` | After parsing + defaults | `(content, params, block)` | `{ content, params }`, or null | Post-process the final shape before the component sees it |

Most foundations only need the `content` hook. The `data` and `props` hooks are for advanced cases — filtering data before it reaches content, or adjusting parsed output before the component renders.

---

## The createLoomHandlers Shortcut

`@uniweb/loom` provides a factory that creates the content handler for you. This is the standard approach for data-driven foundations:

```js
import { createLoomHandlers } from '@uniweb/loom'

export default {
  handlers: createLoomHandlers({
    vars: (data) => data?.profile?.[0],
  }),
}
```

The `vars` function extracts the variable namespace from assembled data. The factory returns a content handler that reads two frontmatter params — `source` and `where` — and decides what to do:

- **Without `source`**: simple substitution. `{first_name}` resolves against the variable namespace.
- **With `source`**: repeated iteration. The handler splits the markdown at `---` dividers and repeats the body per data item.
- **With `where`**: the source array is filtered first — only matching items are iterated.

That single `createLoomHandlers` call handles all three cases. Components don't need to know about Loom — they receive standard parsed content with expressions already resolved.

---

## The source and where Conventions

`source` and `where` are convention-level reserved frontmatter fields. They flow through to both `block.properties` (for handler access) and `params` (visible to components). Components can ignore them — they're consumed by the handler, not the component.

List them in `meta.js` so the editor and schema recognize them:

```js
// meta.js
export default {
  title: 'CV Entry',
  params: {
    source: {
      type: 'string',
      description: 'Data field to iterate over.',
    },
    where: {
      type: 'string',
      description: 'Loom filter expression. Example: "type = \'book\'".',
    },
  },
}
```

---

## Writing a Custom Content Handler

When the factory doesn't cover your case, write the handler directly using Loom primitives:

```js
import { Loom, instantiateContent, instantiateRepeated } from '@uniweb/loom'

const loom = new Loom()

export default {
  handlers: {
    content: (data, block) => {
      const profile = data?.profile?.[0]
      if (!profile) return null

      const doc = block.rawContent?.doc ?? block.rawContent
      const source = block.properties?.source

      if (!source) return instantiateContent(doc, loom, profile)
      return instantiateRepeated(doc, loom, profile, source)
    },
  },
}
```

The content handler receives `block.parsedContent.data` as its first argument and reads raw ProseMirror from `block.rawContent`. It returns a new ProseMirror document — the framework re-parses it through the semantic parser. Returning `null` signals no change.

`instantiateContent` resolves expressions in the full document. `instantiateRepeated` splits at dividers and repeats the body per item in the named source array.

---

## Data and Props Handlers

The `data` handler runs before the content handler. Use it to reshape or filter assembled data before content transformation:

```js
handlers: {
  data: (data, block) => {
    // Merge multiple data sources into one namespace
    return { ...data.profile?.[0], ...data.settings?.[0] }
  },
}
```

The `props` handler runs last — after parsing, defaults, and content guarantees. Use it to post-process the final shape:

```js
handlers: {
  props: (content, params, block) => {
    // Add a computed field
    return {
      content: { ...content, fullName: `${content.title}` },
      params,
    }
  },
}
```

Both are rarely needed. The content handler covers most data-driven use cases.

---

## See Also

- [Data-Driven Sections](./data-driven-sections.md) -- Expressions, aggregation, and the repeat pattern
- [Working with Data](./working-with-data.md) -- Data fetching and collections
- [Foundation Configuration](../reference/foundation-config.md) -- Full main.js reference
- [Component Metadata](../reference/component-metadata.md) -- The meta.js contract
