# Kit & Core Reference

`@uniweb/kit` is the developer-facing API for Uniweb foundations. It provides React hooks for accessing site context, primitive components (Link, Image, Icon), and utility functions. When you need something from the framework, you import it from kit.

The data classes underneath — Website, Page, Block from `@uniweb/core` — are documented below for reference. You access them through hooks and the `block` prop, not by importing core directly.

---

## Hooks

### useWebsite

Access the current website instance.

```jsx
import { useWebsite } from '@uniweb/kit'

function Header() {
  const { website } = useWebsite()

  return (
    <header>
      <h1>{website.name}</h1>
      <nav>
        {website.getPageHierarchy({ for: 'header' }).map(page => (
          <a key={page.id} href={page.route}>{page.label}</a>
        ))}
      </nav>
    </header>
  )
}
```

#### Return Value

```js
const { website } = useWebsite()
```

| Property | Type | Description |
|----------|------|-------------|
| `website` | Website | The active website instance |

### useRouting

SSG-safe access to routing functionality. Returns hook functions that you call to get routing data.

```jsx
import { useRouting } from '@uniweb/kit'

function NavLink({ href, children }) {
  const { useLocation, useNavigate } = useRouting()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = location.pathname === href

  return (
    <a
      href={href}
      className={isActive ? 'active' : ''}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `useLocation()` | function | Returns location object `{ pathname, search, hash }` |
| `useParams()` | function | Returns route parameters for dynamic routes |
| `useNavigate()` | function | Returns navigate function for programmatic navigation |
| `Link` | component | Router Link component (or `'a'` fallback) |
| `isRoutingAvailable()` | function | Check if router context is available |

**SSG Safety**: During SSG/prerender, these return sensible defaults (empty pathname, empty params, no-op navigate) instead of throwing errors.

### useActiveRoute

Active route detection for navigation highlighting.

```jsx
import { useActiveRoute } from '@uniweb/kit'

function NavItem({ page }) {
  const { isActive, isActiveOrAncestor } = useActiveRoute()

  return (
    <a
      href={page.route}
      className={isActiveOrAncestor(page) ? 'active' : ''}
    >
      {page.label}
    </a>
  )
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `route` | string | Current normalized route (e.g., `'docs/getting-started'`) |
| `rootSegment` | string | First segment of route (e.g., `'docs'`) |
| `isActive(pageOrRoute)` | function | Check exact match with current route |
| `isActiveOrAncestor(pageOrRoute)` | function | Check if page or its children are active |

Both `isActive` and `isActiveOrAncestor` accept a **page object** or a **route string**:

```jsx
isActive(page)          // page object with .route property
isActive('/blog')       // route string — same comparison logic
isActiveOrAncestor('/research')  // matches /research, /research/papers, etc.
```

Use `isActiveOrAncestor` for parent nav items that should highlight when child pages are active.

**Why `useActiveRoute` instead of `website.activePage`:** The hook reads from React Router's location, which updates synchronously during navigation. `website.activePage` is a property on a vanilla JS singleton — it's always correct but isn't reactive in the React sense, so it won't trigger re-renders on its own. The hook also delegates route comparison to `Website.isRouteActive()`, which handles normalization and base path, and accepts both page objects and strings without branching.

### usePageState / useWebsiteState

Bridge observable state on `page` and `website` into React. `page.state` is scoped to the current page; `website.state` is site-wide. Both persist across SPA navigation and are readable from outside React (sibling components, non-React helpers).

```jsx
import { usePageState } from '@uniweb/kit'

function QuerySelector() {
  const [slug, setSlug] = usePageState('selectedQuery', 'all-members')

  return (
    <select value={slug} onChange={(e) => setSlug(e.target.value)}>
      <option value="all-members">Everyone</option>
      <option value="tenured-biology">Tenured biologists</option>
    </select>
  )
}
```

Signature:

```js
const [value, setValue] = usePageState(key, defaultValue?)
const [value, setValue] = useWebsiteState(key, defaultValue?)
```

The hook subscribes to the keyed slot of the active page's (or website's) state, returns the current value (or `defaultValue` if unset), and re-renders the calling component when the slot changes. The setter writes to the same slot and fires listeners across any other subscribers.

**State changes drive React re-renders, not re-fetches.** Components subscribed to the changed slot re-render and recompute from already-loaded data (typically via `useMemo` keyed on the state value, or a utility like `@uniweb/core`'s `matchWhere`). The framework does not re-dispatch fetches when state changes — the Uniweb model is "fetch once, filter in place" for this pattern. Components that need to re-fetch on user action are domain-aware components that own their own fetching with standard React (`useEffect + fetch`). See [Component Data Patterns](../development/component-data-patterns.md) for the two-role framing.

**What belongs in `page.state` / `website.state`:**

| State | Where it goes |
| --- | --- |
| Filter / sort / toggle state that reshapes already-loaded data | `page.state` or `website.state` |
| Cross-section coordination on a single page (active tab across a tab group, collapsed sidebar state) | `page.state` |
| Cross-page UI (appearance preference, authenticated user, cart open/closed) | `website.state` |
| Component-internal UI state (modal open, input focus, hover) | React's `useState` — not these hooks |
| Fetched data | `content.data` — not these hooks |

These are small observable value stores — plain keys with values. No reactive derivations, no computed signals; if you want that, compose `useMemo` / `useEffect` in the kit layer around these hooks.

### useVersion

Access version information for versioned documentation.

```jsx
import { useVersion } from '@uniweb/kit'

function VersionSwitcher() {
  const {
    isVersioned,
    currentVersion,
    versions,
    getVersionUrl,
    isDeprecatedVersion
  } = useVersion()

  if (!isVersioned) return null

  return (
    <select
      value={currentVersion?.id}
      onChange={(e) => window.location.href = getVersionUrl(e.target.value)}
    >
      {versions.map(v => (
        <option key={v.id} value={v.id}>
          {v.label}
          {v.deprecated && ' (deprecated)'}
        </option>
      ))}
    </select>
  )
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `isVersioned` | boolean | Is current page in a versioned scope? |
| `currentVersion` | object | `{ id, label, latest, deprecated }` |
| `versions` | array | All versions in current scope |
| `latestVersionId` | string | ID of the latest version |
| `versionScope` | string | Route where versioning starts |
| `isLatestVersion` | boolean | Is current the latest version? |
| `isDeprecatedVersion` | boolean | Is current version deprecated? |
| `getVersionUrl(id)` | function | Compute URL for a version |
| `hasVersionedContent` | boolean | Does site have any versioned content? |
| `versionedScopes` | object | Map of scope → `{ versions, latestId }` |

### useThemeData

Access theme configuration.

```jsx
import { useThemeData } from '@uniweb/kit'

function ColorPalette() {
  const theme = useThemeData()

  if (!theme) return null

  const palettes = theme.getPaletteNames()
  const primary500 = theme.getColor('primary', 500)

  return (
    <div style={{ color: primary500 }}>
      Available: {palettes.join(', ')}
    </div>
  )
}
```

See [Site Theming](./site-theming.md) for the full Theme API.

### useAppearance

Control light/dark mode.

```jsx
import { useAppearance } from '@uniweb/kit'

function DarkModeToggle() {
  const { scheme, toggle, canToggle } = useAppearance()

  if (!canToggle) return null

  return (
    <button onClick={toggle}>
      {scheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `scheme` | string | Current scheme: `'light'` or `'dark'` |
| `toggle` | function | Switch between schemes |
| `canToggle` | boolean | Is toggling enabled? |
| `setScheme(s)` | function | Set a specific scheme |

The runtime applies the scheme class to `<html>` before the page paints, and this hook reads it back — so `scheme` is correct on the very first render, with no flash. `toggle` and `setScheme` persist the visitor's choice.

**Don't also write the class or touch `localStorage` from your component.** That makes a second writer racing the runtime's, which is how a toggle ends up needing two clicks. `canToggle` is false unless the site's `theme.yml` enables toggling — if your button never appears, that's the config to check. See [site theming](./site-theming.md#rendering-a-toggle).

### useThemeColor / useThemeColorVar

Convenience hooks for accessing theme colors.

```jsx
import { useThemeColor, useThemeColorVar } from '@uniweb/kit'

function Badge() {
  // Get actual color value
  const accentColor = useThemeColor('accent', 600)

  // Get CSS variable reference
  const primaryVar = useThemeColorVar('primary', 500)

  return (
    <span style={{ background: accentColor, borderColor: primaryVar }}>
      New
    </span>
  )
}
```

### useInView

Detect when an element enters the viewport. Useful for lazy loading and scroll animations.

```jsx
import { useInView } from '@uniweb/kit'

function LazyImage({ src, alt }) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  return (
    <div ref={ref}>
      {inView ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="placeholder" />
      )}
    </div>
  )
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | number | `0` | Visibility threshold (0-1) |
| `triggerOnce` | boolean | `false` | Only trigger once |
| `rootMargin` | string | `'0px'` | Margin around root |

### useHeadings

The headings of the page being read, and which one the reader is level with. What a table of contents needs, with no opinion about how it looks.

```jsx
import { useHeadings } from '@uniweb/kit'

function PageContents() {
  const { headings, activeId, scrollTo } = useHeadings()
  if (!headings.length) return null

  return (
    <nav aria-label="On this page">
      {headings.map((heading) => (
        <button
          key={heading.id}
          onClick={() => scrollTo(heading.id)}
          className={heading.id === activeId ? 'text-primary' : 'text-subtle'}
        >
          {heading.text}
        </button>
      ))}
    </nav>
  )
}
```

Headings come back nested — each carries `{ id, text, level, children }`. The list is derived from the page's own content, so it is present in prerendered HTML rather than appearing after hydration; only `activeId` needs the browser, because only scroll position does. A DOM scan is the fallback for content the hook cannot see.

The anchor ids match what `<Render>` and `<Prose>` stamp — same generator — so `scrollTo` always finds its target.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `levels` | number[] | `[2, 3]` | Heading levels to collect |
| `root` | string | `'main'` | Selector to scan, for the DOM fallback |
| `offset` | number | header height | Scroll offset in px; defaults to `--header-height` plus a little room |

Pair it with `website.getBranchHierarchy({ route, for: 'left' })` for the other half of a documentation shell — the navigation rail. See [Website](#website).

### useShortcut / useShortcuts / useShortcutLabel

Bind a keyboard shortcut, and render it the way the visitor's platform writes it.

```jsx
import { useShortcut, useShortcutLabel } from '@uniweb/kit'

function Header() {
  const [open, setOpen] = useState(false)
  useShortcut('mod+k', () => setOpen(true))

  return (
    <button onClick={() => setOpen(true)}>
      Search <kbd>{useShortcutLabel('mod+k')}</kbd>
    </button>
  )
}
```

`mod` is the portable modifier: it matches **Meta or Control on every platform**, so a binding cannot silently fail to fire on somebody's machine. Platform detection happens only in the label, where a wrong guess is cosmetic rather than a dead shortcut. `useShortcutLabel('mod+k')` returns `⌘K` on Apple platforms and `Ctrl+K` elsewhere — which is the point: a hardcoded `⌘` names a key that Windows and Linux visitors do not have.

Kit ships **no default binding and knows no action names**. Which key opens what is your foundation's decision, the same way the site owns its theme values.

```jsx
useShortcut('/', focusSearch)                    // bare key
useShortcut('escape', close, { whileTyping: true })
useShortcuts({ 'mod+k': open, escape: close })   // one listener for several
```

Binding syntax: modifiers `mod`, `ctrl`, `alt`/`option`, `shift`, `meta`/`cmd`, joined with `+`; keys are a single character or a name (`escape`, `enter`, `space`, `tab`, `up`/`down`/`left`/`right`). Case-insensitive.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Bind only while true |
| `whileTyping` | boolean | *derived* | Fire while an input, textarea or contenteditable has focus |
| `preventDefault` | boolean | `true` | Call `preventDefault()` when it fires |
| `target` | EventTarget | `window` | Listen somewhere other than `window` |

`whileTyping` defaults from the binding rather than a fixed value: a modifier combo fires while a field has focus — including the field it opens — and a bare key does not, since it would otherwise hijack typing. Pass it explicitly to override; `escape` usually wants `true`.

SSR-safe: everything touching the DOM runs inside an effect, so these are inert during prerender. In development, binding one combo twice logs a warning — both handlers fire and both call `preventDefault()`, which otherwise produces no visible symptom.

`useSearchShortcut` still exists as an alias for `useShortcut('mod+k', …)`, kept so existing foundations keep working. Prefer `useShortcut` in new code: it says the same thing without implying the framework chose the key.

### block.dataLoading

Check whether a block's runtime data fetch is in progress. This is a boolean property on the `block` instance, set by the runtime's `BlockRenderer`.

```jsx
import { DataPlaceholder } from '@uniweb/kit'

function ArticleList({ content, block }) {
  if (block.dataLoading) {
    return <DataPlaceholder lines={4} />
  }

  const articles = content.data.articles || []
  return <ArticleGrid articles={articles} />
}
```

| Value | Meaning |
|-------|---------|
| `true` | A runtime fetch is in progress |
| `false` / `undefined` | Data is available (or no fetch configured) |

This hook watches `block.dataLoading` and triggers a re-render when the fetch completes. See [Component Metadata](./component-metadata.md#loading-states) for details.

---

### useFormSubmit

Submit a form, with the `idle → submitting → success | error` lifecycle. The
destination comes from the site's `submit:` declaration or from its host, so a
component never names an endpoint.

```jsx
import { useFormSubmit } from '@uniweb/kit'

const { submit, status, error, canSubmit, unavailableReason } = useFormSubmit({
  block,
  context: { formId: 'contact' },
  summary: (v) => ({ title: v.name, subtitle: v.email }),
})
```

| Returns | |
|---|---|
| `status` | `'idle'` · `'submitting'` · `'success'` · `'error'` |
| `error` | the `Error` from a failed submission, or `null` |
| `response` | the endpoint's reply on success, or `null` |
| `canSubmit` | whether this site declares a destination |
| `unavailableReason` | why not, when `canSubmit` is false |
| `canUploadFiles` | whether attachments can be delivered — check before rendering a file input |
| `submit(values, overrides?)` | send; rejects on failure |
| `reset()` | back to `idle` |

---

### useFormValues

Hold the state of a form an **author** designed — a `yaml:form` block at `content.data.form`. A form-rendering component is the inverse of every other one: it doesn't declare the fields, it receives them and draws whatever it's given. This owns the part that is identical in every such component, so a foundation writes only the controls.

```jsx
import { useFormValues, useFormSubmit, valueAt } from '@uniweb/kit'

const { controls, values, setValue, missing, formData, files } =
  useFormValues(content.data.form)
const { submit, canSubmit } = useFormSubmit({ block })

{controls.map((c) => (
  <MyControl key={c.path} control={c}          // branch on c.type — your design
             value={valueAt(values, c.path)}
             onChange={(v) => setValue(c.path, v)} />
))}
<button disabled={!canSubmit || missing.length > 0}
        onClick={() => submit(formData, { files })}>Send</button>
```

| Returns | |
|---|---|
| `controls` | every control, depth-first, each with the dotted `path` its value lives at |
| `values` | what your inputs bind to — holds `File` objects so a file input can show its selection |
| `setValue(path, v)` | set by dotted path (`'email'`, `'address.street'`) |
| `reset()` | back to the declared defaults |
| `missing` | paths of `required` controls still empty — computed, **not** enforced |
| `formData` | what you submit: JSON-safe, file controls omitted |
| `files` | `[{ file, field }]` for `submitForm`, each tagged with its control |

**Submit `formData`, not `values`.** They differ for one reason that would otherwise be a silent, success-shaped failure: submissions are sent as JSON, and a `File` inside them serializes to `{}` — an attachment that looks sent and arrives empty. File controls are therefore omitted from `formData` and ride in `files`, each tagged with the control it came from so an endpoint can tell two file inputs apart.

**`missing` is computed, not enforced** — the same line `canSubmit` draws. Whether an incomplete form disables the button, shows a message, or submits anyway is your design. Empty means `undefined`, `null`, `''` or `[]`; a `false` boolean is a *value*, so a required checkbox left unticked isn't "missing" — "must be ticked" is a stronger rule that belongs to the component that knows it's a consent box.

A container control (`type: group` with `children`) nests: its answers appear under its own key in `values` and `formData`, and paths are dotted throughout.

| Option | |
|---|---|
| `block` | supplies section type / id and page id / label as submission context |
| `context` | your own identifiers (`formId`, …); wins over what `block` supplies |
| `summary` | `{ title, subtitle, tag? }` or `(values) => that` — a readable digest |
| `files` (per call) | `File`s or `{ file, field }` pairs — sent as bytes after the answers |

**The framework never invents an endpoint, but a host may supply one** — a site
on Uniweb Cloud typically needs no `submit:`. `canSubmit` is false only when
neither a declaration nor a host provides a destination; render the control
disabled rather than posting a visitor's answers nowhere. Companion utilities
`submitForm()` and `resolveSubmitTarget(website)` do the same thing without React.

**Attachments go separately from the answers**, so bytes never ride inside the
JSON: the manifest is derived from the files you pass, then each file's bytes are
sent, then a finalize. Pass them per call and read `canUploadFiles` at render
time, not on submit — a file input someone has already used is too late to
withdraw.

```jsx
await submit(values, { files: [{ file, field: 'photos' }] })
// → { submissionId, filesUploaded: 1, filesRecorded: 1, totalSizeBytes: 4096 }
```

`filesRecorded` is the endpoint's own count of what reached storage. When it is
lower than what was sent, the call throws instead of resolving — every upload
can return 2xx and one can still be absent.

A failure after the first request names what landed — *"submission sub-3 was
recorded, but uploading 'big.pdf' failed"* — so a form can tell a visitor their
message arrived and their attachment did not, rather than reporting a flat
failure or a false success.

---

### resolveService

Where a named service lives for this site — search, form submission, an
assistant, or anything a foundation defines.

```js
import { resolveService } from '@uniweb/kit'

const { url, reason, source } = resolveService(website, 'assistant')
if (!url) return renderUnavailable(reason)
```

Resolution is the same for every service: the site's own declaration
(`assistant:` in `site.yml`), then what the host offers
(`config.services.assistant` in the served payload), then neither. `source` is
`'site'`, `'host'` or `null` — the thing to check when a host's value appears
not to be taking effect.

A declaration is a string or `{ endpoint }`; a host that declines may send
`{ reason }`, which reaches the UI verbatim. Bare endpoints (`_search`) are
rooted, absolute URLs pass through, and the base path is applied once.

**The name is open.** The framework ships clients for the services it implements
and resolution for anything, so a foundation can define its own and a host can
fill it with no framework change. `resolveServiceUrl(endpoint, basePath)` is the
join on its own.

See [Receiving Form Submissions](../development/receiving-form-submissions.md).

---

## Data Classes (from @uniweb/core)

You typically access these through `useWebsite()` or the `block` prop. Direct import from `@uniweb/core` is rarely needed.

### Website

The website instance provides access to site-wide data and navigation.

```jsx
function Header({ block }) {
  const website = block.website

  // Site identity
  console.log(website.name)         // 'My Site'
  console.log(website.description)  // 'Site description'

  // Pages
  const pages = website.getPageHierarchy({ for: 'header' })
  const allPages = website.pages

  // Locales (for language switcher UI)
  // Note: Content arrives already localized - no translation lookup needed
  if (website.hasMultipleLocales()) {
    const locales = website.getLocales()    // All locale objects
    const active = website.getActiveLocale() // Current locale code
    const url = website.getLocaleUrl('es')   // URL for switching
  }

  // Search
  if (website.isSearchEnabled()) {
    // Show search UI
  }
}
```

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getPageHierarchy(opts)` | array | Get pages for navigation |
| `getBranchHierarchy(opts)` | array | Get pages for one branch of the site |
| `getLocales()` | array | Get all locale objects |
| `getActiveLocale()` | string | Get current locale code |
| `getLocaleUrl(code)` | string | Get URL for a locale |
| `hasMultipleLocales()` | boolean | Check if multilingual |
| `isSearchEnabled()` | boolean | Check if search is enabled |
| `isVersionedRoute(route)` | boolean | Check if route is versioned |
| `getVersionScope(route)` | string | Get version scope for route |
| `getVersionUrl(version, route)` | string | Compute versioned URL |

#### getPageHierarchy Options

```js
website.getPageHierarchy({
  for: 'header',        // layout area name — checked against each page's hideIn
  nested: true,         // Include children (default: true)
  includeHidden: false  // Include hidden pages (default: false)
})
```

`for:` names the **layout area** the menu is being built for, and it is tested against each page's `hideIn:` list. Pass the area you are actually filling — `'header'` for the site menu, `'left'` for a sidebar — so an author can keep a page in one and out of the other. Any area name works, including ones a foundation invents.

Returns:
```js
[
  {
    id: 'about',
    route: '/about',
    title: 'About Us',
    label: 'About',
    description: 'Learn about us',
    order: 2,
    hasContent: true,
    children: [...]
  }
]
```

#### getBranchHierarchy Options

A sidebar shows one branch of a site, not all of it. Give it the active route and it answers that branch's pages.

```js
website.getBranchHierarchy({
  route: location.pathname,  // the active route
  for: 'left',               // layout area, as above
  includeHidden: false
})
```

Under `/docs/reference/cli` it returns the documentation tree; under `/blog/a-post` it returns the blog's. When the route matches no branch — the site root, usually — it returns the whole hierarchy. Pages come back in the order the build settled on, so there is nothing to sort.

Pair it with [`useHeadings`](#useheadings) for the two halves of a documentation shell.

### Page

Access page metadata and layout configuration.

```jsx
function Layout({ block }) {
  const page = block.page

  // Identity
  console.log(page.route)       // '/about'
  console.log(page.title)       // 'About Us'
  console.log(page.description) // 'Learn about our company'

  // Layout flags
  if (page.hasHeader()) { /* render header */ }
  if (page.hasFooter()) { /* render footer */ }

  // Versioning
  if (page.isVersioned()) {
    const version = page.getVersion()
    const versions = page.getVersions()
  }
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `route` | string | Page route path |
| `title` | string | Page title |
| `description` | string | Page description |
| `label` | string | Short nav label |
| `id` | string | Stable page ID |
| `layout` | object | Layout flags |
| `sections` | array | Page sections (blocks) |
| `website` | Website | Parent website |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `hasHeader()` | boolean | Should render header? |
| `hasFooter()` | boolean | Should render footer? |
| `getAreaBlocks(name)` | Block[] | Get blocks for a named layout area |
| `getLayoutAreas()` | object | Get all layout areas as `{ name: Block[] }` |
| `getLayoutParams()` | object | Get layout params from page.yml |
| `isVersioned()` | boolean | Is page in versioned scope? |
| `getVersion()` | object | Current version info |
| `getVersions()` | array | All versions in scope |
| `getVersionUrl(id)` | string | URL for version switch |

### Block

The block represents a rendered section.

```jsx
import { ChildBlocks } from '@uniweb/kit'

function Hero({ content, params, block }) {
  // Navigation to related objects
  const page = block.page
  const website = block.website

  // Block identity
  console.log(block.id)   // 'hero'
  console.log(block.type) // 'Hero'

  // Child blocks (for composition)
  if (block.hasChildBlocks()) {
    return <ChildBlocks from={block} />
  }
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Section ID |
| `type` | string | Component name |
| `page` | Page | Parent page |
| `website` | Website | Parent website |
| `childBlocks` | array | Nested blocks (file-based children) |
| `insets` | array | Inline `@Component` references (separate from childBlocks) |
| `data` | object | Fetched/cascaded data |
| `dataLoading` | boolean | Runtime data fetch in progress |
| `hasBackground` | boolean | Engine renders a background behind this section |
| `themeName` | string | Color context (`light`, `medium`, `dark`) |
| `state` | any | Persistent component state |

#### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `hasChildBlocks()` | boolean | Has nested sections? |
| `getInset(refId)` | Block\|null | Find an inset by its refId |

---

## Component Props

Every foundation component receives these props:

```jsx
function MyComponent({ content, params, block }) {
  // content - Parsed markdown content
  const { title, paragraphs, links, images, items, data } = content

  // params - Frontmatter parameters (with defaults from meta.js)
  const { theme, layout } = params

  // block - Block instance for navigation
  const { page, website } = block

  // data - Form tagged blocks or dynamic content source (optional)
  const { email, message } = data['schema-name'] || {}
}
```

### Content Shape

The runtime guarantees this structure (empty values if not in content):

```js
content = {
  // Headings
  title: '',
  pretitle: '',
  subtitle: '',
  headings: [],

  // Body content
  paragraphs: [],
  links: [],
  lists: [],
  quotes: [],

  // Media
  images: [],
  icons: [],
  videos: [],
  insets: [],        // Inline @Component references

  // Structure
  items: [],         // Child content groups
  headings: [],      // Overflow headings

  // Data
  data: {},          // Tagged blocks + fetched data

  // Document order
  sequence: []       // All elements in order
}
```

### Params with Defaults

Param defaults from `meta.js` are automatically applied:

```js
// meta.js
export default {
  params: {
    theme: { type: 'select', options: ['light', 'dark'], default: 'light' },
    columns: { type: 'number', default: 3 }
  }
}

// Component receives merged params
function Grid({ params }) {
  const { theme, columns } = params
  // theme = 'light' if not specified in frontmatter
  // columns = 3 if not specified
}
```

### DataPlaceholder

A ready-made loading placeholder for sections waiting on runtime data. Renders animated pulse bars.

```jsx
import { DataPlaceholder } from '@uniweb/kit'

function EventGrid({ content, block }) {
  if (block.dataLoading) {
    return <DataPlaceholder lines={5} />
  }

  return <div>{/* render events */}</div>
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lines` | number | `3` | Number of placeholder bars to render |
| `className` | string | `''` | Additional CSS classes |

Uses `animate-pulse` and the `--border` CSS variable for styling. Includes `role="status"` and `aria-label="Loading"` for accessibility.

### Visual

Renders the first visual element from content, checking insets first, then video, then image. From `@uniweb/kit`.

```jsx
import { Visual } from '@uniweb/kit'

function SplitContent({ content, block }) {
  return (
    <div className="flex gap-12">
      <div className="flex-1">
        <h2 className="text-heading">{content.title}</h2>
      </div>
      <Visual inset={block.insets[0]} video={content.videos[0]} image={content.images[0]} className="flex-1 rounded-lg" />
    </div>
  )
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inset` | Block | — | Inset Block instance (from `block.insets` or `block.getInset()`) |
| `video` | object | — | Video object with `src` property |
| `image` | object | — | Image object with `src` and `alt` properties |
| `className` | string | — | CSS classes for the visual container |
| `fallback` | ReactNode | `null` | Fallback when no visual is found |

**Resolution order:** inset > video > image. Only tries candidates you pass.

Section types that declare `visuals: 1` (any type) should use `<Visual>`. Those that declare `visuals: 'image'` (media only) should use `<Media>` or `<Image>` directly.

### Render vs Prose

Kit has two renderers. They look interchangeable and are not — they read different inputs and handle different things.

| | `<Render>` | `<Prose>` |
|---|---|---|
| **Reads** | Raw ProseMirror nodes (`block.rawContent`) | The parsed sequence (`content.sequence`) |
| **Use for** | A whole document: a markdown file rendered as written | Section content the parser has split into title, items, paragraphs |
| **Tables** | Yes | **No** |
| **Also handles** | Lists, callouts (`alert`/`warning`), `details`, inline insets | Icons, math, data blocks |

**Pick `<Render>` when the markdown file *is* the page.** Documentation, articles, anything mounted from a content repository. It covers the full node set, so a reference table or a callout survives.

```jsx
// A section type that renders whatever the author wrote, whole
import { Render } from '@uniweb/kit'

export default function Section({ block }) {
  return <Render block={block} />
}
```

**Pick `<Prose>` when you have already taken the content apart** and want the narrative remainder rendered with typography.

```jsx
import { Prose } from '@uniweb/kit'

export default function Lesson({ content, block }) {
  return (
    <>
      <h2>{content.title}</h2>
      <Prose content={content} block={block} />
      {content.data.quiz && <Quiz data={content.data.quiz} />}
    </>
  )
}
```

Reaching for `<Prose>` to render a document is the mistake worth naming: it renders, it looks right, and every table in the file is gone.

#### Both need the typography plugin

`<Prose>` emits Tailwind Typography's `prose` classes, and `<Render>` output is normally placed inside a container that carries them. Those classes come from a plugin your **foundation** installs — kit cannot supply them, since it ships no stylesheet of its own. Without it the markup is right and completely unstyled.

```css
/* your foundation's styles.css */
@plugin "@tailwindcss/typography";
@import "@uniweb/kit/prose-tokens.css";
```

Add `@tailwindcss/typography` to the foundation's dependencies too.

The second line is what makes body copy answer to the site's `theme.yml`. Typography ships its own greys, so without it long-form content is the one part of the page a site cannot restyle. After the import there is nothing more to do — and specifically, do not add `prose-invert`, a `dark:` variant, or a palette modifier like `prose-gray`. Each re-declares the variables the bridge just pointed at the theme, and the tokens already flip with the visitor's scheme.

**Use exactly one prose container per subtree.** The `--tw-prose-*` variables are inherited, so a `prose` container nested inside another silently resets all of them for everything inside it — the outer looks correctly themed and its contents do not. The section that renders the document is usually the better owner, since it then renders correctly under any layout; a layout should supply column width and padding only.

Both stamp an `id` on each heading, from the same generator, so `useHeadings` and any anchor link agree with whichever one rendered.

---

## Utilities

### cn

Merge Tailwind classes, resolving conflicts so a later class wins over an earlier one. Falsy values are dropped, which makes conditional classes read cleanly.

```jsx
import { cn } from '@uniweb/kit'

cn('px-4 py-2', isActive && 'bg-primary', className)
```

**Order matters, and one pair is surprising.** A font-size class overrides a preceding `leading-*`, because in Tailwind a size class like `text-lg` sets *both* font size and line height. So `cn()` treats a later `text-*` as replacing an earlier `leading-*` — and silently drops it:

```jsx
cn('leading-[1.1] text-[clamp(2rem,5vw,4rem)]')  // → 'text-[clamp(2rem,5vw,4rem)]'  ⚠️ leading gone
cn('leading-tight text-4xl')                     // → 'text-4xl'                      ⚠️ leading gone
cn('text-4xl leading-tight')                     // → 'text-4xl leading-tight'        ✅
```

This bites hardest when the size comes from a lookup and the leading is in a shared base string, because the base is written first. Two ways out — put the size before the leading, or fold the leading into the size with Tailwind's slash syntax:

```jsx
const TITLE_SIZE = { hero: 'text-[clamp(2.8rem,6.5vw,4.5rem)]/[1.1]' }   // size and leading in one class
<H1 className={cn('font-bold tracking-tight', TITLE_SIZE[params.layout])} />
```

The same rule applies to any pair Tailwind fuses into one utility. When a class you passed doesn't show up in the DOM, check whether a later class in the same `cn()` owns that property too.

### getLocaleLabel

Get display name for a locale.

```jsx
import { getLocaleLabel, LOCALE_DISPLAY_NAMES } from '@uniweb/kit'

// From locale object with label
getLocaleLabel({ code: 'es', label: 'Spanish' })  // 'Spanish'

// From locale object without label
getLocaleLabel({ code: 'es' })  // 'Español' (from built-in names)

// From string
getLocaleLabel('es')  // 'Español'

// Unknown code
getLocaleLabel({ code: 'xx' })  // 'XX'

// Access built-in names directly
console.log(LOCALE_DISPLAY_NAMES.fr)  // 'Français'
```

### splitContent

Split parsed content at `---` dividers into separate regions. Each region has its own `sequence` slice; grouped fields (title, paragraphs, items) are preserved from the original. Use this when the component needs to route different content regions to different UI.

```jsx
import { splitContent } from '@uniweb/kit'

function Lesson({ content, block }) {
  const [lesson, challenge] = splitContent(content)
  return (
    <div>
      <Prose content={lesson} block={block} />
      <aside className="bg-card p-6 rounded-lg">
        <Prose content={challenge} block={block} />
      </aside>
    </div>
  )
}
```

Returns a single-element array (`[content]`) if no divider exists, so destructuring always works.

**Note:** This is different from Loom's `splitAtDividers`, which splits raw ProseMirror nodes *before* parsing for data-driven iteration. `splitContent` splits *after* parsing for UI layout purposes. See "Dividers — Content Boundaries" in the authoring guide.

### Icon Component

Renders icons from multiple sources: library icons, URLs, direct SVG, or built-in icons.

```jsx
import { Icon } from '@uniweb/kit'

// String ref (recommended for library icons)
<Icon icon="lu-house" />         // dash format
<Icon icon="lu:house" />         // colon format
<Icon icon="lucide:house" />     // full library name

// Explicit library + name
<Icon library="lucide" name="house" />

// From URL
<Icon url="/icons/custom.svg" />

// Direct SVG content
<Icon svg="<svg>...</svg>" />

// Built-in icons (no library needed)
<Icon name="check" />
<Icon name="close" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string/object | — | String ref (`"lu-house"`), URL, or `{ library, name }` object |
| `library` | string | — | Icon library shortcode (`lu`, `hi`, `fi`, etc.) |
| `name` | string | — | Icon name within the library |
| `url` | string | — | URL to fetch SVG from |
| `svg` | string | — | Direct SVG content |
| `size` | string | `'24'` | Icon size in pixels |
| `color` | string | — | Icon color (defaults to `currentColor`) |
| `preserveColors` | boolean | `false` | Keep original SVG colors instead of using `currentColor` |
| `className` | string | — | Additional CSS classes |

The string `icon` prop is the most concise way to use library icons. The same string formats work in markdown (`![](lu-house)`), in YAML data (`icon: lu:house`), and in JSX (`<Icon icon="lu-house" />`).

### parseIconRef

Parse an icon string reference into its library and name parts.

```jsx
import { parseIconRef } from '@uniweb/kit'

parseIconRef('lu-house')       // { library: 'lu', name: 'house' }
parseIconRef('lu:house')       // { library: 'lu', name: 'house' }
parseIconRef('lucide:house')   // { library: 'lucide', name: 'house' }
parseIconRef('not-an-icon')    // null (prefix not a known library)
```

Useful when you receive icon strings from structured data (`content.data`) and need to pass them to components that expect separate library/name props.

### Overlay Component

Render a modal, command palette, drawer or toast above the page, from anywhere in the tree.

```jsx
import { Overlay } from '@uniweb/kit'

function SearchDialog({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <Overlay onClose={onClose} className="items-center">
      <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-2xl rounded-2xl bg-card">
        …
      </div>
    </Overlay>
  )
}
```

#### Why not a `fixed inset-0 z-…` div

Because that does not work, and the reason is invisible.

The runtime gives each layout area its own `view-transition-name` so the header, rails and body animate independently. That makes every area a stacking context **and** a containing block for fixed children — so a dialog rendered from inside your Header is sealed into the header's context and paints **under** the page body no matter what z-index it carries. Raising the number looks like it should help and never does, because the two elements are not competing in the same stacking context.

`Overlay` renders into `document.body`, outside every area wrapper, where the z-index means what you expect.

#### It contains focus, so `aria-modal` is true

A modal overlay moves focus in on open, cycles Tab within it, pulls focus back if it escapes, marks the rest of the page `inert`, and restores focus to whatever opened it when it closes. **On by default.**

This matters more than it sounds. `aria-modal="true"` tells assistive technology that everything outside the dialog is unreachable. Without containment that is false in the most literal way: a keyboard user Tabs straight out into the page behind and lands on controls a screen-reader user has been told do not exist. Nothing errors, and the people it fails are the least likely to be in the room when it ships.

You still write `role="dialog" aria-modal="true"` on your own box — it is your element — but the promise is now backed.

#### Modal and non-modal

`modal` (default `true`) is the master switch, because the cluster it governs only makes sense together: scrim, focus trap, scroll lock, inert background. A dialog, palette, drawer or lightbox wants all of it.

`modal={false}` is the other real case — a toast or notification. It escapes the stacking context and does nothing else: no scrim, no trap, no scroll lock, and pointer events pass through so the page stays usable. Content opts back in with `pointer-events-auto`.

```jsx
<Overlay modal={false} className="items-end justify-end p-6">
  <div className="pointer-events-auto rounded bg-card p-4">Saved</div>
</Overlay>
```

#### The scrim is a default, not a constraint

A modal overlay dims the page for you. `className` is applied last and Tailwind conflicts resolve in your favour, so every adjustment is a plain override:

| You write | Result |
|---|---|
| *nothing* | the default dimmed scrim |
| `bg-primary/10` | your colour — a theme token works as readily as a fixed one |
| `bg-transparent` | no scrim |
| `backdrop-blur-sm` | kept **alongside** the default |
| `items-center` | content centred instead of top-aligned |

The layer is a flex container, so `items-*` and `justify-*` place your content. The box itself — its width, radius, background, animation — is your foundation's design, the same way kit ships no layout.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | node | — | The overlay content |
| `onClose` | function | — | Called on Escape and on a scrim click. Omit for an overlay that dismisses some other way |
| `modal` | boolean | `true` | Blocks the page: scrim, focus trap, scroll lock, inert background |
| `className` | string | — | Classes for the scrim / positioning layer, applied last |
| `zIndex` | number \| string | `100` | Stacking order of the layer |
| `initialFocus` | ref \| string \| `false` | first focusable | What to focus on open; `false` leaves focus alone |
| `returnFocus` | boolean | `true` | Restore focus to whatever opened it |
| `trapFocus` | boolean | = `modal` | Turning this off on a modal overlay makes `aria-modal` a false claim — prefer `modal={false}` |
| `lockScroll` | boolean | = `modal` | Prevent the page behind from scrolling |
| `closeOnEscape` | boolean | `true` | |
| `closeOnScrimClick` | boolean | `true` | |

Anything else is spread onto the layer.

#### Details worth knowing

- **Escape is handled on the capture phase**, so it still closes while an input inside the dialog has focus.
- **Only a click on the scrim itself closes.** A click that bubbled out of your content does not, so a text selection ending outside the box is safe.
- **Nesting works.** A confirm dialog over a settings dialog: only the topmost closes on Escape and traps focus, and the inner one closing does not unlock scrolling or restore the page underneath the outer one.
- **Nothing is emitted when server-rendered**, so a prerendered page carries no scrim.

#### When not to use it

An anchored popover, dropdown menu or tooltip wants to be positioned relative to its trigger and to leave the page interactive. A full-screen layer with a scrim and a scroll lock is the wrong shape for those — build them in your foundation, positioned normally.

### Link Component

Client-side navigation with `page:` protocol support.

```jsx
import { Link } from '@uniweb/kit'

function Navigation() {
  return (
    <nav>
      <Link to="page:home">Home</Link>
      <Link to="page:about#team">Our Team</Link>
      <Link to="/external" target="_blank">External</Link>
    </nav>
  )
}
```

---

## Access Patterns

### From Hooks (Recommended)

```jsx
import { useWebsite, useRouting } from '@uniweb/kit'

function MyComponent() {
  const { website } = useWebsite()
  const { route } = useRouting()

  // Access locale via website
  const locale = website.getActiveLocale()

  // Use hooks throughout the component
}
```

### From Block Props

```jsx
function MyComponent({ block }) {
  const website = block.website
  const page = block.page

  // Access via block reference
}
```

### When to Use Which

| Scenario | Use |
|----------|-----|
| General component logic | Hooks |
| Accessing page/website from nested components | Hooks |
| Simple property access in main component | Block props |
| Non-React code (utilities) | Block props |

---

## See Also

- [Component Metadata](./component-metadata.md) — Defining component interfaces
- [Content Structure](./content-structure.md) — Content shape and guarantees
- [Site Theming](./site-theming.md) — Theme API and hooks
- [Internationalization](../development/internationalization.md) — Locale switching and build-time translation
- [Versioning](./versioning.md) — Version hooks and API
