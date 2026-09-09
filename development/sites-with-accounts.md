# Sites with Accounts

Some sites are read by everyone and edited by their author. Others have **members** — people
who sign in, have something of their own, and create content the site shows back to them. A
course catalogue where learners track progress. A conference programme the organisers edit and
attendees check into. A members' directory only members can see.

This guide is about the second kind: what to declare, how to build it before any server
exists, and how the same site behaves when there is no backend at all.

> **Audience:** foundation developers building components that need a signed-in visitor, and
> site developers wiring one up.

---

## This is not the same as fetching data

Two different things are easy to confuse, and they have separate guides:

| | you want | read |
|---|---|---|
| **Content** | articles, team members, a product list — the same for every visitor | [Connecting a Backend](./connecting-a-backend.md) |
| **An app backend** | accounts, sign-in, per-visitor data, things members create | **this guide** |

A site can have both, one, or neither. They are declared separately and nothing about one
implies the other.

---

## Declaring it

One line says where your site's backend answers:

```yaml
# site.yml
api: /_api
```

Components never read this value. They ask [`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api),
which reads it for them — so **the same foundation works on a site with a backend and on a site
without one**, with no branch in your build.

---

## Building before the server exists

You do not need a running backend to build against one. Name a local handler:

```yaml
api: /_api                 # unchanged — the address is the same in production
$devApi: ./mock/api.js     # development only
```

```js
// mock/api.js
import { createMockBackend } from '@uniweb/api/mock'

export default createMockBackend({
  seed: {
    accounts: [
      { username: 'ada', password: 'ada', units: ['staff'], roles: ['member'] },
      { username: 'guest', password: 'guest', units: [] },
    ],
    // What the mock ENFORCES — who may create, and which sections are insert-only.
    schemas: { '@/session': { creatable_by: 'unit_members' } },
    entities: [
      { uuid: 'track-main', model: '@/track', data: { name: 'Main hall' },
        items: [{ id: 's1', section: 'sessions', data: { title: 'Opening keynote' } }] },
    ],
  },
}).fetch
```

`uniweb dev` mounts it at your `api:` address. Because that is **the same address production
uses**, and same-origin, nothing in your foundation knows which one it is talking to and
sign-in cookies behave as they will in production.

Anything can sit behind `$devApi` — a hand-written stub, recorded fixtures, your real service
running as a function. The mock above is the one that speaks this client's own dialect.

> **`$devApi` is never published.** Keys beginning with `$` are local to your working copy and
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

**Ask whether there is a backend before you draw.** It is a synchronous read of the site's own
configuration, not a probe:

```jsx
import { isEnabled } from '@uniweb/api'
if (!isEnabled(website)) return <StaticVersion />
```

**Treat "no source" and "nothing there" as different answers.** `absent` means there is no
live source — no backend, or nobody signed in. `ready` with an empty list means the backend
answered and there is nothing. Showing *"nothing yet"* for the first tells a visitor their
content is missing when it was never asked for.

---

## A site with no backend

Delete the `api:` line and the site still works. `@uniweb/api` answers *"there is no
backend"*, and the features that need one **disappear rather than break**.

⛔ **When the answer is no, draw nothing** — not a disabled button, not an explanation. A
visitor has no stake in which services the operator set up, and *"sign-in is unavailable"*
reads like a breakage when it is simply a feature this site does not have.

This is what lets one foundation serve a marketing site and a members' portal without a flag:
the components that need a session are simply not rendered on the site that has none.

---

## Where the fixture belongs

If you are building a template or a demo, the fictional tenant — the accounts, the sample
roster, the progress a learner has made — belongs in the **seed behind `$devApi`**, not in
`site.yml` and not compiled into your foundation.

Three reasons, and the first is the one that matters:

1. **Your foundation stops knowing it is a demo.** It reads through `@uniweb/api` exactly as
   it will in production. A component that reads a config block knows; one that calls
   `useRecords()` does not.
2. **Nothing demo-shaped ships**, because `$devApi` is stripped from the build.
3. **Deleting it gives you the empty product**, not a broken one — the degradation above is
   the same mechanism.

---

## See also

- **[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api)** — the client, in full
- [Connecting a Backend](./connecting-a-backend.md) — content, which is a different problem
- [Site Configuration](../reference/site-configuration.md#an-app-backend) — `api:` and `$devApi:`
- The **`conference` template** is a worked example of everything above — it scaffolds with
  `api:`, `$devApi:` and a `mock/` directory already wired, so you can read a working seed
  rather than assemble one:

  ```bash
  uniweb create my-event --template conference
  ```

  A programme that reads as a static site, and becomes an editable app for the people running
  the event.
