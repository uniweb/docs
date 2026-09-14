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

Role 1 falls out of that separation. If a content author is going to reference data in their page (`query: articles`), the author is the one who knows which dataset. The component that renders those articles — a `BlogList`, a `TeamGrid` — is designed to work with *any* articles-shaped data, regardless of where it came from. That's what makes it reusable across sites: it doesn't care.

So the runtime does the fetching. The author names a query — over the site's own records, or an external query declared in `queries.yml` — the runtime fetches; the component receives `content.data.articles` and renders. The component has zero domain knowledge of the backend. That's the feature.

```yaml
# pages/blog/page.yml
title: Blog
query: articles           # author says what to fetch
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

See [Working with Data](./working-with-data.md) for the mechanics — queries, what a section receives, parametric pages, whole records.

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

```text
pages/dashboard/
├── page.yml          # query: articles — Role 1: the runtime fetches this
├── 1-articles.md     # type: ArticleList — reads content.data.articles
└── 2-search.md       # type: LiveSearch, endpoint: /api/search — Role 2: fetches its own results
```

---

## Filter-in-place: the pattern that looks like Role 2 but isn't

A common source of confusion: a page fetches a query's records once (Role 1), and the user picks a filter that narrows the view. This looks like "user interaction drives a fetch," but it's *not* — the data was already loaded; the filter just reshapes what's visible.

This is the academic-metrics pattern. A site fetches its members once; a filter selector writes to `page.state`; subscribing components re-render and recompute filtered results client-side (typically with a helper like `@uniweb/core`'s `matchWhere`). No new fetch. The framework's `page.state` / `website.state` + kit hooks (`usePageState`, `useWebsiteState`) exist for exactly this.

If your filter can be satisfied by filtering the data you already have, this is the right tool. If it needs data the browser doesn't have yet, you're in Role 2 — switch to `useEffect + fetch` in a component that knows the endpoint.

---

## What the framework offers Role 2

Role 2 components are free to do whatever they want with the browser's `fetch` API, `axios`, `@tanstack/react-query`, or anything else. They're not second-class citizens and they don't need the framework's permission.

A component that fetches an address of its own can also use kit's [`useFetched`](../reference/kit-reference.md#usefetched--usecacheentry), which gives it some of the framework's plumbing:

- **The shared cache.** Two components asking for the same request share one fetch and one cache entry.
- **Response unwrapping.** `transform: 'data.items'` picks the records out of a wrapped response, the way an external query's `transform:` does.
- **Abort on unmount.** The request is cancelled when the component goes away — no `AbortController` boilerplate.

```jsx
import { useFetched } from '@uniweb/kit'

function SearchResults({ params, q }) {
  const { data, loading, error } = useFetched(
    q.length >= 2 ? { url: `${params.endpoint}?q=${encodeURIComponent(q)}`, transform: 'results' } : null,
  )
  if (loading) return <Spinner />
  if (error) return <p>{error}</p>
  return <ResultList items={data || []} />
}
```

It is an opt-in convenience, not a requirement: a component that wants full control over its own fetching remains free to reach for raw `fetch()` or anything else.

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
- **Kit's `useFetched`:** gives a Role 2 component the shared cache, response unwrapping and abort-on-unmount. Plain React works too.

---

## See also

- [Working with Data](./working-with-data.md) — Role 1 mechanics: queries, what a section receives, parametric pages, whole records.
- [Data Sources](./data-sources.md) — Role 1 beyond the site's own records: external queries, a host's live records, foundation transports.
- [Data Fetcher Architecture](../architecture/data-fetcher-architecture.md) — Dispatcher internals, cache keys, delivery paths.
