# Blueprint

`blueprint.yml` sits beside `site.yml` in a site that has its own backend, the
[`backend` service](./site-configuration.md#accounts). It says how a backend started for the site
begins: who may create an account, its teams, who adds entries of each type and who reads or edits
all of them, and what visitors may read.

```yaml
# site/blueprint.yml
signup: invite_only

teams:
  sales: { label: Sales }
  service: { label: Service }

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
| `teams` | `<id>: { label }` | the teams the backend begins with, each one empty. The id is how `access` names the team: lowercase letters, digits and dashes, never `members`. `label` is the team's name, the id when absent, and no two teams share one |
| `access` | `<type>: { add?, all? }` | `add`: `open` lets every signed-in account add entries of the type; a list of teams lets those teams add them; `[]` lets nobody but the account that runs the site. `all`: `<team or members>: read` or `edit`, over every entry of the type, not only one's own. A type not listed, or an `add` not given, stays closed |
| `publicQueries` | `<type>: { whole, where?, sort?, limit? }` | visitors who aren't signed in may read the type's entries. `whole` is required: `true` for whole entries, `false` for their briefs. `where`, `sort` and `limit` narrow them, in the language of [queries](./queries.md) |

A type is named as your foundation names it: `@/vehicle` for its own, and the full name for any
other (`@std/person`). A push sends each one in full, in your foundation's scope. While your
foundation has no scope yet, a push sends `@/vehicle` as written, and says so.

A team's `edit` reaches every entry once its member confirms it is them: until then, a session
holds what a team gives it as a reader. `members: edit`, and a team's `add`, need no confirming.

Who is in a team is never the file's, and neither are roles. They belong to people, and when a
backend starts, no one is there but the site's owner.

## When it applies

Once, when a backend is started for the site. That can be the site's own backend, the backend of a
site copied from it when it is a template, or a backend started again after the site's was
destroyed. After that, the site's owner changes these settings in the backend's administration, and
those changes are what the backend holds. An edited file is still checked and carried with each
push and pull, but it reaches no backend that is already running.

## What is checked, and where

- **A build, a push and `uniweb doctor` refuse a file that isn't a blueprint**, naming the key.
  That includes an unknown key, a level other than `read` or `edit`, a team the file doesn't found
  and a public query without `whole`. A push carrying one is refused whole, content included.
- **A type none of the site's foundations declares only warns.** A backend started for the site
  leaves that line out, and the publish that started it says so.
- **`where`, `sort` and `limit` are the backend's to judge**, against the types as it holds them.
  A public query it can't serve is left out the same way, and named.
- `blueprint.yml` needs `site.yml` to name the `backend` service. The blueprint is a file of its
  own: a `blueprint` key under `services.backend` is refused.

A static build carries nothing of the file, since there is no backend to start. A pull writes it
back to `blueprint.yml`, never into `site.yml`, and a pull of what you pushed changes no file.

## In `uniweb dev`

The local backend `@uniweb/api` ships starts the same way: every type closed until the blueprint
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
`{ username: 'sally', password: 'sally', teams: ['sales'] }`. Public queries are not modelled there.

The `conference` template is a worked example. The organiser adds the programme's tracks, every
member reads them, and each attendee keeps their own attendance:

```bash
uniweb create my-event --template conference
```

## See also

- [Site Configuration](./site-configuration.md#accounts) — the `backend` service, and `$devBackend`
- [Sites with Accounts](../development/sites-with-accounts.md) — building a site whose members sign in
- [Data Schemas](../development/data-schemas.md) — the types a blueprint names
