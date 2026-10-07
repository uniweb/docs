# Site Services

A **service** is a named slot for an address your site does not hardcode. Search, form
submissions, analytics, accounts — each is a name, and whoever runs the site says where
that name answers. A component asks for the name and gets an address or nothing.

## Overview

A foundation must never name a host. Whether this site's search is answered by a downloaded
index, a server endpoint, or a vendor API is a *deployment* fact, and a component that hardcodes
it is welded to one deployment. So the address comes from configuration, and a component asks a
single question: **does this site have that service, and where does it answer?**

```yaml
# site.yml
services:
  search: true                              # your host's, or the built-in index
  submit: https://forms.example.com/f/abc123
  tracking: /_events
```

```jsx
import { resolveService } from '@uniweb/kit'

const { url } = resolveService(website, 'submit')
if (!url) return null          // this site has no form submission — draw nothing
```

The registry is **open**. `resolveService` takes a *name*, and the framework keeps no list of
permitted ones. It ships clients for what it implements; it ships resolution for anything. A
foundation that invents `booking` or `translate` gets the same precedence, the same base-path
handling, and the same absent-means-absent behaviour — and a host can fill that slot without a
framework release.

---

## The one law: presence is the switch

**A control for a service the site does not have must not be drawn.** Not a disabled button, not
an explanatory message — nothing.

This is not politeness, it is correctness. A visitor has no stake in which services the operator
set up, and *"search is unavailable"* reads like a breakage when it is simply a feature this site
does not have. Any wording for that state would be the framework's to invent, in one language,
for someone who never asked. So there is no wording: the feature is absent, the same way a site
with no `submit` has no contact form.

```jsx
const { url } = resolveService(website, 'assistant')
if (!url) return null                    // ✅ the site simply doesn't have it

if (!url) return <p>Chat is unavailable</p>   // ⛔ invents a failure that isn't one
```

---

## Who declares a service

A site says everything about its services in one place — **`services:` in `site.yml`**, one
entry per service: `true`, `false`, an address of its own, or a map of options
([Site Configuration](./site-configuration.md#site-services) has the grammar). From there, two
tiers answer a component — and where a host offers a service, the host wins:

1. **The host**, served — `config.services.<name>` in the payload a host delivers. What the
   deployment offers, which the site never had to know about. When a host offers a service, that
   is the answer: nothing the site declares overrides it.
2. **The site** — its entry in `services:`. Used for any service the host does not provide — a
   form service or a search provider of your own — and, on a static site where no host speaks, the
   whole answer.

An address comes as a string or as `endpoint:` in a map:

```yaml
services:
  search:
    provider: endpoint
    endpoint: /_search              # a search server of your own
```

**A site switches a service off with `false`**, or `enabled: false` in its map:

```yaml
services:
  submit: false                     # this site has no form submission
```

On a site you push or publish, the entry is also **what you ask your host for**: `true` asks for its
service, `false` asks it to turn its service off, and an address asks it to leave its own off so
yours answers. Your host settles the request, and its answer arrives with the site.

**A host's silence is an answer.** A host that publishes a services block is stating what it
offers, so a name it leaves out is declined, exactly as if it had named it with no address — which
is why a hosted site does not fall back to a search index its host never built. A declaration of
the site's own still answers there.

What `resolveService` returns in each of these cases, and how an address is joined to the site's
base path, is in the [Kit Reference](./kit-reference.md#resolveservice).

---

## The services

The framework ships clients for these. The list grows; the registry does not gate it.

| name | answers | declared by |
|---|---|---|
| `search` | where search queries go | site or host |
| `submit` | where form submissions go | site or host |
| `tracking` | where analytics events go | site or host |
| `assistant` | where an assistant surface answers | site or host |
| `api` | accounts, per-visitor data, member writes | host (see below) |
| `records` | where live record queries are answered | **host only** — asked for with `records: true` |

Three of them deserve a note.

**`search` has a local fallback, so its absence is not the whole question.** A site can carry a
prebuilt index that needs no address at all, which is the default. That is why the question a
component asks about search is *"should I draw a search box"* rather than *"is there a search
service"* — the two differ, and [`useSearch`](./kit-reference.md) answers the first. See
[Search](../authoring/search.md).

**`api` is the one service a site does not normally address.** It has to be provisioned, so on a
site you publish you ask for it — `api: true` under `services:` — and its address arrives in the
payload. Arriving with the site does not make your host its provider — what answers there has a
provider of its own. An address of your own is how a static build reaches a backend you run; in
`uniweb dev`, `$devApi` answers it with a local mock at an address the dev server supplies. See
[Sites with Accounts](../development/sites-with-accounts.md).

**`records` is invisible to foundations, deliberately.** When a provider answers it, record
queries are resolved live at the source; when it is absent, queries read the files the build
compiled. On a static site that is every query. A host that delivers records live delivers those
with a data schema only through `records`, so a site it publishes asks for it — `records: true`
under `services:` — or its pages show none of them. Either way a component reads `content.data`
identically, which is the whole point — a foundation cannot tell, and never needs to. See
[Data Sources](../development/data-sources.md).

---

## Reading one

**One predicate per service, no arguments.** Call it before you render UI for that service, and
when it answers `false`, draw nothing:

```jsx
import { isSearchEnabled } from '@uniweb/kit'

if (!isSearchEnabled()) return null
```

| you are drawing | ask |
|---|---|
| a search control | `isSearchEnabled()` |
| a form | `isSubmitEnabled()` |
| anything needing a signed-in visitor | `isApiEnabled()` |
| an assistant surface | `isAssistantEnabled()` |
| anything that reports events | `isTrackingEnabled()` |

For a service the framework ships no client for, ask the site directly:
`useWebsite().website.isServiceEnabled('booking')`.

⭐ **`isSearchEnabled()` is true whenever *any* provider answers** — a server, or the prebuilt
index that needs no address at all. It is not "is there a search service": gating a search box on
that would hide it on every static site.

What each predicate reads, and the hook fields that carry the same answer, are in the
[Kit Reference](./kit-reference.md#service-predicates).

---

## Services on a site with no host

Services are **not** a hosted-only feature, and it is worth being precise about which half needs
a host:

- **The site tier works anywhere.** A static site exported to any file host can declare
  `submit: https://forms.example.com/f/abc123` under `services:` and the form submits. Same for
  `search`, `tracking` and `assistant`.
- **The host tier needs a host**, by definition — nothing stamps `config.services` onto a static
  build.
- **`records` is the exception**: a site asks its host for it, with `records: true`, and cannot
  give an address of its own. With no host, its queries read the files the build compiled, which is
  why a site with no host is the default case rather than a degraded one.

Deleting every service declaration leaves a site that still works. The features that needed one
disappear; nothing breaks.

---

## Services, providers and hosts

Three words, three levels, and a real sentence needs all three:

- A **service** is *where* something is answered — the named slot.
- A **provider** is *who or what supplies it*. Often your host; sometimes a third party, like a
  form service you signed up for; sometimes the site itself — search's prebuilt index provides
  search with no server at all.
- A **host** is *who serves the site*. A host is usually the provider of several services, but
  the words are not synonyms: a host serves the site, a provider supplies one service.

> Your host provides `search` and `tracking`. `submit` is provided by a form service you chose.
> The `index` provider answers search queries from a file the build emitted.

⛔ **`records` and `api` normally have providers of their own.** Something answering live record
queries, and something holding your members' accounts, are separate from whatever serves your HTML —
and neither is implied by your choice of host. One operator often sells several of these at once,
which is exactly why the distinction is easy to miss, and why it matters the first time one of
them is somebody else.

`search.provider` is that same word, scoped to one service: it names which provider answers
search — `index` (a downloaded index, queried in the browser), `endpoint` (a server), or a
foundation-supplied search transport.

⛔ One word that is **not** a provider or a host: **backend**. In Uniweb's vocabulary that means
the origin you select with `uniweb login --server`.

---

## See also

- [Site Configuration](./site-configuration.md) — every `site.yml` key, including each service
- [Search](../authoring/search.md) — providers, and what a site declares
- [Receiving Form Submissions](../development/receiving-form-submissions.md) — the `submit` service end to end
- [Sites with Accounts](../development/sites-with-accounts.md) — the `api` service
- [Data Sources](../development/data-sources.md) — where a site's records come from
- [Kit Reference](./kit-reference.md) — `resolveService`, `useSearch`, `useFormSubmit`
