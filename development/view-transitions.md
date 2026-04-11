# View Transitions

Uniweb animates page navigation with smooth crossfades using the browser's native View Transitions API. Every SPA navigation is wrapped in `document.startViewTransition()`, which captures a screenshot of the current page, updates the DOM, and crossfades from old to new. No dependencies, no animation libraries — the browser handles it.

This is enabled by default. In browsers that don't support the API, pages swap instantly without animation. When the user has `prefers-reduced-motion` enabled, transitions are skipped entirely.

---

## What You Get for Free

Without any configuration, every Uniweb site gets a whole-page crossfade on navigation. The browser captures the entire viewport as one unit and crossfades it, giving the user visual continuity between pages.

To go further, you tell the browser which parts of the page are the *same* across navigations. A header that appears on every page shouldn't crossfade — it should stay put. A sidebar that persists across pages should stay put too. Only the main content area should transition.

This is what the `transitions` map in layout `meta.js` does.

---

## Named Transitions in Layout meta.js

Each layout can declare which of its areas participate in transitions:

```js
// foundation/src/layouts/DocsLayout/meta.js
export default {
  areas: ['header', 'footer', 'left', 'right'],
  transitions: {
    header: 'header',
    body: 'main',
    left: 'sidebar',
    footer: 'footer',
  },
}
```

The keys are area names (`header`, `body`, `left`, `footer`). The values are `view-transition-name` CSS identifiers. The runtime wraps each area in a thin `<div>` with that name, so the browser can track and animate them independently.

With this in place, same-layout navigation (page to page within docs) looks like this:
- **Header** — same name, same position → stays put, no animation
- **Sidebar** — same name, same position → stays put
- **Body** — content changes → crossfades
- **Footer** — same name → stays put

The user sees only the main content area transition. Everything else is visually static. It feels like just the article content changing — smooth and fast.

### Cross-Layout Morphing

If two layouts share a transition name, the browser automatically animates between them. Say your docs layout and marketing layout both declare `body: 'main'`:

```js
// MarketingLayout/meta.js
export default {
  areas: ['header', 'footer'],
  transitions: {
    header: 'header',
    body: 'main',
    footer: 'footer',
  },
}
```

Navigating from a marketing page (full-width main) to a docs page (narrower main with sidebar):
- **Header** morphs from marketing header size/position to docs header
- **Main** morphs from full-width to the narrower content area
- **Sidebar** has no counterpart in marketing — it fades in
- **Footer** morphs between the two footer styles

No custom animation code. The browser handles the spatial interpolation based on the shared names.

### Rules

- Transition names must be unique on the page. Two elements with the same `view-transition-name` at the same time causes the transition to be skipped. Elements with `display: none` (like a mobile sidebar hidden on desktop) are excluded from this check.
- Names are arbitrary CSS identifiers. Use descriptive names (`header`, `main`, `sidebar`) — they appear in devtools.
- Areas without a transition entry are included in the default crossfade. Only areas you name get independent animation.

---

## Disabling Transitions

View transitions are enabled by default. To disable them for a foundation:

```js
// foundation/src/foundation.js
export default {
  viewTransitions: false,
}
```

This is a foundation-level setting, not site-level, because the foundation is the authority on page structure. The `transitions` map in layout meta.js only makes sense if the foundation author designed the layouts with transitions in mind.

---

## Interaction with Split Content

When [split content](../reference/site-configuration.md#split-content) is enabled, navigating to an unvisited page requires fetching its content from a `_pages/*.json` file. Without view transitions, there's a brief moment where the content hasn't loaded yet.

With view transitions, the content fetch happens *inside* the transition callback — behind the old page's screenshot. The sequence:

1. Browser captures screenshot of current page
2. Content is fetched while the screenshot is displayed (~50-200ms)
3. React renders the new page with content already loaded
4. Browser crossfades from screenshot to new content

The user never sees a loading state. If the fetch takes longer than 1 second (slow connection), navigation proceeds without the transition and the page renders normally.

---

## Customizing Animations with CSS

The browser creates pseudo-elements for each transitioning area that you can style with standard CSS:

```css
/* Faster crossfade for the main content area */
::view-transition-old(main),
::view-transition-new(main) {
  animation-duration: 0.2s;
  animation-timing-function: ease-in-out;
}

/* Slightly longer animation for the sidebar appearing */
::view-transition-group(sidebar) {
  animation-duration: 0.3s;
}
```

The names in parentheses (`main`, `sidebar`) match the values from your layout's `transitions` map. This CSS goes in your foundation's `styles.css` or the site's custom CSS.

Without any custom CSS, the browser uses a default ~250ms crossfade — which already looks good for most sites.
