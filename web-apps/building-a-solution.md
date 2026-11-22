---
description: "A solution is a site that is also a web app: public pages, members' own pages and an admin area, in one foundation on the Application Engine."
---

# Building a Solution

A **solution** is a site that is also a web app. Visitors read its public pages. Its members sign in to pages of their own — a learner's courses, a client's orders — and the people who run it work in an admin area made for what it does. All of it is built in one foundation, on the site's own [Application Engine](./the-application-engine.md): the `backend` service under `services:`.

You don't write the server. Accounts, sign-in, roles, each member's entries and who may read them, a store, an inbox, and integrations with other systems are already there in the engine. Your foundation declares what the app needs and draws every screen people use.

> **Audience:** developers, and the agents working for them, building a site where people sign in. [The SDK](./the-sdk.md) covers `@uniweb/api` itself; this page puts the parts of a solution together.

---

## The four parts

| part | who uses it | what it is |
|---|---|---|
| **Public pages** | visitors, signed in or not | section types an author composes, as on any site; records the site shows; forms a visitor fills with no account |
| **The members' area** | each kind of member: a learner, a client, an attendee | pages of section types no author composes, reading and writing the member's own entries through [`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api) |
| **Your admin area** | the people who run the solution: its instructors, its sales team, its staff | your section types too, branded, in the solution's own words |
| **The Solution Owner Console** | the site's owner | the engine's own administration, the same for every solution |

**Your admin area is the solution's; the Solution Owner Console is every solution's.** Build an admin area that speaks your solution's language and does its work: a course's roster and grading, a dealership's inventory and requests. Leave to the console what every solution has, done the same way for all of them: the site's payment account, the teams and who is in them, roles, an integration's address and keys, the store's offerings and coupons. A member the console admits reaches it from your site through its Admin link (`adminHref` from `useSession()`).

---

## The path, step by step

### 1. Name the roles

Start from the people, not the pages. Who comes to the site, and what does each one do? A course platform has visitors, learners, instructors and the owner; a dealership has shoppers, sales and service staff. List the pages each role needs, the ones it grows into included: a member's profile and settings, and the page a mailed link lands on.

### 2. Model the types, with their rules

Each kind of entry is a Model, written as a data schema: a course, a lesson, a submission. [The Entity Model](./the-entity-model.md) says what belongs in one Model and what gets a Model of its own; [Data Schemas](../development/data-schemas.md) has the syntax. The engine applies a schema's rules on every write, whatever the screen does, so put the rules there:

- `append_only` on a section that is added to and never edited, such as attendance;
- `readable_with: edit` on a reference, so the people who edit the course read every submission to it;
- `sold_with: true` on a reference, so whoever bought the course reads its lessons;
- `grantable: false` on a type whose entries are never shared one by one;
- `visitor_fills: true` on the fields a visitor with no account may fill.

### 3. Write the blueprint

`blueprint.yml`, beside `site.yml`, says how the site's engine starts ([Blueprint](../reference/blueprint.md)): who may sign up, the teams it founds, who adds entries of each type, who reads or edits all of them, what visitors who aren't signed in may read, and the integrations it starts with.

**Every type starts closed**: only the account that runs the site adds entries of it. Open the types that need opening — the ones members create, and the ones a team keeps — and leave closed what only the owner writes. The blueprint applies once, when the engine starts; after that, the owner changes these settings in the Solution Owner Console.

### 4. Build the members' area and your admin area

Both are section types that read and write through `@uniweb/api`:

- **The session:** `useSession`, sign-in and sign-up (`useSignIn`, `useSignUp`), the links the engine mails (`useMailedLink`).
- **Entries:** `useRecords` lists them, `useEntity` reads one, and `useEntityWriter` writes it.
- **Sharing:** `useAccess` gives a person `read`, `edit` or `admin` on an entry, such as an instructor enrolling a student. `useInvitations` answers an invitation, and `useUnits` says where a new entry lands.
- **Acting for the solution:** an administrator acts through their role only after confirming it is them (`useElevation`). Draw your admin area's controls from what each record says the viewer may do, since the engine decides.

Ask whether the site has an engine before drawing any of it: `isBackendEnabled()` from `@uniweb/kit`. The same foundation then also serves a site without one, and what needs the engine draws nothing there.

### 5. If it sells

The owner sets what the site sells in the Solution Owner Console, and connects their own Stripe account there. Your section types draw the store and its checkout:

- `useStore` reads the store's offerings, and whether the viewer owns each. Its `checkout` sends the buyer to the payment page, or takes a free offering at once.
- `offeringState` says what a Buy button draws from that one read.
- `useCoupon` previews a code the buyer types, with what it takes off or why it can't apply, and `checkout` takes the code it accepted. The owner makes the codes in the Solution Owner Console; the field and its words are your section type's.
- `checkout(offering, { inPage: true })` keeps the buyer on your page: the payment form opens in a modal you draw (kit's `Overlay`), and you're told when it's paid.
- `useEntitlements` lists what a member holds, for a "My courses" page, and `useHolders` lists who holds a record, for an instructor's roster.

A purchase gives the buyer read access to what an offering sells, and, through it, to what its `sold_with` references point to. The [`@uniweb/api` README](https://www.npmjs.com/package/@uniweb/api) has the details, under *Selling*.

### 6. Tell people what concerns them

The engine writes to each member's inbox: an entry someone shared with them, an invitation. `useNotifications` reads it — a badge with the unread count, and the rows when the member opens them.

### 7. Connect other systems

An integration moves entries of a type to or from another system, through one of your foundation's mappings: a catalog feed out, a lead in ([Blueprint § Integrations](../reference/blueprint.md#integrations)). Small logic, such as grading a quiz against an answer key a learner must never see, can be a [compute function](./compute-functions.md) your foundation ships, which the platform runs.

### 8. Work on your machine

`$devBackend` in `site.yml` answers the `backend` service under `uniweb dev` with a local mock ([Testing a Web App Locally § The mock](./testing-locally.md#the-mock)). Hand it your blueprint, and it applies it: every type closed until the blueprint opens it, each entry its owner's, `append_only` held. Seed it with accounts for each role, the entries they start with, a store and an inbox, and walk each role's pages. The mock is for working with no engine at hand. Before the solution goes live, check that each role can do what it must against the real engine: the Docker Developer Edition runs it on your machine, and `uniweb dev --published` runs your working copy against a published site ([Testing a Web App Locally](./testing-locally.md)).

### 9. Publish, and hand over

`uniweb publish` takes the site live on Uniweb hosting, and the site's first publish with the `backend` service provisions its engine: a dedicated Application Engine deployment, with its own PostgreSQL database, started from its blueprint. Uniweb hosting and the engine are paid. The first time, the browser opens to the page where the site's owner pays.

Then the owner sets up what is theirs, in the Solution Owner Console: their payment account, the people in each team, roles, and an integration's address. None of it belongs in your files.

---

## Where to start

Start a solution the way you start any site, from the `starter` template, and add the engine when you reach step 3:

```bash
uniweb create my-solution
```

To read a working one first, the `conference` template is an event site that is also an app: a programme the organiser keeps, which every member reads, and the attendance each attendee keeps for themselves. It comes with `services.backend`, `$devBackend`, a seeded mock and a blueprint already wired.

```bash
uniweb create my-event --template conference
```

---

## See also

- [The Application Engine](./the-application-engine.md): what the engine gives a site, and where your logic runs
- [The Entity Model](./the-entity-model.md): how to model a domain with Models and entities
- [The SDK](./the-sdk.md): `@uniweb/api`, and the habits a component needs
- [Testing a Web App Locally](./testing-locally.md): the mock, the Docker Developer Edition, and the site as published
- [Blueprint](../reference/blueprint.md): how a site's engine starts
- [Compute Functions](./compute-functions.md): small logic the platform runs for your foundation
- [Data Schemas](../development/data-schemas.md): the types, and the rules the engine holds
- [`@uniweb/api`](https://www.npmjs.com/package/@uniweb/api): the client, in full
- `uniweb guide backend`: the same, written for the agent building it
