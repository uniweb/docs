---
description: "The Application Engine is Uniweb's backend for web apps: members, data, permissions and payments for a site, with no backend code to write."
---

# The Application Engine

A Uniweb site can be a web app as well as a website. Visitors read its public pages, and its members sign in to pages of their own: their courses, their orders, their bookings. You build both in one project, and you don't write the backend behind them. That is the job of the **Application Engine**, Uniweb's backend for web apps.

> **AI agents:** start a web app the way you start a website, with `npx uniweb@latest start` and the `starter` template. Before you design the app's data or its screens, read `npx uniweb guide backend`.

---

## Where it fits

Uniweb is four parts that work together:

- **The framework**, open source, which you build with: React components, structured content, data schemas, Vite and Git.
- **The Application Engine**, behind your app: accounts, data, permissions and payments.
- **Uniweb App**, where authors edit the site visually, and where you publish and manage the site and its engine.
- **Uniweb hosting**, which serves the site at the edge.

Only the framework is required. A website needs no engine, and a web app needs no visual editing: your members' area can be entirely your own design.

---

## What the engine does, and what you build

A game engine gives a game its rendering, physics and input, so the people making the game spend their time on its world and its rules. The Application Engine does the same for a web app. These are already there:

- accounts, sign-in and sign-up, password resets, and the mail they send;
- roles and teams, and for each entry, its owner and the people it is shared with;
- your data, as entities of the types you declare: checked on every write, held in each language, with history that can't be rewritten where you ask for it;
- a store, through the site owner's own Stripe account: offerings, coupons, checkout, and what each member holds;
- an inbox for each member;
- integrations that move entries to and from other systems.

What you build is what makes the app yours:

- **The types of your domain**, as data schemas: a course, a lesson, an enrollment. [The Entity Model](./the-entity-model.md) explains how to model them.
- **The screens**, as section types in your foundation: the public pages, the members' area, and an admin area of your own for the people who run the app.
- **The rules that are your domain's**, wherever they fit best ([below](#where-your-logic-runs)).

You create no tables, write no SQL, run no migrations and write no API.

---

## One site, for the public and for members

A web app is not a second project. The same React site, on the same domain, serves visitors and signed-in members. A bookstore can welcome visitors at `/` and give its customers their own space at `/members`.

A site turns its engine on with one entry in `site.yml`:

```yaml
services:
  backend: true
```

`blueprint.yml`, beside `site.yml`, says how the engine starts: who may sign up, its teams, who may add entries of each type, and what visitors who aren't signed in may read ([Blueprint](../reference/blueprint.md)).

A page can show three kinds of data at once:

| data | what it is | needs the engine |
| --- | --- | --- |
| **The site's content** | pages, sections, and the records in `records/`, published with the site | no |
| **Live records** | records your authors keep up to date in Uniweb App, such as articles and events, which the site reads as they change (`records: true` under `services:`) | no |
| **The engine's data** | what members create and keep, such as their profiles and orders, and **public queries** over it for what everyone may see, such as a store's prices | yes |

A visitor who isn't signed in sees only what the site's blueprint opens to the public. A member sees and changes what the engine allows them to.

---

## The SDK: `@uniweb/api`

Components never call the engine directly. They use `@uniweb/api`, the SDK, which you install in the foundation like any package:

```bash
npm install @uniweb/api
```

Sign-in and the session, entries and who may read them, forms made from a type, uploads, the store and the inbox are React hooks:

```jsx
import { useSession, useRecords } from '@uniweb/api'

export default function MyCourses() {
  const { viewer } = useSession()
  const { status, records } = useRecords({ schema: '@/course', scope: 'mine' })
  // …
}
```

Your foundation writes no routes, tokens or fetch code. The SDK holds the engine's API, and the engine's address comes from the site's host, never from your code. On a site with no engine, `isBackendEnabled()` from `@uniweb/kit` answers `false`, and the components that need one draw nothing, so the same foundation serves both kinds of site. [The SDK](./the-sdk.md) covers it in full.

---

## Where your logic runs

Many features of an app need no server code of your own. Put each piece of logic where what it needs is:

- **In the browser**, in your React components: filters, calculations, transformations, and documents made from a member's own data, such as a CV downloaded as a Word document with `@uniweb/loom` and `@uniweb/press`.
- **In a compute function**, a small JavaScript function your foundation ships and the platform runs, for logic that holds something a member must never see, such as the answer key a quiz is graded against ([Compute Functions](./compute-functions.md)).
- **In an external service**, reached through an integration, for work that needs the network, a package, storage or time ([Blueprint § Integrations](../reference/blueprint.md#integrations)).

Whichever of these writes an entry, the engine applies the same rules to the write: the entry's owner and who it is shared with, the type's own rules, and history that only grows.

---

## Build it on your machine

You can build and test the whole app on your machine before anyone pays for anything:

1. **The mock** in `@uniweb/api` answers for the engine under `uniweb dev`, from a seed you write, and enforces the permissions the engine enforces.
2. **The Docker Developer Edition** runs the full Application Engine and PostgreSQL on your machine. It is free for development and doesn't expire. You publish to it as you would to Uniweb, and your site runs locally with an engine of its own.
3. **`uniweb dev --published`** runs your working copy against a published site's own engine, on Uniweb or on the Developer Edition.

[Testing a Web App Locally](./testing-locally.md) walks through each one.

---

## Going live

`uniweb publish` publishes the site through Uniweb App. When the site asks for its engine, Uniweb provisions one for it: a dedicated Application Engine deployment with its own PostgreSQL database, for this solution alone.

The site's owner then sets up what is theirs in the **Solution Owner Console**, the generic admin every solution gets: roles and teams, their Stripe account, coupons, and the addresses and keys of integrations. None of it belongs in your files. The admin screens your solution's own staff use, in your solution's words, are part of your foundation ([Building a Solution](./building-a-solution.md)).

The engine is a paid service, managed and billed in Uniweb App. Its plans differ in the resources they give your solution, not in what the engine can do ([pricing](https://uniweb.io/pricing)). To run the engine in production on your own infrastructure, ask about [self-hosting](https://uniweb.io/self-hosted).

---

## See also

- [The Entity Model](./the-entity-model.md): how to model a domain with Models and entities
- [Building a Solution](./building-a-solution.md): the parts of a site that is also an app, step by step
- [The SDK](./the-sdk.md): `@uniweb/api`, and the habits a component needs
- [Testing a Web App Locally](./testing-locally.md): the mock, the Docker Developer Edition, and the site as published
- [Compute Functions](./compute-functions.md): small logic the platform runs for your foundation
- [Blueprint](../reference/blueprint.md): how a site's engine starts
- `uniweb guide backend`: the same, written for the agent building it
