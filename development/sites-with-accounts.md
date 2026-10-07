# Sites with Accounts

Some sites are read by everyone and edited by their author. Others have **members** — people
who sign in, have something of their own, and create content the site shows back to them. A
course catalogue where learners track progress. A conference programme the organisers edit and
attendees check into. A members' directory only members can see.

This guide is about the second kind: what to declare, how to build it before any server
exists, and how the same site behaves without one.

> **Audience:** foundation developers building components that need a signed-in visitor, and
> site developers wiring one up.

---

## This is not the same as fetching data

Two different things are easy to confuse, and they have separate guides:

| | you want | read |
|---|---|---|
| **Content** | articles, team members, a product list — the same for every visitor | [Data Sources](./data-sources.md) |
| **A `backend` service** — the site's own backend | accounts, sign-in, per-visitor data, things members create | **this guide** |

A site can have both, one, or neither. They are declared separately and nothing about one
implies the other.

---

## Declaring it

On a site you publish, one entry asks your host for the `backend` service:

```yaml
# site.yml
services:
  backend: true
```

Its address comes from your host, and components never read it. They ask
[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api), which reads it for them — so **the same
foundation works on a site with the service and on a site without it**, with no branch in your
build. A backend you run yourself is an address instead — `backend: https://your-backend.example/_api`
under `services:` — and asks your host to leave its own off.

---

## Building before the server exists

You do not need the service running to build against it. Name a local handler:

```yaml
services:
  backend: true              # in production, your host's
$devBackend: ./mock/api.js   # in `uniweb dev`, this answers it
```

```js
// mock/api.js
import { createMockBackend } from '@uniweb/api/mock'

export default createMockBackend({
  seed: {
    accounts: [
      { username: 'ada', password: 'ada', operator: true },  // runs the site
      { username: 'guest', password: 'guest' },              // a member
    ],
    // A Model's sections, so writes are checked the way production checks them —
    // `append_only` included. Who may edit an entry is enforced either way.
    schemas: {
      '@/track': {
        sections: {
          identity: { kind: 'single', brief: true, fields: { name: { type: 'string', required: true } } },
          sessions: { kind: 'multi', fields: { title: { type: 'string', required: true } } },
        },
      },
    },
    entities: [
      {
        uuid: '01926d5e-0000-7000-8000-000000000001',  // a UUID, as on the wire
        model: '@/track',
        items: [
          { section: 'identity', data: { name: 'Main hall' } },
          { section: 'sessions', data: { title: 'Opening keynote' } },
        ],
      },
    ],
  },
}).fetch
```

`uniweb dev` answers your site's `backend` service with it, at an address the dev server supplies —
your site never names one, so nothing in your foundation knows which backend it is talking to.
Because it is same-origin, sign-in cookies behave as they will in production.

Anything can sit behind `$devBackend` — a hand-written stub, recorded fixtures, your real service
running as a function. The mock above is the one that speaks this client's own dialect.

> **`$devBackend` is never published.** Keys beginning with `$` are local to your working copy and
> are stripped from the built site, so a visitor cannot reach your local handler and a build
> cannot ship it by accident.

### It enforces, so your demo cannot lie

The mock applies what your schemas declare — who may create an entry, which sections are
insert-only. A permission you are relying on fails **here**, at your desk, rather than in
front of a user. That is the part a hand-rolled fixture object usually gets wrong: it shows a
button working that production would refuse.

State is in memory. Restart to reset.

---

## Opening already signed in

A demo whose subject is the signed-in view has to *open* in it. Otherwise the first thing a
visitor meets is a login form for an account they have to be told about.

```js
export default createMockBackend({ seed, signedInAs: 'ada' }).fetch
```

The session it opens is a real one — reads are authorized, and a normal sign-out ends it. It
throws if the username is not seeded, rather than opening anonymous, because a typo otherwise
produces *"why am I not signed in?"* with no visible cause.

Development-only by construction: the whole mock module is.

---

## Writing the components

The client's own README is the reference — sessions, `useRecords`, `useEntity`,
`useEntityWriter`, the `SignedIn` / `SignedOut` gates, and how concurrency and conflicts are
handled: **[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api)**.

Two habits worth forming early, both of which the README explains in full:

**Ask whether the site has the service before you draw.** It is a synchronous read of the site's own
configuration, not a probe:

```jsx
import { isBackendEnabled } from '@uniweb/kit'
if (!isBackendEnabled()) return <StaticVersion />
```

Every site service is asked the same way — `isSearchEnabled()`, `isSubmitEnabled()`,
`isTrackingEnabled()`, `isAssistantEnabled()`. One predicate per service, no arguments, and `false`
always means the same thing: draw nothing.

**Treat "no source" and "nothing there" as different answers.** `absent` means there is no
live source — no `backend` service, or nobody signed in. `ready` with an empty list means the service
answered and there is nothing. Showing *"nothing yet"* for the first tells a visitor their
content is missing when it was never asked for.

---

## A site without the service

Remove `backend` from `services:` and the site still works. `isBackendEnabled()` answers `false`, and the features that need the service **disappear rather than break**.

⛔ **When the answer is no, draw nothing** — not a disabled button, not an explanation. A
visitor has no stake in which services the operator set up, and *"sign-in is unavailable"*
reads like a breakage when it is simply a feature this site does not have.

This is what lets one foundation serve a marketing site and a members' portal without a flag:
the components that need a session are simply not rendered on the site that has none.

---

## Where the fixture belongs

If you are building a template or a demo, the fictional tenant — the accounts, the sample
roster, the progress a learner has made — belongs in the **seed behind `$devBackend`**, not in
`site.yml` and not compiled into your foundation.

Three reasons, and the first is the one that matters:

1. **Your foundation stops knowing it is a demo.** It reads through `@uniweb/api` exactly as
   it will in production. A component that reads a config block knows; one that calls
   `useRecords()` does not.
2. **Nothing demo-shaped ships**, because `$devBackend` is stripped from the build.
3. **Deleting it gives you the empty product**, not a broken one — the degradation above is
   the same mechanism.

---

## See also

- **[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api)** — the client, in full
- [Data Sources](./data-sources.md) — content, which is a different problem
- [Site Configuration](../reference/site-configuration.md#accounts) — `services.backend` and `$devBackend:`
- The **`conference` template** is a worked example of everything above — it scaffolds with
  `services.backend`, `$devBackend:` and a `mock/` directory already wired, so you can read a working seed
  rather than assemble one:

  ```bash
  uniweb create my-event --template conference
  ```

  A programme that reads as a static site, and becomes an editable app for the people running
  the event.
