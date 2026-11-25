---
description: "Build and test a web app on your machine against the SDK's mock, the Docker Developer Edition or the published site, with no change to your code."
---

# Testing a Web App Locally

You can build and test a web app entirely on your machine. Three things can answer for its Application Engine, from the quickest to set up to the site as it runs in production:

| | what answers | use it |
| --- | --- | --- |
| **[The mock](#the-mock)** | `@uniweb/api`'s mock, in `uniweb dev`, from a seed you write | from the first screen you build |
| **[The Docker Developer Edition](#the-docker-developer-edition)** | the full Application Engine and PostgreSQL, on your machine | to see exactly what production does, before anything is live |
| **[The site as published](#the-site-as-published)** | a published site's own engine, on Uniweb or on the Developer Edition | to run your working copy against real data |

Your foundation doesn't change between them. It talks to whichever one answers through [`@uniweb/api`](./the-sdk.md), and never names an address.

---

## The mock

You don't need an engine running to build against one. Name a local handler:

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
      '@/track': {   // your foundation's own type, named as `uniweb dev` sends it
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

Install `@uniweb/api` in the site too, since the mock runs there. `uniweb dev` answers your site's `backend` service with it, at an address the dev server supplies. Your site never names one, so nothing in your foundation knows which engine it is talking to. Because it is same-origin, sign-in cookies behave as they will in production.

Anything can sit behind `$devBackend`: a hand-written stub, recorded fixtures, your own service running as a function. The mock above is the one that speaks the SDK's own dialect.

> **`$devBackend` is never published.** Keys beginning with `$` are local to your working copy and
> are stripped from the built site, so a visitor cannot reach your local handler and a build
> cannot ship it by accident.

### It enforces, so your demo cannot lie

The mock applies what production applies: who may edit an entry, which sections your schemas declare insert-only, and that the account running the site reads everyone's entries but changes them only after confirming its password. It also applies who may add entries of each type. Every type starts closed, as on the engine, until the site's [`blueprint.yml`](../reference/blueprint.md) opens it. Hand the mock that file, or a member's first create is refused ([Blueprint § In `uniweb dev`](../reference/blueprint.md#in-uniweb-dev)). A permission you are relying on fails **here**, at your desk, rather than in front of a user. That is the part a hand-rolled fixture object usually gets wrong: it shows a button working that production would refuse.

The mail the engine would send, such as a sign-up's confirmation or a password reset, is printed in the dev server's terminal, with its link on your site, so following it tries your own page.

State is in memory. Restart to reset, or give a demo a "start over" that asks the mock itself: `getClient().request('POST', '/_mock/reset')`, a route of the mock's own, which no engine answers.

### Opening already signed in

A demo whose subject is the signed-in view has to *open* in it. Otherwise the first thing a visitor meets is a sign-in form for an account they have to be told about.

```js
export default createMockBackend({ seed, signedInAs: 'ada' }).fetch
```

The session it opens is a real one: reads are authorized, and a normal sign-out ends it. It throws if the username is not seeded, rather than opening anonymous, because a typo otherwise produces *"why am I not signed in?"* with no visible cause.

It is for development only, by construction: the whole mock module is.

### Where the fixture belongs

If you are building a template or a demo, the fictional tenant (the accounts, the sample roster, the progress a learner has made) belongs in the **seed behind `$devBackend`**, not in `site.yml` and not compiled into your foundation. Three reasons, and the first is the one that matters:

1. **Your foundation stops knowing it is a demo.** It reads through `@uniweb/api` exactly as it will in production. A component that reads a config block knows; one that calls `useRecords()` does not.
2. **Nothing demo-shaped ships**, because `$devBackend` is stripped from the build.
3. **Deleting it gives you the empty product**, not a broken one, since a site with no engine draws nothing that needs one.

### What the mock leaves out

The mock is for working with no engine at hand. Where it and the engine differ, the engine is right, and some of what the engine does the mock doesn't imitate at all: public queries are not modeled, for one. Before the app goes live, run it against the real engine, on the Developer Edition or as published.

---

## The Docker Developer Edition

The Docker Developer Edition is the full Application Engine and its PostgreSQL database, run with Docker on your machine. It is free for development and doesn't expire. Each project gets an engine of its own, so what you test is what production does: sign-up and its mail, permissions, public queries, compute functions, and payments in Stripe's test mode.

There are two steps, and the CLI runs them both:

```bash
uniweb create my-app --template <a solution template>   # the project, and its engine, started
cd my-app && npm install
uniweb dev                                              # registers your types, and runs the site against the engine
```

`create` sees that the template's site asks for a `backend` service and has a `blueprint.yml`, and gives the project its engine:
1. It checks that Docker runs, and signs you in to Uniweb in your browser if you aren't. The engine is made under your handle, and you accept its licence there.
2. It starts the engine and signs the CLI in to it.
3. It names the engine in your site's `$devBackend` (see below).

The engine prints where its Admin App is and how to sign in as its owner. To add the engine to a project you already have, run `uniweb engine setup` in it.

`uniweb dev` then starts the engine if it is stopped. It registers your types with the engine when they change, sends your `blueprint.yml` the first time, and serves your site against it. The engine takes the blueprint once, as a live engine does. After that, change a setting in the engine's Admin App, or start the engine over. `uniweb engine status`, `start`, `stop` and `reset` manage it ([CLI reference](../reference/cli-commands.md#uniweb-engine)).

The CLI works with one backend at a time, and after `create` that is your engine. To go live, sign in to Uniweb again with `uniweb login`, then `uniweb publish`. Before you do, run `uniweb engine reset --yes` and check that the site still works. Your live site starts from `blueprint.yml` and your types, not from your local engine's test data.

### `uniweb dev` against an engine on your machine

`$devBackend` also takes an engine's address in place of a module. `uniweb dev` then forwards every request for your site's `backend` service to that engine:

```yaml
services:
  backend: true                          # in production, your host's
$devBackend: http://localhost:8080/api   # in `uniweb dev`, the engine at this address answers it
```

Write the whole address the engine's instructions give for its API. The page still asks its own dev server, which forwards each request, so the page talks to one origin and sign-in cookies behave as they do in production. Your foundation names its own types in full (`@acme/track`), as a build does, because the engine holds them under those names. Register them with it first (`uniweb register`, signed in to it). Records come from your record files, as they do with the mock, until you name the engine's records too (below).

If nothing answers at the address, the dev server says so with a `502` that names it.

**Public records.** An engine also serves the entries your `blueprint.yml` opens to visitors (`publicQueries:`). Name its records address beside its API, each address whole as the engine's instructions give it:

```yaml
$devBackend:
  backend: http://localhost:8080/api
  records: http://localhost:8080/<the engine's records path>/{locale}
```

With `records`, `uniweb dev` acts as your site's host. Every query a page asks is answered from your record files and the engine's public entries together, merged the way a published site's records service merges them. Entries members created then show on a page next to the records in your files. If the engine doesn't answer, a page still gets your files' records. Your site's search keeps working from its local index.

**Compute functions.** When an integration calls one of your [compute functions](./compute-functions.md), the engine asks a runner for it. With `$devBackend` set to an address, `uniweb dev` is that runner. An engine set up with `uniweb engine setup` is already pointed at it: `uniweb dev` answers its calls on a port of their own, on `127.0.0.1`, which an engine in Docker can reach. For an engine you set up yourself, choose a port, give the engine `http://host.docker.internal:<port>/_compute` as its functions address, and start `uniweb dev` with `UNIWEB_FUNCTIONS_PORT=<port>`.

Each call runs the function from your working copy, so an edit answers the next call with nothing registered again. It runs under the same rules as `uniweb compute run`. A call that takes more CPU than the platform allows is refused, as the platform refuses it. To have the runner check that each call is signed by your engine, set `UNIWEB_FUNCTIONS_KEY` to the engine's functions key before `uniweb dev`.

---

## The site as published

Once a site is published, test against it:

```bash
uniweb publish             # once: the site goes live, with its own engine
uniweb dev --published     # your working copy, against the site as published
```

Your foundation and pages are the working copy's, with live reload. The site's services are the published site's: a member signs in to its real engine and may do what it allows, and a page shows the records its visitors see. The dev server reads the addresses from the published page and forwards each request, so the page talks to one origin, and sign-in cookies behave as they do on the published site. `$devBackend` is not used.

Under `--published` your foundation names its own types in full (`@acme/track`), as a build does, so the engine answers for the types it holds. A type you add reaches it when you publish again. Record files reach the page when you `uniweb push` them.

**Public queries show here.** Entries a `blueprint.yml` opens to visitors who are not signed in (`publicQueries:`) reach a page through the site's records service, with `records: true` under `services:`. `uniweb dev` alone answers every query from your record files, so `--published` is where you see those entries before a visitor does.

⚠️ **It is the published site's real data.** What you do in the working copy reads and changes its members' entries, and `uniweb dev --published` says so when it starts. Against the Developer Edition, that data is your own.

---

## See also

- [The Application Engine](./the-application-engine.md): what the engine gives a site
- [The SDK](./the-sdk.md): `@uniweb/api`, and the habits a component needs
- [Blueprint](../reference/blueprint.md): how a site's engine starts, and the mock's copy of it
- [`uniweb dev`](../reference/cli-commands.md): every option, `--published` included
- The **`conference` template** is a worked example. It scaffolds with `services.backend`, `$devBackend:` and a seeded `mock/` directory already wired, so you can read a working seed rather than assemble one:

  ```bash
  uniweb create my-event --template conference
  ```
