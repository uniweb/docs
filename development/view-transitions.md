# View Transitions

Uniweb animates page navigation with smooth crossfades using the browser's native View Transitions API. Every SPA navigation is wrapped in `document.startViewTransition()`, which captures a screenshot of the current page, updates the DOM, and crossfades from old to new. No dependencies, no animation libraries — the browser handles it.

This is enabled by default. In browsers that don't support the API, pages swap instantly without animation. When the user has `prefers-reduced-motion` enabled, pages swap without animation too.

---

## What You Get for Free

Without any configuration, every Uniweb site animates navigation — and for layouts with named areas, it does the *right* thing automatically. The runtime gives each rendered area (`header`, `left`, `right`, `footer`, …) its own `view-transition-name`, so the browser animates it on its own, and everything else crossfades as the page:

- **Persistent chrome** — a header, sidebar, or footer that's the same across pages — stays put, no crossfade.
- **The body** — the part that actually changes — crossfades to the new page.

You don't declare anything. A page whose site fills layout areas — `header`, `left`, `right`, `footer` in its `layout/` folder — already gets per-region transitions; the runtime names them `uw-header`, `uw-left`, and so on. A layout with no named areas simply crossfades the page, which is the sensible default.

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

### Naming the Body

The body has no name by default, and crossfades with the page. Give it one (`body: 'main'`) only when it has to morph between layouts, as below, because a name decides what the browser captures. The page is captured at the size of the viewport. A named element is captured as one image: Safari captures all of it, the part off-screen included, at the device's resolution, and paints every filter in it while the page waits. On a phone, a long page makes an image of over 100 MB.

Measured on a long marketing page at 3× in WebKit, with a desktop CPU, a tap stalled the main thread for up to 842 ms with a named body and up to 271 ms without. Chromium did not stall at all, which is why this doesn't show on a desktop in Chrome. On an iPhone the same page froze for about 30 seconds.

The same goes for what a page paints. A large `filter: blur()` is painted again for every capture. A decorative glow looks the same as a radial gradient, which costs a fraction:

```css
.glow {
  mask-image: radial-gradient(closest-side, #000, rgb(0 0 0 / 0.6) 40%, rgb(0 0 0 / 0.09) 80%, transparent);
}
```

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

- Every rendered area is given an independent transition automatically, named `uw-<area>`. The page body has none and crossfades with the page. An explicit `transitions` entry replaces a name, or gives the body one.
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

**A sticky area is the one the framework does rank.** When a section in an area is `sticky` ([Component Metadata](../reference/component-metadata.md#sticky)), the area stays in view while the rest of the page scrolls under it, so it is stacked above every area that does not stick — otherwise a footer taller than the space below a stuck header would paint over the header at the bottom of the page. `layers` still ranks a sticky area you name.

Two details worth knowing:

- **The body is unstacked by default, not set to `0`.** A layer implies `position: relative`, and a positioned body wrapper would become the containing block for every absolutely-positioned element on the page. Lifting the chrome achieves the order without that: the body's wrapper is a stacking context with no position (`isolation: isolate`), so a `z-index` on a section stays inside the body. You can still set `body` explicitly if your design needs it. With `viewTransitions: false` or `transitions: false` that wrapper is gone too, and a section's `z-index` competes with the areas directly.
- **A modal is a different problem.** Stacking orders areas against each other; it cannot lift a dialog opened from the header above the other areas, because the dialog is still inside the header's context — and one opened from a section is inside the body's, under every area. That is what `<Overlay>` in `@uniweb/kit` is for — it renders out of the area entirely.

---

## Interaction with Split Content

When [split content](../reference/site-configuration.md#split-content) is enabled, navigating to an unvisited page requires fetching its content from a `_pages/*.json` file. The current page stays on screen, still usable, while that content loads, and the page swaps once it has arrived. This holds for every navigation and every visitor, with or without view transitions, so no one sees a blank page between the two.

The same goes for the [data](../reference/data-fetching.md) a page's sections read, split content or not. Once the page's content is in, the runtime asks for what its sections will read and the site doesn't have yet: anything already fetched during the visit is used as it is. The page swaps when that data is in too, so its sections appear with their data instead of a loading state.

The fetch usually starts before the click. A page starts loading, its content and then its data, when a visitor rests the pointer on a link to it, gives the link focus, or presses it. By the time the click lands it is often already there, and the page changes at once. A pointer sweeping across a menu loads nothing, and nothing is loaded early for a connection that asks to save data.

With view transitions, the swap itself is animated:

1. The content and data are fetched while the current page is still showing
2. The browser captures the current page
3. React renders the new page, its content and data already loaded
4. The browser crossfades from the old page to the new one

If the page takes longer than a second to arrive (on a slow connection), navigation proceeds anyway. Without its content it goes without the transition and fills in when the content arrives; a section whose data is still coming shows its [loading state](./component-patterns.md#loading-states).

---

## Customizing Animations with CSS

The browser creates pseudo-elements for each transitioning area that you can style with standard CSS:

```css
/* Faster crossfade for the page, the body included */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.2s;
  animation-timing-function: ease-in-out;
}

/* Slightly longer animation for the sidebar appearing */
::view-transition-group(sidebar) {
  animation-duration: 0.3s;
}
```

The names in parentheses match your regions' `view-transition-name`s — the values from your layout's `transitions` map, or the automatic `uw-<area>` names when you haven't set one — and `root` is the page, which holds the body unless your layout names it. If you intend to write this CSS, giving regions explicit names via the `transitions` map keeps the selectors readable. This CSS goes in your foundation's `styles.css` or the site's custom CSS.

Without any custom CSS, the browser uses a default ~250ms crossfade — which already looks good for most sites.
