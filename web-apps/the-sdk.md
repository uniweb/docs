---
description: "@uniweb/api is the SDK for a site's Application Engine: React hooks to sign members in, read and write their entries, share them and take payments."
---

# The SDK: `@uniweb/api`

`@uniweb/api` is the SDK for a site's [Application Engine](./the-application-engine.md). Your
section types use it to sign members in, read and write their entries, share them, take payments
and show each member's inbox, as React hooks. Your foundation writes no routes, tokens or fetch
code: the SDK holds the engine's API, and the engine's address comes from the site's host.

This page covers what a site declares, the habits a component needs, and how the same foundation
behaves on a site with no engine. To run it all on your machine, see
[Testing a Web App Locally](./testing-locally.md).

> **Audience:** foundation developers building components for signed-in members, and site
> developers wiring the engine up. A whole solution (public pages, a members' area and your own
> admin area) is put together in [Building a Solution](./building-a-solution.md).

---

## This is not the same as fetching data

Two different things are easy to confuse, and they have separate guides:

| | you want | read |
|---|---|---|
| **Content** | articles, team members, a product list — the same for every visitor, from the site's files or live from Uniweb App | [Data Sources](../development/data-sources.md) |
| **The site's Application Engine** — the `backend` service | accounts, sign-in, per-visitor data, things members create | **this guide** |

A site can have both, one, or neither. They are declared separately and nothing about one
implies the other.

---

## Declaring it

On a site you publish, one entry asks your host for the site's engine, the `backend` service:

```yaml
# site.yml
services:
  backend: true
```

On Uniweb hosting, the site's first publish with it provisions the engine: a dedicated Application
Engine deployment, with its own PostgreSQL database. `blueprint.yml`, beside `site.yml`, says how
it starts ([Blueprint](../reference/blueprint.md)).

The engine's address comes from your host, and components never read it. They ask
[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api), which reads it for them — so **the same
foundation works on a site with an engine and on a site without one**, with no branch in your
build. An engine you run yourself is an address instead — `backend: https://your-backend.example/_api`
under `services:` — and asks your host to leave its own off.

---

## Building before the engine exists

You don't need an engine running to build against one. Under `uniweb dev`, `$devBackend` names a
local handler, such as the mock `@uniweb/api` ships, which enforces the permissions the engine
enforces. The Docker Developer Edition runs the real engine on your machine, and
`uniweb dev --published` runs your working copy against a published site's engine.
[Testing a Web App Locally](./testing-locally.md) covers all three.

---

## Writing the components

The SDK's own README is the reference — sessions, `useRecords`, `useEntity`,
`useEntityWriter`, the `SignedIn` / `SignedOut` gates, and how concurrency and conflicts are
handled: **[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api)**.

Habits worth forming early, each of which the README explains in full:

**Ask whether the site has an engine before you draw.** It is a synchronous read of the site's own
configuration, not a probe:

```jsx
import { isBackendEnabled } from '@uniweb/kit'
if (!isBackendEnabled()) return <StaticVersion />
```

Every site service is asked the same way — `isSearchEnabled()`, `isSubmitEnabled()`,
`isTrackingEnabled()`, `isAssistantEnabled()`. One predicate per service, no arguments, and `false`
always means the same thing: draw nothing.

**Treat "no source" and "nothing there" as different answers.** `absent` means there is no
live source — no engine, or nobody signed in. `ready` with an empty list means the engine
answered and there is nothing. Showing *"nothing yet"* for the first tells a visitor their
content is missing when it was never asked for.

**Finish the links the engine mails where they land.** A sign-up's confirmation, a password
reset and an invitation each arrive as a link to the site's home page, a token in the address.
A component the home page renders — a header or a layout is on every page — calls
`useMailedLink()`, which says which step the link came for and finishes it.

**Let an administrator act only after confirming it is them.** On a site, an administrator
reads what their role reaches and changes nothing through it until they confirm their password;
then, for a while, they act through the role. `useElevation()` says whether to offer that,
does it, and says until when it lasts — draw the controls that remove or change other people's
content from it, and ask each record what the viewer may do to it.

**Offer each action only to who it will succeed for.** `useMayCreate({ schemas })` says
whether the viewer may create an entry of each type, and `mayDo(entry, 'edit')` what they
may do to one entry — now, once they confirm it is them, or not — so *New course* shows to
the teachers and *Grade* to whoever may change a submission. Ask; never guess from roles.

**Let members write rich text with the editor that writes what is stored.**
`@uniweb/api/rich-text` gives a TipTap editor whose document model is the framework's stored
rich-text vocabulary, so nothing a member writes is lost on save, and a text written anywhere
else loads whole. It underlines, raises and lowers text, for CO₂ and m², and `richTextLength(doc)`
counts a text as a field's `max_length` does, for a counter that says what a save will. Your
toolbar draws it, in your words.

**Show the invitations waiting, wherever a member lands.** An invitation to join an
organization waits for the member's answer, whether it was sent to their account or taken
up from a mailed link. `useInvitations()` lists the ones waiting and answers them — draw it
for anyone signed in, not only after a link, since an invitation sent to an account comes
with no link to follow.

**Let people give access to what they own.** Whoever administers an entry — its owner, or
someone given `admin` on it — can give other people `read`, `edit` or `admin` on it, and take
it back. An instructor enrols students in a course this way; you name it as your solution
does — "enrolled", "course staff". `useAccess({ schema, uuid })` lists who holds what and gives
and takes it; for everyone else it answers `forbidden`, the ordinary answer, so draw nothing.

**Land what a member creates where it belongs.** Everything a member creates lands at the
root of the organization the site's engine is founded with, unless the create names one of
its units — a department, a course. `useUnits()` lists the ones the viewer is placed in, and
`createEntity({ …, unit })` lands an entry in one.

**Make each new entry once.** A second click on *Add*, or a retry after an answer that never
came, makes a second entry, unless the create names the entry's own `uuid`. Make it with
`uuidv7()` when the person starts adding the entry, and pass it to every create of it: a repeat
then answers with the entry the first one made.

**Give members a form for their entries.** `useEntityForm({ schema, uuid })` makes the form for adding
or editing an entry from its type, as an `@std/form` definition, so your foundation draws it with the
same component it draws every form with. Its `save` checks the type's rules, puts each problem by its
field, and writes the entry.

**Let members upload their files.** `useUpload({ entity })` uploads what a member picked, for an
entry they can edit, and answers the address to store in it. Each file is prepared in the browser
first: a photo goes up as a smaller WebP, turned upright, and nothing goes up with the place it was
taken or the camera that took it.

**Sell what the site sells.** The owner sets the store's offerings in the Solution Owner
Console; `useStore()` reads them, with whether the viewer owns each, and its
`checkout` sends the buyer to pay — or takes a free offering at once. A purchase lets the
buyer read what they bought. `useEntitlements()` lists what a member holds.

**Show the prices to everyone.** A visitor who isn't signed in sees the store's prices
through a site query on the store's catalog, `@uniweb/catalog`, which the site's
`blueprint.yml` opens to visitors (`publicQueries`). A section that declares it receives each
catalog with its offerings and prices, and the first page a visit lands on already shows them.
It needs the site's engine and its live records.

**Tell a member what concerns them.** `useNotifications()` reads their inbox: the unread
count for a badge, and the rows — an entry shared with them, an invitation — when they open it.

**Build your own admin area; leave the rest to the Solution Owner Console.** The people who run
your solution work in an admin area you build, in its own words. The engine's own administration —
the Solution Owner Console, the same for every solution — keeps what every solution has: the
payment account, the teams and who is in them, roles, coupons. Its link is `adminHref` from
`useSession()`.

---

## A site without an engine

Remove `backend` from `services:` and the site still works. `isBackendEnabled()` answers `false`, and the features that need the engine **disappear rather than break**.

⛔ **When the answer is no, draw nothing** — not a disabled button, not an explanation. A
visitor has no stake in which services the operator set up, and *"sign-in is unavailable"*
reads like a breakage when it is simply a feature this site does not have.

This is what lets one foundation serve a marketing site and a members' portal without a flag:
the components that need a session are simply not rendered on the site that has none.

---

## See also

- [The Application Engine](./the-application-engine.md) — what the engine gives a site, and where your logic runs
- [Building a Solution](./building-a-solution.md) — the parts of a site that is also an app, step by step
- [Testing a Web App Locally](./testing-locally.md) — the mock, the Docker Developer Edition, and the site as published
- **[`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api)** — the SDK's own reference, in full
- [Data Sources](../development/data-sources.md) — content, which is a different problem
- [Site Configuration](../reference/site-configuration.md#accounts) — `services.backend` and `$devBackend:`
- The **`conference` template** is a worked example of everything above — it scaffolds with
  `services.backend`, `$devBackend:` and a `mock/` directory already wired, so you can read a working seed
  rather than assemble one:

  ```bash
  uniweb create my-event --template conference
  ```

  A programme that reads as a static site, and becomes an editable app for the people running
  the event.
