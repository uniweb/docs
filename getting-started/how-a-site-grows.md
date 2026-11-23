---
description: "One site's life on Uniweb: from a few pages to a web app with members and payments, edited by others, translated, promoted and measured along the way, without being rebuilt."
---

# How a Site Grows

This page follows one site through its life: from its first few pages, through editors, languages and live content, to promotion, and to a members' area with payments. Your AI agent can take each step with you, and no step undoes what came before.

A site can also be a web app from its first day. The steps are the same, taken in another order.

---

## Day one: a few pages

Your agent builds the site from what you tell it and takes it live on Uniweb hosting. We recommend starting there, even for a few pages that rarely change:

- **It costs the least at this stage.** Each service, live content included, is priced on its own, so a site of static pages pays for no service it doesn't use.
- **Its pages are fast.** The page a visitor arrives on is prerendered close to them, so it loads fast and search engines read it whole.
- **AI assistants can read every page.** The site offers an index of its pages, `llms.txt`, and a Markdown copy of each one, with nothing to set up.
- **It is already in Uniweb App.** Every publish updates the site there, so you can preview and edit it at any time without waiting for your agent.
- **It is ready to grow.** Every step below happens on the same host, with no change to what is already there.

A site can also start on a static host such as GitHub Pages or Cloudflare Pages, and come to Uniweb hosting later with one command, `uniweb publish`. The steps below that need a service of Uniweb hosting begin with that move. [Deploying](../development/deploying.md#uniweb-hosting--recommended) puts the two side by side.

## More people

Add people whenever the site needs them:

- **The people the site belongs to**, and anyone they work with, edit it in Uniweb App, with a live preview of each page and no code or files.
- **Developers** work in the files, with Git, as in any project.
- **Your agent** is one more collaborator. Before it works, it checks what changed in Uniweb App (`uniweb status`) and brings those edits into the project.

Edits made in Uniweb App come back to the project as a Git merge, and a push that would overwrite them stops first, so nobody's work is overwritten without asking.

## A second language

Add the language to the site's settings. Your agent extracts the text to translate and writes the translation, or a translator does, and each page gets its own address in the new language, which can be translated too, such as `/es/desarrolladores` for `/developers`. Search, the links between languages and the pages AI assistants read follow on their own, and no component changes.

A new language can stay a draft until its translation is ready. Translations are kept by the text they translate, so they survive pages being moved and renamed, and when the source text changes, its translation is marked outdated, not lost. [Translating](../authoring/translating.md) covers it for translators, and [Internationalization](../development/internationalization.md) for developers.

## Content that others keep up to date

News, people, events, publications: content that changes often becomes **records**, each one a short file of named fields, described by a data schema. A section type, the code behind one kind of section, declares the records it shows and draws them wherever they come from: the site's files, or live from Uniweb hosting. In Uniweb App, records are edited as forms built from their schema, and with live records, a change shows on the site at once ([Working with Records](../authoring/collections.md)).

Records are the site's content, kept by the people who edit it. What a web app's members create, and anything the site sells, belong to its engine instead ([below](#members-and-payments)).

## Forms, statistics and search

Each is an entry under `services:` in the site's settings, `site.yml`:

- **Visitor statistics** need nothing else: no tag to install, and nothing stored on a visitor's device. Analytics, in Uniweb App, shows which pages are read, where visitors come from and how long they stay ([Measuring Visits](../marketing/measuring-visits.md)).
- **A form** needs a section type that draws it, which your agent adds. Uniweb hosting receives the submissions, and they arrive in the site's form inbox in Uniweb App ([Receiving Form Submissions](../development/receiving-form-submissions.md)).
- **Search** covers the site's pages, in each of its languages, and runs in the visitor's browser ([Site Search](../authoring/search.md)).

## Promoting the site

A site needs visitors. Promote, in Uniweb App beside Analytics, takes you through bringing them:

- **Getting found.** Steps that get the site into search engines and onto maps: you take each one on the service itself, and Uniweb checks that it is done.
- **Posts.** Write posts for your social networks, each linking to a page of the site, and send them now or at a time you choose.
- **Ads.** Make campaigns for social networks and search, which run in your own ad accounts. Nothing is spent until you start a campaign, and you can pause it at any time.
- **What each one brought.** Each post and campaign shows what it brought, day by day, counted by the site's own statistics, and each campaign what it spent.

Some of what visitors do is what the site is there for: signing up, booking a call, asking for a quote. The site can count each of those as a **conversion** ([Conversions](../marketing/conversions.md)). Uniweb hosting can also pass conversions on to X or Meta from its servers, with nothing added to your pages, so the network hears which of its ad clicks led to one and learns whom to show your ads to ([Advertising](../marketing/advertising.md)).

Your agent can work on Promote too, with `uniweb promote`: it drafts posts and campaigns, sends a post or starts a campaign when you say so, and reports what each one brought. Each network account is connected by its owner, in a browser, and your agent spends money only with your agreement.

## Members and payments

When the site needs members, it turns on its own [Application Engine](../web-apps/the-application-engine.md) with an entry in `site.yml`, and a short file, `blueprint.yml`, says who may sign up and what each person may see. The engine gives the site accounts and sign-in (with Google, for example), roles and teams, each member's own data and who it is shared with, an inbox for each member, and a store that takes payments through your own Stripe account. On Uniweb hosting, the site's first publish with it starts a dedicated engine for the site, with its own PostgreSQL database. The engine is a paid service, managed and billed in Uniweb App.

The engine is the machinery. What makes the web app yours is built in the foundation, the site's code, by your agent or a developer:

- **The kinds of thing it holds**, as data schemas: a course, a lesson, a submission ([The Entity Model](../web-apps/the-entity-model.md)).
- **The members' screens**, as section types that read and write each member's own entries through the SDK, [`@uniweb/api`](../web-apps/the-sdk.md): a learner's courses, a lesson player. They sit on pages like any section, but nobody composes them in Uniweb App; only their words, such as a heading, stay content that can be edited and translated.
- **An admin area for its staff**, in the solution's own terms: a course editor for its instructors, a grading queue. The web app's own data, such as its courses and lessons, is created and changed there, as entries of the engine. What the site sells is an entry too, never a record.

The site's owner sets what every web app has, such as roles, coupons and the Stripe account, in the **Solution Owner Console**. The foundation holds no backend code, and still works on a site without an engine. Put together, that is a **solution**: a site that is also a web app ([Building a Solution](../web-apps/building-a-solution.md)).

## Still the same project

By now the site has several languages, content its team keeps up to date, forms, statistics, campaigns, members and payments. It is still the project it was on day one: its first pages and section types are still there, never rebuilt, with its whole history in Git, and your agent has worked on it all along.

---

## See also

- [What is Uniweb](what-is-uniweb.md): the parts of Uniweb, and what a project holds
- [Why Uniweb](why-uniweb.md): why a site can grow without being rebuilt
- [Quickstart](quickstart.md): the prompt to start with
- [Deploying](../development/deploying.md): Uniweb hosting and static hosts, side by side
- [Measuring Visits](../marketing/measuring-visits.md), [Conversions](../marketing/conversions.md) and [Advertising](../marketing/advertising.md): a site's numbers, and what ad networks hear back
- [Building a Solution](../web-apps/building-a-solution.md): a site that is also a web app, step by step
