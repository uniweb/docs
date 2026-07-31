# View Transitions

Uniweb animates page navigation with smooth crossfades using the browser's native View Transitions API. Every SPA navigation is wrapped in `document.startViewTransition()`, which captures a screenshot of the current page, updates the DOM, and crossfades from old to new. No dependencies, no animation libraries — the browser handles it.

This is enabled by default. In browsers that don't support the API, pages swap instantly without animation. When the user has `prefers-reduced-motion` enabled, transitions are skipped entirely.

---

## What You Get for Free

Without any configuration, every Uniweb site animates navigation — and for layouts with named areas, it does the *right* thing automatically. The runtime gives each rendered area (`header`, `left`, `right`, `footer`, …) plus the body its own `view-transition-name`, so the browser animates them independently:

- **Persistent chrome** — a header, sidebar, or footer that's the same across pages — stays put, no crossfade.
- **The body** — the part that actually changes — crossfades to the new page.

You don't declare anything. A layout that lists `areas: ['header', 'left', 'right', 'footer']` already gets per-region transitions; the runtime names them `uw-header`, `uw-left`, `uw-body`, and so on. A layout with no named areas simply crossfades the page body, which is the sensible default.

The `transitions` map below is an **override** for advanced cases — you don't need it for the common "header stays, content crossfades" effect.

---

## Overriding the Defaults

Add a `transitions` map to a layout's `meta.js` only when you want to *change* the automatic names — to pick CSS-friendly names, group areas across different layouts (see below), or opt a region out:

```js
// src/layouts/DocsLayout/meta.js
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

- Every rendered area is given an independent transition automatically, named `uw-<area>` (and `uw-body` for the page body). An explicit `transitions` entry replaces that name.
- Transition names must be unique on the page. Two elements with the same `view-transition-name` at the same time causes the transition to be skipped. Elements with `display: none` (like a mobile sidebar hidden on desktop) are excluded from this check.
- Names are arbitrary CSS identifiers. Use descriptive names (`header`, `main`, `sidebar`) — they appear in devtools.
- To exclude a region, set its entry to `null` (it folds back into the page crossfade); to drop per-region names for a whole layout, set `transitions: false` (the layout gets one whole-page crossfade).

---

## Disabling Transitions

View transitions are enabled by default. To disable them for a foundation:

```js
// src/main.js
export default {
  viewTransitions: false,
}
```

This is a foundation-level setting, not site-level, because the foundation is the authority on page structure. To opt out more narrowly instead, set a single region to `null` in a layout's `transitions` map, or set `transitions: false` on the layout to drop per-region names entirely.

---

## Stacking: which area paints on top

Naming a region has a second consequence that is easy to miss: **`view-transition-name` makes an element a stacking context.** Each area wrapper becomes its own stacking world, and a `z-index` set on something *inside* an area cannot lift it past a different area — no matter how large the number.

That matters most for the most ordinary thing a layout has: a sticky or fixed header. Without an order, area wrappers all sit at `auto` and paint in DOM order, so a body rendered after the header paints over it — including over its clicks.

**You get a sane order by default.** Every area is stacked above the page body, so chrome sits over content and a fixed header behaves the way you expect. Nothing to declare.

What the framework does *not* do is rank one piece of chrome against another. Area names are yours — `header` and `left` are conventions, but `topbar`, `rail` and `statusbar` are equally valid — so guessing that one outranks another from its name would be wrong as often as right. Areas are equal by default; where two genuinely overlap, say so:

```js
// layouts/Docs/meta.js
export default {
  areas: ['header', 'left', 'right'],
  layers: {
    header: 2,   // the top bar spans full width and covers the rail
    left: 1,
  },
}
```

`layers` mirrors `transitions`: an object overrides per region, and `layers: false` opts the layout out entirely so you can own the stacking in your own markup.

Two details worth knowing:

- **The body is unstacked by default, not set to `0`.** A layer implies `position: relative`, and a positioned body wrapper would become the containing block for every absolutely-positioned element on the page. Lifting the chrome achieves the order without that. You can still set `body` explicitly if your design needs it.
- **A modal is a different problem.** Stacking orders areas against each other; it cannot lift a dialog opened from the header above the page, because the dialog is still inside the header's context. That is what `<Overlay>` in `@uniweb/kit` is for — it renders out of the area entirely.

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

The names in parentheses match your regions' `view-transition-name`s — the values from your layout's `transitions` map, or the automatic `uw-<area>` / `uw-body` names when you haven't set one. If you intend to write this CSS, giving regions explicit names via the `transitions` map keeps the selectors readable. This CSS goes in your foundation's `styles.css` or the site's custom CSS.

Without any custom CSS, the browser uses a default ~250ms crossfade — which already looks good for most sites.
