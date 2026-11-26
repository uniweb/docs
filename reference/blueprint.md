---
description: "blueprint.yml says how a site's Application Engine starts: who may sign up, its teams, who reads and writes each type, and its integrations."
---

# Blueprint

`blueprint.yml` sits beside `site.yml` in a site that has its own
[Application Engine](../web-apps/the-application-engine.md), the
[`backend` service](./site-configuration.md#accounts). It says how the engine started for the site
begins: who may create an account, its teams, who adds entries of each type and who reads or edits
all of them, what visitors may read, and the integrations it starts with.

```yaml
# site/blueprint.yml
signup: invite_only

teams:
  sales: { label: Sales }
  service: { label: Service }
  paid-members:                  # whoever holds a membership, bought or subscribed
    label: Paid members
    joins: { holds: ['@/membership'] }

access:
  '@/vehicle':
    add: [sales]                 # Sales adds vehicles
    all: { sales: edit }         # …and reads and edits every one, not only its own
  '@/store':
    add: []                      # nobody but the account that runs the site
    all: { members: read }       # every member reads every store

publicQueries:
  '@/vehicle': { whole: true, where: { status: { in: [available, pending] } } }
  '@/store': { whole: true }

integrations:
  meta-catalog: { label: Meta catalog, mapping: '@/vehicle-to-meta', channel: feed, trigger: on_fetch, enabled: true }
  dms-sold:     { label: Sold to the DMS, mapping: '@/vehicle-to-dms', channel: http, trigger: on_match,
                  filter: { where: { status: sold } } }
```

## Every type starts closed

When a backend is started for a site, every type it installs starts closed: the data schemas of
the site's foundations, its primary foundation and each extension. Only the account that runs the
site adds entries of a closed type. A blueprint opens what the site's members or its teams create,
and a type the file doesn't list stays closed.

One entry is still protected by the entry itself: its owner edits it, and shares it as they choose.
The blueprint says who may *add* entries of a type, and who reads or edits *every* entry of it.

## The keys

| key | holds | means |
|---|---|---|
| `signup` | `open` · `invite_only` | who may create an account: anyone, or only someone invited. Absent: `open` |
| `teams` | `<id>: { label, joins? }` | the teams the backend begins with, each one empty. The id is how `access` names the team: lowercase letters, digits and dashes, never `members`. `label` is the team's name, the id when absent, and no two teams share one. `joins` is who the engine keeps in the team ([below](#a-team-the-engine-keeps-by-condition)) |
| `access` | `<type>: { add?, all? }` | `add`: `open` lets every signed-in account add entries of the type; a list of teams lets those teams add them; `[]` lets nobody but the account that runs the site. `all`: `<team or members>: read` or `edit`, over every entry of the type, not only one's own. A type not listed, or an `add` not given, stays closed |
| `publicQueries` | `<type>: { whole, where?, sort?, limit? }` | visitors who aren't signed in may read the type's entries. `whole` is required: `true` for whole entries, `false` for their briefs. `where`, `sort` and `limit` narrow them, in the language of [queries](./queries.md) |
| `integrations` | `<id>: { mapping, channel, trigger, label?, filter?, enabled?, reply?, reply_about?, vendor? }` | what the backend starts connected to; see [Integrations](#integrations) |

A type is named as your foundation names it: `@/vehicle` for its own, and the full name for any
other (`@std/person`). A push sends each one in full, in your foundation's scope. While your
foundation has no scope yet, a push sends `@/vehicle` as written, and says so.

A team's `edit` reaches every entry once its member confirms it is them: until then, a session
holds what a team gives it as a reader. `members: edit`, and a team's `add`, need no confirming.

Who is put in a team is never the file's, and neither are roles. They belong to people, and when a
backend starts, no one is there but the site's owner.

## A team the engine keeps by condition

`members` in `access` is everyone with an account. A group that has paid, such as a club's members
or a newsletter's subscribers, is a team the engine keeps by **condition**:

```yaml
teams:
  paid-members:
    label: Paid members
    joins: { holds: ['@/membership'] }
access:
  '@/photo': { add: [paid-members] }    # paid members post photos
```

- **`holds`** lists types. Whoever holds a record of one of them, bought or by a live
  subscription, is in the team, and leaves it when the subscription lapses or the purchase is
  refunded. A list means *any of*: `['@/membership', '@/pass']`. A record given as a gift doesn't
  count.
- **The owner can still put someone in by hand**, an honorary member, and either reason keeps
  them in.
- **The file names types only**, since no record exists when a backend starts. A condition on
  one record ("holds the Annual membership"), and which teams may buy an offering, are set in
  the Admin App.
- **A site never learns which teams the viewer is in.** It asks what they may do, and a team's
  members get different answers: whether they may add a type (`useMayCreate`), what each
  entry allows (`mayDo`), and whether they may buy an offering (`offeringState` reads
  `'not-eligible'` when the owner sells it only to teams they aren't in, and `who_may_buy` holds
  the owner's own words, such as "Members only").

`joins` takes `holds` alone for now. A uuid in it, or any other key, is refused.

## Integrations

An integration moves entries of one type to or from another system, through one of your
foundation's **mappings**. A mapping says how a vendor's file translates to and from a type, such
as a catalog feed's CSV from `@/vehicle`. It is a file in the foundation's `src/mappings/`, one per
file, named by the file, the same way `src/schemas/` holds data schemas:

```yaml
# foundation/src/mappings/vehicle-to-meta.yml
label: Meta catalog
model: '@/vehicle'            # the type it translates
direction: out                # in | out
shape: list                   # list | document
format: { type: csv }
key: id
keys_from: '@/dms-inventory'  # optional: another of the foundation's mappings
fields:
  - { title: listing.title }
  - { vin: listing.vin }
```

A mapping can also read related entries through `follow`, a list of one-entry maps, each naming
an alias. A line that names a `model` finds entries of that type, and its `model` is named as the
mapping's own `model` is:

```yaml
follow:
  - { quiz: { field: identity.quiz_ref } }
  - { key:  { model: '@/quiz-key', field: identity.quiz, names: quiz } }
```

A mapping several foundations use can live in a library they share instead, and each foundation
that carries it names it in its `main.js` ([Libraries → Mappings in a library](../development/libraries.md#mappings-in-a-library));
a line then names it in full, `mapping: '@acme/vehicle-to-meta'`.

Everything a mapping may say, and what `register` refuses, is in [Mappings](./mappings.md).

`uniweb register` registers a foundation's mappings with it, each type a mapping names written in
full, in the foundation's scope. A foundation build refuses a mapping that names no `model`, or
names a type (its `model`, or a `model` in `follow`) or a `keys_from` mapping of its own that it
doesn't define. The backend judges the rest of the mapping when the foundation registers.

Each integration line in `blueprint.yml` takes:

| key | means |
|---|---|
| `mapping` | required: the mapping, as the foundation names it (`@/vehicle-to-meta`), sent in its scope |
| `channel` | `file`, `feed`, `email` or `http` |
| `trigger` | `file` runs `manual`; `feed` runs `on_fetch`; `email` and `http` run `on_create`, `on_match`, `on_change` (once for each change a person makes) or `manual` |
| `label` | its name; the id when absent. The id is lowercase letters, digits and dashes |
| `filter` | which entries it acts on, `{ where: … }` in the language of [queries](./queries.md) |
| `enabled` | `true` starts a `file` or `feed` integration switched on, or an `http` one that names a `vendor`. Leave it out for `email` and other `http` lines: the site's owner gives their address in the Solution Owner Console and switches them on there |
| `reply` | `http` only: a mapping, named as `mapping` is, through which the endpoint's answer is written back ([Mappings § An `http` reply](./mappings.md#an-http-reply): a `list` reply takes no `path`) |
| `reply_about` | with a `reply` that writes a list of entries: the field of the reply's type (`section.field`, such as `identity.submission`) that the backend fills with the entry it sent. Nothing in it is a type, so it is sent as written |
| `vendor` | `http` only: a function the platform runs in place of an address, `'@/courses#grade'`: a compute file the site's foundations carry, named as `mapping` is, then `#` and the function it exports. See [Compute Functions](../web-apps/compute-functions.md) |

An address, a URL or a key is never the file's: any other key on a line is refused.

## When it applies

Once, when an engine is started for the site. That can be the site's own engine, the engine of a
site copied from it when it is a template, or an engine started again after the site's was
destroyed. After that, the site's owner changes these settings in the Solution Owner Console, and
those changes are what the engine holds. An edited file is still checked and carried with each
push and pull, but it reaches no backend that is already running. Once the site's backend has
started, `uniweb push` and `uniweb publish` say so when they send a changed file, and
`uniweb status` says it too.

## What is checked, and where

- **A build, a push and `uniweb doctor` refuse a file that isn't a blueprint**, naming the key.
  That includes an unknown key, a level other than `read` or `edit`, a team the file doesn't found
  and a public query without `whole`. A push carrying one is refused whole, content included.
- **A type or a mapping none of the site's foundations declares only warns.** A backend started
  for the site leaves that line out, and the publish that started it says so.
- **`where`, `sort` and `limit` are the backend's to judge**, against the types as it holds them.
  A public query it can't serve is left out the same way, and named.
- `blueprint.yml` needs `site.yml` to name the `backend` service. The blueprint is a file of its
  own: a `blueprint` key under `services.backend` is refused.

A static build carries nothing of the file, since there is no backend to start. A pull writes it
back to `blueprint.yml`, never into `site.yml`, and a pull of what you pushed changes no file.

## In `uniweb dev`

The mock `@uniweb/api` ships starts the same way: every type closed until the blueprint
opens it, with its sign-up mode and its teams. Hand it the site's blueprint:

```js
// site/mock/api.js
import { fileURLToPath } from 'node:url'
import { createMockBackend } from '@uniweb/api/mock'
import { readBlueprint } from '@uniweb/build/blueprint'
import { seed } from './seed.js'

const blueprint = readBlueprint(fileURLToPath(new URL('..', import.meta.url)))
export default createMockBackend({ seed, blueprint }).fetch
```

A seeded account names the teams it is in, since the file never does:
`{ username: 'sally', password: 'sally', teams: ['sales'] }`. A team with `joins` also holds
every seeded account holding a record of its types (`entitlements: [{ username, entity }]`), and
a seeded offering may take `buyable_by: ['paid-members']` and `who_may_buy`. Public queries are not modelled there: run the
site on the Docker Developer Edition, or against the site as published, to see them
([Testing a Web App Locally](../web-apps/testing-locally.md)).

The `conference` template is a worked example. The organiser adds the programme's tracks, every
member reads them, and each attendee keeps their own attendance:

```bash
uniweb create my-event --template conference
```

## See also

- [Site Configuration](./site-configuration.md#accounts) — the `backend` service, and `$devBackend`
- [Building a Solution](../web-apps/building-a-solution.md) — a site whose members sign in, step by step
- [Testing a Web App Locally](../web-apps/testing-locally.md) — the mock, the Docker Developer Edition, and the site as published
- [Data Schemas](../development/data-schemas.md) — the types a blueprint and a mapping name
