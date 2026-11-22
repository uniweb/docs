---
description: "Design a foundation as a vocabulary new sites are made from, by authors in Uniweb App and their AI agents, who can't change its code."
---

# Designing a Vocabulary

A foundation you write for one site grows with it: when the site needs something new, you add it. A foundation that people start new sites from doesn't get that chance. Whoever picks it in Uniweb App, and the AI agent that composes pages for them, have what it offers and nothing else, since neither can change its code. What you design then is a vocabulary: the parts a site can be made of, and how far each can vary.

This guide covers what a vocabulary is made of, how one vocabulary makes many designs, when a capability belongs in a foundation of its own, and what templates say about a vocabulary. It builds on [Foundation Categories](./foundation-categories.md): a vocabulary for many sites is a portable foundation.

---

## What a vocabulary offers

Seven things decide what can be made with a foundation:

| | what it offers | where it comes from |
|---|---|---|
| **Sections** | the section types pages are composed of, each with its content, params and presets | `sections/`, each type's `meta.js` |
| **Layouts** | how a page is arranged around its sections, and the areas each layout has | `layouts/`, each layout's `meta.js` |
| **Content** | what a section's text can hold | kit's components, and the packages you add |
| **Data** | the records your sections show, and the entries that get a page of their own | `meta.js` `data:`, and a site's [parametric pages](../reference/dynamic-routes.md) |
| **Services** | the services your sections use: search, form submissions, records, the site's backend | your code; a site's [services](../reference/site-services.md) decide which of them work on it |
| **Outputs** | the documents it makes of a site's content, such as PDF or Word | `main.js` `outputs` ([Foundation Configuration](../reference/foundation-config.md#document-outputs)) |
| **Theme** | what a site can change about how it looks | `theme.yml`, and the variables you declare in `main.js` `vars` |

An author meets these as building blocks, controls and forms in the editor. An AI agent reads them to choose a foundation and to compose with it. Together they answer one question: what can be made with this?

Two of them deserve a closer look.

**Content comes mostly from kit.** A section that draws its text through kit's `Article` or `Prose` shows headings, lists, quotes, tables, code, math, pictures, video and insets as the author wrote them. So long text is cheap to support well, and worth it: a site made from your foundation will need a privacy page, and an about page that runs long. What a field of work adds is usually narrower, such as citations in a chosen style, or equations and figures numbered so the text can refer to them.

**A layout's areas shape the site.** The docs template's layout puts the site's pages on one side of the text and the page's headings on the other:

```js
// layouts/DocsLayout/meta.js, in the docs template
export default {
  title: 'Documentation',
  description: 'Three-column layout with sidebar navigation for documentation pages',
  areas: ['header', 'footer', 'left', 'right'],
}
```

A foundation whose layouts have no area beside the text can't make that site, whatever its sections.

---

## One vocabulary, many designs

**A topic is content.** A bakery, a law firm and a yoga studio need much the same sections: an opening, what they offer, who they are, what people say, where to find them, how to get in touch. What differs is words, pictures and records. Name a section type for what it does (`Hero`, `Menu`, `Team`), not for the business you first built it for, and its content can be anyone's.

**A design is the theme and the params.** Take the first of these that holds a difference, as in [Libraries](./libraries.md#when-two-sites-need-two-foundations):

- Colors, fonts, light and dark: the site's `theme.yml`. Sections that use semantic tokens follow it with no change ([Thinking in Contexts](./thinking-in-contexts.md)).
- Corner radius, shadow depth and spacing, which make a design classic or modern: variables you declare in `main.js` `vars` and every component reads, set per site in `theme.yml`.
- How a section lays out: a param, with a preset for each arrangement an author can start from.

```js
// sections/Hero/meta.js: one hero, three arrangements
export default {
  title: 'Hero',
  params: {
    layout: {
      type: 'select',
      label: 'Arrangement',
      options: [
        { value: 'beside', label: 'Picture beside the text' },
        { value: 'over', label: 'Text over the picture' },
        { value: 'text', label: 'Text alone' },
      ],
      default: 'beside',
    },
  },
  presets: {
    default: { label: 'Picture beside', params: { layout: 'beside' } },
    over: { label: 'Over a picture', params: { layout: 'over' } },
    text: { label: 'Text alone', params: { layout: 'text' } },
  },
}
```

Let the content choose where it can: a hero given no picture can be text alone without a setting. And use the same param names and values across your section types, so an author or an agent who learned one section knows the next.

One section type with many arrangements is the [Front Desk pattern](./component-patterns.md#the-front-desk-pattern). When an option stops being another arrangement of the same content, such as a hero that takes a form, it is a section type of its own in the same family ([When it's better as several section types](./component-patterns.md#when-its-better-as-several-section-types)).

These multiply. A dozen section types with three arrangements each, under a theme that moves colors, fonts, corners and spacing, make sites that don't look related.

---

## When a capability gets its own foundation

Every site has pages that present it. A documentation site has a home page, a researcher's site has a front page, and an app has public pages before anyone signs in. So every vocabulary needs the common sections: an opening, a header and footer, long text, cards, a call to action, a way to get in touch. What differs between foundations is what each adds to them. What we've found:

- **Not for a topic, or for a design.** A bakery's site and a law firm's can share a vocabulary, and so can a classic design and a modern one (above).
- **Keep what the same authors would use.** Prices, a gallery, questions and answers, a team, opening hours: any business may want them. A site made from a template can't add a section type later, so a part that's missing is missing for good.
- **A foundation of its own when most sites would never use it.** A documentation layout with its reference sections, or citations and bibliographies, mean nothing on a salon's site, and its author shouldn't have to pass them every time they add a section. Such a foundation still has the common sections, shared with your other foundations through a [library](./libraries.md). A documentation site needs marketing pages beside its docs, so a documentation vocabulary has both layouts.
- **A foundation of its own when it needs a service a site may not have.** A members' area runs on the site's backend, so it belongs with the sites that have one.
- **Never to make a bundle smaller** ([Libraries](./libraries.md#when-two-sites-need-two-foundations)).

---

## Templates show what a vocabulary can do

In Uniweb App, people start new sites from templates: the ones the app's gallery offers every account, and the ones an organization makes of its own sites for its members. Making a site a template says that its foundation is a good vocabulary to start from. The site itself is one example of what can be made with it. People choose by what they see, so more templates on the same foundation show more of its range: a salon's site and an accounting firm's, on one vocabulary, show an author more than either does alone.

**Name a foundation for what it is, not for one use.** A foundation called "bakery" tells everyone it is only for bakeries, even when it makes a law firm's site as well. Give it a name that says its character, and a description of what it can make. A foundation that serves one use, such as courses on a site's backend, can say so in its name, but even then the description does more of the work.

---

## Checking a vocabulary

- Make a site on a topic you didn't plan for. Where you reach for a new section type, the vocabulary is short.
- Make two sites that should look nothing alike, with the theme and params alone.
- Ask an AI agent to make a site with it from a description, or to rebuild an existing site with it, and to say what it couldn't carry over. That list is what your vocabulary lacks.

---

## See Also

- [Foundation Categories](./foundation-categories.md): bundled and portable foundations
- [Libraries](./libraries.md): code several foundations share
- [Component Patterns](./component-patterns.md): params, presets and one section type with many arrangements
- [Thinking in Contexts](./thinking-in-contexts.md): semantic theming
- [Component Metadata](../reference/component-metadata.md): everything a `meta.js` declares
- [Template Tour](./template-tour.md): what each starter template shows
