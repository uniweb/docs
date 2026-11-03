# View Transitions

Uniweb animates page navigation with smooth crossfades using the browser's native View Transitions API. Every SPA navigation is wrapped in `document.startViewTransition()`, which captures a screenshot of the current page, updates the DOM, and crossfades from old to new. No dependencies, no animation libraries — the browser handles it.

This is enabled by default. In browsers that don't support the API, pages swap instantly without animation. When the user has `prefers-reduced-motion` enabled, pages swap without animation too.

---

## What You Get for Free

Without any configuration, every Uniweb site crossfades the page on navigation:

- **What changes** — usually the body — crossfades to the new page.
- **What stays** — a header, sidebar or footer that looks the same and sits in the same place on both pages — doesn't visibly change, because the old page and the new one agree there.

You don't declare anything. A bar that is `fixed` or sticky stays steady the same way.

---

## Naming an Area

A name takes an area out of the page's crossfade: the browser captures it on its own and animates it from where it was on screen to where it lands. Add a `transitions` map to a layout's `meta.js` when you want that movement — an area that changes shape between two layouts (see below) — or to style an area's animation in CSS:

```js
// src/layouts/DocsLayout/meta.js
export default {
  areas: ['header', 'footer', 'left', 'right'],
  transitions: {
    left: 'sidebar',
  },
}
```

The keys are area names (`header`, `body`, `left`, `footer`). The values are `view-transition-name` CSS identifiers. The runtime puts the name on the thin `<div>` it wraps the area in, so the browser can track and animate it independently.

### What a Name Costs

A name changes what the browser does with that box, so name only what you mean to move:

- **The box moves.** A navigation resets the scroll, so a box that scrolls with the page lands somewhere else, and everything in it goes along. A bar that is `fixed` inside such a box drops through the page and comes back from above. A visible footer slides off the bottom of the screen.
- **The box is captured at its own size.** A box with no height is captured as nothing, whatever overflows it, so a bar that overlays the page — `fixed`, or `absolute` in a box it doesn't fill — is gone for the length of the transition.
- **The box cuts off what's behind it.** A named element is a backdrop root, so a `backdrop-filter` inside it sees nothing past it: a bar's frosted glass blurs nothing, at rest too.
- **Safari can lose a bar.** In WebKit, a named bar that stays in place, `fixed` or stuck, can fade out over the transition and come back at the end.

### Naming the Body

Give the body a name (`body: 'main'`) only when it has to morph between layouts, as below, because a name decides what the browser captures. The page is captured at the size of the viewport. A named element is captured as one image: Safari captures all of it, the part off-screen included, at the device's resolution, and paints every filter in it while the page waits. On a phone, a long page makes an image of over 100 MB.

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

- An area or the body has a name only when its layout's `transitions` gives it one. Everything without one crossfades with the page.
- Transition names must be unique on the page. Two elements with the same `view-transition-name` at the same time causes the transition to be skipped. Elements with `display: none` (like a mobile sidebar hidden on desktop) are excluded from this check.
- Names are arbitrary CSS identifiers. Use descriptive names (`header`, `main`, `sidebar`) — they appear in devtools.
- `transitions: false` gives a layout no names, and takes away the wrapper on its body (see [Stacking](#stacking-which-area-paints-on-top)).

---

## Disabling Transitions

View transitions are enabled by default. To disable them for a foundation:

```js
// src/main.js
export default {
  viewTransitions: false,
}
```

This is a foundation-level setting, not site-level, because the foundation is the authority on page structure.

---

## Stacking: which area paints on top

The runtime wraps each area in a thin `<div>`, and that wrapper is easy to miss: **it is a stacking context.** Each area becomes its own stacking world, and a `z-index` set on something *inside* an area cannot lift it past a different area — no matter how large the number.

That matters most for the most ordinary thing a layout has: a sticky or fixed header. Sections routinely form stacking contexts of their own, and without an order the areas and the body paint in DOM order, so a body rendered after the header paints over it — including over its clicks.

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

The browser creates pseudo-elements for the page, and for each area you name, that you can style with standard CSS:

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

The names in parentheses match the values in your layout's `transitions` map, and `root` is the page, which holds everything you haven't named. This CSS goes in your foundation's `styles.css` or the site's custom CSS.

Without any custom CSS, the browser uses a default ~250ms crossfade — which already looks good for most sites.
