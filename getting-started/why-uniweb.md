# Why Uniweb

A Uniweb site can start as a few pages and grow into a full platform, with more languages, editors, live content, members and payments, without plugins and without redoing what was built.

Your AI agent can take each of those steps with you. This page follows one site through its life, then looks closer at two things most sites need sooner or later: more languages and more people.

---

## Why a site can grow here

Two things are true of every Uniweb site from its first day, and they are why it can grow without being rebuilt:

- **What the site says is kept apart from the code that draws it.** The words, pictures and records are content; the design is code. Adding a language, an editor or a live source of content changes the content, and the code that draws it stays as it was.
- **What a site can grow into is already built.** Languages and search are part of the framework. Forms, visitor statistics, live records, accounts and payments are services of Uniweb hosting that a site turns on when it needs them. None of them is a plugin to find, install and keep up to date.

What grows is the site, by addition. A step may add a section type, such as one that draws a form, but nothing made before has to change.

---

## One site, from first page to platform

### Day one: a few pages

Your agent builds the site from what you tell it and publishes it on Uniweb hosting. We recommend starting there, even for a few pages that rarely change:

- **It costs the least now.** Each service, live records included, is priced on its own, so a site of static pages pays for no service it doesn't use.
- **Its pages are fast.** The page a visitor arrives on is prerendered close to them, so it loads fast and search engines read it whole.
- **AI assistants can read every page.** The site offers an index of its pages, `llms.txt`, and a Markdown copy of each one, automatically, with nothing to set up.
- **It is already in the Uniweb app.** Every publish updates the site there too, whether or not anyone uses the app yet. You can preview and edit it at any time, so not every change has to wait for your agent.
- **It is ready to grow.** Every step below happens on the same host, with no change to what is already there.

A site can also start on a static host such as GitHub Pages or Cloudflare Pages, and come to Uniweb hosting later with one command, `uniweb publish`. The steps below that use a service of the host start there.

### A second language

Add the language to the site's settings. Your agent extracts the text to translate and writes the translation, and each page gets its own address in the new language. Search, the links between languages and the pages AI assistants read follow on their own. No component changes: components receive their content already translated. [Languages](#languages) has the details.

### Content others keep up to date

News, people, events, products: content that changes often becomes **records**, each one a short file of named fields, described by a data schema. A section type declares the records it shows and from then on draws them wherever they come from: the site's files, or live from Uniweb hosting. In the Uniweb app, records are edited as forms built from their schema, and a change shows on the live site at once.

### More people

Add people whenever the site needs them: in the Uniweb app, where they edit without code; through Git, where developers work in the files; or both. Edits made in the app come back to the project as a merge, and nobody's work is overwritten without asking. [People](#people) has the details.

### Forms, statistics and search

Each is a service the site asks Uniweb hosting for, with a line under `services:` in `site.yml`:

- **Visitor statistics** need nothing else. Every page reports the same events, and nothing is stored on the visitor's device: no cookie.
- **Search** covers the site's pages, in each of its languages.
- **A form** needs a section type that draws it, which your agent adds. Uniweb hosting receives the submissions.

### Members and payments

For a members' area, the site turns on its own backend, the `backend` service: accounts, sign-in (with Google, for example), roles, and what each member creates. Section types reach it through [`@uniweb/api`](../development/sites-with-accounts.md), and the same foundation works on a site with the service and on one without it. The site's backend also takes payments, through your own Stripe account.

### A full platform

By now the site has content in several languages kept up to date by its team, members, payments, forms and statistics. It is still the project it was on day one: its first pages and section types are still there, unchanged, with its whole history in Git, and your agent has worked on it all along.

---

## Languages

Everything a site in several languages needs is built in.

**For the content:**

- Add a language at any time, and keep it as a draft until its translation is ready (`publishLanguages`).
- Translations are kept by the text they translate, so they survive pages being moved and renamed. When the source text changes, its translation is marked outdated, not lost.
- A page's address can be translated too, such as `/es/desarrolladores` for `/developers`.
- A page that needs to say something different in another language can have a version of its own.
- Records are translated like pages, and translations can be made in files or in the Uniweb app.

**For the code:** components receive their content already translated, with no translation function and no string keys. A component's own words, such as a button's label, can come from the content too, and are then translated with the page.

**For visitors and search engines:** each language has its own addresses, `hreflang` links, search index, `llms.txt` and Markdown copy of each page.

**For your agent:** `uniweb i18n status --missing --by-page` lists what is left to translate, page by page, so translating a site is a job your agent can finish.

See [Internationalization](../development/internationalization.md) for developers and [Translating](../authoring/translating.md) for translators.

---

## People

- **Developers** work in the files, with Git, and see each other's work as they would in any project.
- **Everyone else** works in the Uniweb app, with a live preview of each page, and no code or files.
- **Both at once:** `uniweb refresh` takes your teammates' commits and the edits made in the app into the project, and a push that would overwrite edits made in the app stops first.
- **Your agent** is one more collaborator. In a project, it starts by checking what changed in the app (`uniweb status`) and brings those edits in before it works.

---

## See also

- [What is Uniweb](what-is-uniweb.md): what you and your agent do, and what a project holds
- [Quickstart](quickstart.md): the prompt to start with
- [Deploying](../development/deploying.md#uniweb-hosting--recommended): Uniweb hosting and static hosts, side by side
- [Sites with Accounts](../development/sites-with-accounts.md): the `backend` service, for developers
