# Templates

A template is a working site to start from: its pages, the section types that draw them, and sample content that your agent replaces with yours. Name one when you start, or begin with the default.

---

## Starting from a template

With your agent, name the template in the prompt's command:

```text
Build me a website with Uniweb.
Start with `npx uniweb@latest start --template blog`

The site is for: [describe your site]
```

Your agent creates the project from the template, keeps what fits, replaces the sample content with yours and removes what you won't use. The code is yours too, so it can change anything the site needs.

By hand:

```bash
npx uniweb@latest create my-site --template blog
```

Each official template has a live demo. `npx uniweb@latest template list` prints the ones your version of the CLI can create.

---

## Sites

| Template | For | |
| --- | --- | --- |
| `marketing` | A product or a business: landing pages, features, pricing | [Demo](https://uniweb.github.io/templates/marketing/) |
| `services` | A local business, built around a form for quote requests | [Demo](https://uniweb.github.io/templates/services/) |
| `store` | A shop: a product catalog with Shopify's Buy Button, and a journal | [Demo](https://uniweb.github.io/templates/store/) |
| `blog` | Articles, shown as a grid of cards and as a page each | [Demo](https://uniweb.github.io/templates/blog/) |
| `docs` | Documentation, with navigation on several levels | [Demo](https://uniweb.github.io/templates/docs/) |
| `academic` | A researcher, a lab or a department | [Demo](https://uniweb.github.io/templates/academic/) |
| `international` | A business in English, Spanish and French | [Demo](https://uniweb.github.io/templates/international/) |
| `learning` | Courses, with quizzes and code challenges | [Demo](https://uniweb.github.io/templates/learning/) |
| `conference` | An event site that is also an app: sign-in, an editable programme, and data for each signed-in visitor | [Demo](https://uniweb.github.io/templates/conference/) |

**[All the demos](https://uniweb.github.io/templates/)**

---

## Your own design

`paste` runs a React design you already have, such as one an AI tool generated: replace `src/sections/App.jsx` with it, and the site shows it. That is only the start, because the app can edit only what has left the code. Your agent then takes the design apart into section types, with its text in Markdown and its colors in `theme.yml`, as [Converting Existing Designs](../development/converting-existing.md) describes.

```bash
npx uniweb@latest create my-site --template paste
```

---

## For developers: what the framework can do

These templates each show a capability, with a working site around it.

| Template | Shows | |
| --- | --- | --- |
| `dynamic` | Data from an API, with loading states and transforms | [Demo](https://uniweb.github.io/templates/dynamic/) |
| `extensions` | A second foundation adding visual effects to a site | [Demo](https://uniweb.github.io/templates/extensions/) |
| `cv-loom` | A CV filled in from one profile, and downloadable as a Word document | [Demo](https://uniweb.github.io/templates/cv-loom/) |
| `monograph` | A long illustrated document, on the web and as a Word document | [Demo](https://uniweb.github.io/templates/monograph/) |
| `academic-metrics` | A site whose content is also a downloadable Excel workbook | [Demo](https://uniweb.github.io/templates/academic-metrics/) |
| `business-docs` | Invoices, statements of work and a report, each downloadable as Word, Excel or a print page | [Demo](https://uniweb.github.io/templates/business-docs/) |

---

## Built-in starting points

These come with the CLI:

- **`starter`**, the default: one generic section type and two short pages, a working example of each convention, to replace as you build.
- **`none`**: the same project with no section types or pages, for building everything yourself.
- **`--blank`**: a workspace with no packages, which you grow with `uniweb add`. It is the start for several sites or foundations in one workspace; see [Project Structures](../development/project-structures.md).

```bash
npx uniweb@latest create my-site                      # starter
npx uniweb@latest create my-site --template none
```

A blank workspace needs its install before `uniweb add`:

```bash
npx uniweb@latest create my-workspace --blank
cd my-workspace
pnpm install                 # the build tools `uniweb add` needs
pnpm uniweb add project main
pnpm install                 # links what you added
```

---

## Templates from npm or GitHub

```bash
npx uniweb@latest create my-site --template @myorg/template-name      # an npm package
npx uniweb@latest create my-site --template github:user/repo          # a GitHub repository
npx uniweb@latest create my-site --template github:user/repo#v1.0.0   # at a branch or tag
npx uniweb@latest create my-site --template https://github.com/user/repo
```

---

## See also

- [Quickstart](./quickstart.md): start a site, with your agent or by hand
- [CLI Commands](../reference/cli-commands.md): every option of `create` and `start`
