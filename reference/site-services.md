# Site Services

A **service** is a named slot for an address your site does not hardcode. Search, form
submissions, analytics, an app backend — each is a name, and whoever runs the site says where
that name answers. A component asks for the name and gets an address or nothing.

## Overview

A foundation must never name a host. Whether this site's search is answered by a downloaded
index, a server endpoint, or a vendor API is a *deployment* fact, and a component that hardcodes
it is welded to one deployment. So the address comes from configuration, and a component asks a
single question: **does this site have that service, and where does it answer?**

```yaml
# site.yml
search: /_search
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

Two tiers, and the site wins:

1. **The site**, authored — `search:`, `submit:`, `assistant:`, `tracking:` in `site.yml`. An
   operator who names an endpoint means it, including on a host that offers one of its own.
2. **The host**, served — `config.services.<name>` in the payload a host delivers. What the
   deployment offers, which the site never had to know about.

Either tier accepts a bare string or an object with an `endpoint` key:

```yaml
search: /_search                    # string shorthand
search:
  endpoint: /_search                # the same thing, with room for options
  provider: endpoint
```

An absolute URL (`https://…`, `//host/…`) is passed through — a service on another origin is not
the site's to relocate. A root-relative (`/forms`) or bare-relative (`_search`) address is joined
to the site's base path.

### Four answers, and the last two are different

`resolveService(website, name)` returns `{ url, source }`. `url` is the whole answer for acting;
`source` says which tier answered, and is worth reading when a host's value appears not to take
effect.

| `url` | `source` | means |
|---|---|---|
| an address | `'site'` | the site declared it |
| an address | `'host'` | the host offers it |
| `null` | `'host'` | **a host is answering and does not offer this service** |
| `null` | `null` | nobody declared anything — no host is speaking |

The last two both mean "no address", and a caller that only reads `url` treats them the same —
which is correct for almost every service. They differ for a caller that has a fallback of its
own, and search is the one that does: a host that publishes a services block is stating what it
offers, so a name *absent* from that block carries the same answer as a name present with no
address. Without that rule, "this host offers analytics and not search" and "there is no host at
all" would be the same value, and a site would fall back to an index its host never built.

---

## The services

The framework ships clients for these. The list grows; the registry does not gate it.

| name | answers | declared by |
|---|---|---|
| `search` | where search queries go | site or host |
| `submit` | where form submissions go | site or host |
| `tracking` | where analytics events go | site or host |
| `assistant` | where an assistant surface answers | site |
| `api` | the site's own app backend — accounts, per-visitor data, member writes | host (see below) |
| `records` | where live record queries are answered | **host only** |

Three of them deserve a note.

**`search` has a local fallback, so its absence is not the whole question.** A site can carry a
prebuilt index that needs no address at all, which is the default. That is why the question a
component asks about search is *"should I draw a search box"* rather than *"is there a search
service"* — the two differ, and [`useSearch`](./kit-reference.md) answers the first. See
[Search](../authoring/search.md).

**`api` is the one service a site does not normally author.** It has to be provisioned, so its
address arrives in the payload rather than from `site.yml`. Arriving with the site does not make
your host its provider — what answers there is a backend of its own. You *can* write `api:` in
`site.yml`: that is how a static build reaches one, and how `$devApi` mounts a local mock. See
[Sites with Accounts](../development/sites-with-accounts.md).

**`records` is invisible to foundations, deliberately.** When a provider answers it, record
queries are resolved live at the source; when it is absent, the same queries are answered by the files
the build compiled. Either way a component reads `content.data` identically, which is the whole
point — a foundation cannot tell, and never needs to. See
[Connecting a Backend](../development/connecting-a-backend.md).

---

## Reading one

**One predicate per service, no arguments.** Call it before you render UI for that service:

```jsx
import { isSearchEnabled, isSubmitEnabled, isApiEnabled } from '@uniweb/kit'

if (!isSearchEnabled()) return null      // draw nothing
```

| you are drawing | ask |
|---|---|
| a search control | `isSearchEnabled()` |
| a form | `isSubmitEnabled()` |
| anything needing a signed-in visitor | `isApiEnabled()` |
| an assistant surface | `isAssistantEnabled()` |
| anything that reports events | `isTrackingEnabled()` |

Each answers the same question — **would rendering UI for this service produce something that
works?** — and `false` always means the same thing: draw nothing.

The hooks that draw a feature also hand you the same answer as a field (`useSearch().isEnabled`,
`useFormSubmit().canSubmit`), so a component already using one needs nothing extra.

For a service the framework ships no client for, ask the site directly:
`useWebsite().website.isServiceEnabled('booking')`.

⭐ **`isSearchEnabled()` is true whenever *any* provider answers** — a server, or the prebuilt
index that needs no address at all. It is not "is there a search service": gating a search box on
that would hide it on every static site.

Every one of these is a **synchronous read of the site's own configuration**, not a network
probe. There is nothing to await and nothing to retry: the payload states what is on and what is
off, and the renderer's job is to not draw what cannot be used.

`uniweb doctor` warns when a component calls one of these hooks and never reads its gate, because
a control drawn for a service the site does not have is permanently dead.

---

## Services on a site with no host

Services are **not** a hosted-only feature, and it is worth being precise about which half needs
a host:

- **The site tier works anywhere.** A static site exported to any file host can declare
  `submit: https://forms.example.com/f/abc123` and the form submits. Same for `search`,
  `tracking` and `assistant`.
- **The host tier needs a host**, by definition — nothing stamps `config.services` onto a static
  build.
- **`records` is the exception**, and the only service a site cannot declare at all. Absent, its
  queries fall through to the files the build compiled, which is why a site with no host is the
  default case rather than a degraded one.

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
queries, and an app backend holding your members, are separate from whatever serves your HTML —
and neither is implied by your choice of host. One operator often sells several of these at once,
which is exactly why the distinction is easy to miss, and why it matters the first time one of
them is somebody else.

`search.provider` is that same word, scoped to one service: it names which provider answers
search — `index` (a downloaded index, queried in the browser), `endpoint` (a server), or a
foundation-supplied search transport.

⛔ One word that is **not** a provider or a host: **backend**. In Uniweb's vocabulary that means
the origin you select with `uniweb login --backend`.

---

## See also

- [Site Configuration](./site-configuration.md) — every `site.yml` key, including each service
- [Search](../authoring/search.md) — providers, and what a site declares
- [Receiving Form Submissions](../development/receiving-form-submissions.md) — the `submit` service end to end
- [Sites with Accounts](../development/sites-with-accounts.md) — the `api` service
- [Connecting a Backend](../development/connecting-a-backend.md) — where a site's records come from
- [Kit Reference](./kit-reference.md) — `resolveService`, `useSearch`, `useFormSubmit`
