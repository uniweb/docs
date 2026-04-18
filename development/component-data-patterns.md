# Component Data Patterns

Uniweb supports two different ways a component ends up with data. They look similar from a distance but answer different questions about *who knows what*:

| | Role 1 — author-driven fetching | Role 2 — component-driven fetching |
| --- | --- | --- |
| **Who knows the endpoint?** | The content author | The component |
| **Who writes the fetch?** | The site author, in `page.yml` / frontmatter | The component, in React |
| **Component's job** | Render whatever `content.data.*` arrives | Fetch its own data, render it |
| **Component's domain knowledge** | Zero — the same Hero can render any data | Full — the component knows what "search results" means |

Both are valid. Neither is better. They're different tools for different situations, and they coexist cleanly in the same site.

This page explains both, why they're separate, what to use when, and what Uniweb can (and can't) do to make Role 2 nicer.

---

## Why Role 1 exists (and why it's unusual)

Most React frameworks — Next.js, Remix, plain Vite — don't offer a runtime that lets a content author pick a URL and hands the resulting data to a component that doesn't know where it came from. Data fetching in those frameworks is always the developer's job: a component either calls `fetch()` itself or a route loader hard-coded at build time fills its props.

Uniweb is built around Component Content Architecture (CCA): a strict separation between *what the site says* and *how it's built*. Content authors — often non-developers — compose pages by choosing section types and writing markdown. Component developers — often not the same people — build reusable section types. The two roles don't share files and can't break each other's work.

Role 1 falls out of that separation. If a content author is going to reference data in their page (`data: articles`), the author is the one who knows which dataset. The component that renders those articles — a `BlogList`, a `TeamGrid` — is designed to work with *any* articles-shaped data, regardless of where it came from. That's what makes it reusable across sites: it doesn't care.

So the runtime does the fetching. The author writes `fetch: /data/articles.json` or `fetch: { url: '…' }`; the runtime fetches; the component receives `content.data.articles` and renders. The component has zero domain knowledge of the backend. That's the feature.

```yaml
# pages/blog/page.yml
title: Blog
data: articles            # author says what to fetch
```

```jsx
// ArticleList — no domain knowledge, no fetch code, no endpoint awareness
export default function ArticleList({ content, block }) {
  if (block.dataLoading) return <DataPlaceholder />
  const articles = content.data.articles || []
  return <ul>{articles.map((a) => <li key={a.slug}>{a.title}</li>)}</ul>
}
```

The component works for *any* site's articles, not just one specific backend. That's the CCA payoff. The author drives; the component is a clean consumer.

See [Working with Data](./working-with-data.md) for the mechanics — cascade, template pages, detail queries, post-processing.

---

## When Role 2 applies

The moment your component has to know about backend-specific things — a `q=` query param, a pagination cursor, a filter shape the API understands — it's not a domain-agnostic consumer anymore. It's a domain-aware component.

Examples:

- **A search box that hits a search API.** The component knows the endpoint, knows the query parameter, knows how to parse results.
- **Infinite-scroll pagination.** The component tracks its cursor and issues follow-up fetches.
- **A drill-down selector.** Pick country → fetch provinces. The component knows provinces come from `/api/provinces?country=X`.
- **A data-viz widget talking to its own analytics backend.** It knows the dimensions, the filters, the aggregation API.

Uniweb's answer for these is completely standard: **standard React.** Write a `useEffect + fetch`, manage the response in `useState`, render what you get. There is no framework mechanism between the component and the network, and there doesn't need to be.

```jsx
// Domain-aware search component — it knows what "search" means for its backend
import { useState, useEffect } from 'react'

export default function SearchBox({ params }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (q.length < 2) return
    const controller = new AbortController()
    setLoading(true)
    fetch(`${params.endpoint}?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => setResults(data.results || []))
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [q, params.endpoint])

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? <Spinner /> : <ResultList items={results} />}
    </div>
  )
}
```

No framework machinery. No dispatcher. No `page.yml` fetch config — the author didn't have anything to say about this. The component owns the interaction.

This is not second-class. It's the right tool for the job. The `agents.md` guide explicitly says: "once the runtime parses content and hands it to your component as `{ content, params }`, it's standard React." Everything a React component can do, a Uniweb component can do.

---

## How to tell which role you're in

A simple test: **does the component know what variable values to send?**

- **No — it just renders what arrives.** Role 1. Author writes `fetch:`; runtime fetches; component reads `content.data`.
- **Yes — it builds queries, tracks state, issues follow-ups.** Role 2. Component fetches its own data with standard React.

If you find yourself wanting to pass `variables` from a component into a runtime-managed re-fetch, you're trying to bridge the two roles. Don't. The moment your component knows about `variables`, it's already a Role 2 component — and Role 2 components fetch on their own. The framework doesn't need to help with that step.

---

## Both roles on the same page

A page can have sections of both kinds side by side. The runtime fetches `articles` for the top of the page; a search widget at the bottom does its own `fetch()` for live results. Nothing about Role 2 conflicts with Role 1. The runtime runs Role 1 fetches at block lifecycle; Role 2 components run their own fetches whenever their internal logic decides.

```yaml
# pages/dashboard/page.yml
data: articles            # Role 1: runtime fetches this
sections:
  - type: ArticleList     # reads content.data.articles
  - type: LiveSearch      # Role 2: fetches its own results
    params:
      endpoint: /api/search
```

---

## Filter-in-place: the pattern that looks like Role 2 but isn't

A common source of confusion: a page fetches a collection once (Role 1), and the user picks a filter that narrows the view. This looks like "user interaction drives a fetch," but it's *not* — the data was already loaded; the filter just reshapes what's visible.

This is the academic-metrics pattern. A site fetches a members collection once; a filter selector writes to `page.state`; subscribing components re-render and recompute filtered results client-side (typically with a helper like `@uniweb/query`'s `resolveQuery`). No new fetch. The framework's `page.state` / `website.state` + kit hooks (`usePageState`, `useWebsiteState`) exist for exactly this.

If your filter can be satisfied by filtering the data you already have, this is the right tool. If it needs data the browser doesn't have yet, you're in Role 2 — switch to `useEffect + fetch` in a component that knows the endpoint.

---

## What the runtime can do for Role 2 (if we want)

Role 2 components are free to do whatever they want with the browser's `fetch` API, `axios`, `@tanstack/react-query`, or anything else. They're not second-class citizens and they don't need the framework's permission.

That said, a component that's doing its own fetching may want to benefit from **some** of the framework's plumbing:

- **Shared cache across blocks.** Two components on the page fetching the same URL shouldn't each issue a request. The dispatcher's cache already exists; a kit-level `useFetch()` helper could participate in it.
- **Site-level base URL.** If `site.yml fetcher: { baseUrl: ... }` is set, components doing their own fetches could pick it up automatically so they don't hardcode an environment-dependent host.
- **Envelope unwrapping.** If the backend always wraps responses as `{ data: { items: [...] } }`, the site's `envelope:` config could apply to component-driven fetches too.
- **Abort on unmount.** Every component writes the same `AbortController` boilerplate. A helper could handle it.

None of this exists today. The open question is whether a kit helper like:

```js
import { useFetch } from '@uniweb/kit'

function SearchBox() {
  const fetch = useFetch()
  // ... same useEffect + fetch, but `fetch()` prepends baseUrl,
  // participates in the cache, and auto-aborts on unmount.
}
```

would be a useful addition. It's not designed yet. The point of mentioning it here is: **Role 2 doesn't have to mean "fully on your own."** The framework could offer ergonomics without forcing anything. If this helper ever ships, it'll be an explicit opt-in — components that want full control over their own fetching remain free to reach for raw `fetch()`, `axios`, or whatever.

For now: Role 2 components use plain React. If there's demand for a helper, we'll design one with the same care as the rest of the framework.

---

## What the runtime deliberately does NOT do

For clarity, because these come up:

- **The runtime does not re-dispatch Role 1 fetches when state changes.** `BlockRenderer` fetches once per block lifecycle. Filter reactivity is client-side filtering of already-loaded data (via `page.state` + React re-renders), not re-fetching.
- **There is no `block.refetch(variables)` method.** A component that needs to refetch with variables is a Role 2 component; it uses standard React. The framework doesn't provide a bridge between the two roles because the bridge would require the component to know backend details, which is already Role 2.
- **The runtime does not observe `page.state` for fetch inputs.** State is for UI; it doesn't trigger dispatches.

---

## Summary

- **Role 1 (author-driven):** the CCA pattern. Author writes `fetch:`, runtime fetches, domain-agnostic component reads `content.data`. This is Uniweb's distinctive offering and what makes portable foundations possible.
- **Role 2 (component-driven):** standard React. Domain-aware component fetches its own data. Fully supported; no framework machinery needed.
- **The test:** does the component know what values to send to the backend? Yes → Role 2. No → Role 1.
- **Filter-in-place:** looks like user-driven fetching but isn't. Client-side filtering of already-loaded Role 1 data via `page.state`.
- **Future ergonomics:** a kit helper for Role 2 components to participate in cache / baseUrl / envelope is possible. Not designed yet. Role 2 works fine without it.

---

## See also

- [Working with Data](./working-with-data.md) — Role 1 mechanics: cascade, template pages, detail queries.
- [Connecting a Backend](./connecting-a-backend.md) — Role 1 with a real backend; `site.yml fetcher:` options for the default fetcher.
- [Data Fetcher Architecture](../architecture/data-fetcher-architecture.md) — Dispatcher internals, cache keys, delivery paths.
