# Documentation Versioning

Keep the docs for an older release available beside the current ones.

Most docs need one version, the current one. Add another when readers still on an older release would be misled by the current docs, and not before.

## How It Works

A version is a folder named `v1`, `v2` or `v2.1`, beside the pages it's an older version of. The folder's URL is its path, like any other folder's.

```
pages/
├── home/
├── about/
└── docs/
    ├── getting-started/   # the latest, at /docs/getting-started
    ├── guide/             # /docs/guide
    ├── v2/                # an older version, at /docs/v2/…
    │   ├── page.yml       # title: "2.x"
    │   ├── getting-started/
    │   └── guide/
    └── v1/                # an older version, at /docs/v1/…
```

- **The pages beside the folders are the latest.** You keep writing where you've always written, and their URLs never change.
- **A version is ordinary pages.** Nothing rewrites its URLs, so links to it keep working, and a site you build and a site you publish to a Uniweb backend have the same ones.
- **A version's label is its page's `title`**, or `label`, in the `page.yml` inside the folder. With none, it's the folder's name.

Pages outside the folder holding the versions, like `home` and `about` above, aren't versioned.

## Freezing a Release

When a release is about to stop being the latest, freeze its docs:

```bash
uniweb add version v2                  # freezes pages/docs as pages/docs/v2
uniweb add version v2 --label "2.x"    # and what a version switcher calls it
uniweb add version v2 --in manual      # another folder under pages/
uniweb add version v2 --in .           # all of pages/, for a site that's nothing but docs
uniweb add version v2 --dry-run        # says what would happen, and writes nothing
```

With no `--in`, it uses the folder that already holds versions, or else `docs`.

This copies the pages into the new folder and leaves everything you have as it was: its files, its URLs and its links. It also does what a plain copy gets wrong:

- **The links in the copy lead to the copy.** A link written as `page:guide`, `page:docs/guide` or `/docs/guide` becomes a path into the new folder. Links to pages outside the docs stay as they are. Links in code samples stay as written, since they're words about a link.
- **The copy has no page IDs.** An ID has to be unique across a site, so `page:guide` still means the latest page. A frozen copy doesn't move, so it doesn't need them.
- **Search engines are told to leave it out**, with `seo: { noindex: true }` in its `page.yml`, so they send people to the latest docs. Use `--keep-in-search` to leave that out. To change your mind later, edit the file.
- **Translations written by hand come along.** Free-form translations of those pages are copied too. Run `uniweb i18n extract` afterwards if the site has other languages.

A folder [mounted from another repository](./site-configuration.md) gets the copy in that repository, since that's where its pages live.

## What Readers Get

These come with a foundation built on `useVersion`, like the `docs` template's:

- **A version switcher.** It leads to the same page in the other version, or to the nearest page to it when that version doesn't have it. It never leads to a page that doesn't exist, and it keeps the site's `base` and the reader's language.
- **A notice on older versions**, leading to the same page in the latest.
- **A sidebar and previous/next links that keep to one version.**

Some things work for any foundation:

- **Search on the site keeps to the version being read.** A reader on an older version who searches for something that version doesn't have gets results from the latest. A host's search service decides what it indexes, and if it holds no older versions, readers on them get the latest's results.
- **Search engines get the latest.** A folder's `noindex` covers every page in it. The exception is a version folder with content of its own, whose `noindex` speaks only for that page. For one of those, `uniweb add version` writes it on each page of the copy, and a page you add to that version later needs it too.
- **A site you build leaves older versions out of its sitemap and `llms.txt`.** A host that writes those files itself decides what they list.

A foundation that doesn't use `useVersion` shows a version folder as an ordinary group of pages in its menus, so its pages are still reachable.

## Building a Switcher

`useVersion` tells a foundation which version a page belongs to, and where each of the others leads from it:

```jsx
import { Link, useVersion } from '@uniweb/kit'

function VersionSwitcher({ params }) {
  const { isVersioned, currentVersion, versions } = useVersion()

  // Draw nothing on a page with no other version
  if (!isVersioned || versions.length < 2) return null

  return (
    <ul>
      {versions.map((version) => (
        <li key={version.id} aria-current={version.id === currentVersion.id}>
          <Link href={version.href}>{version.label ?? params.latestLabel}</Link>
        </li>
      ))}
    </ul>
  )
}
```

`label` is null for the pages beside the version folders, since they have no page of their own to name them. It's the foundation's to say what they're called: "Latest", or a param a site can set to `3.x`.

Pass `href` to `<Link>`, which adds the site's `base` and the reader's language.

### A Notice on Older Versions

```jsx
function OlderVersionNotice({ content }) {
  const { isOlderVersion, latestVersion } = useVersion()
  if (!isOlderVersion) return null

  return (
    <div role="note">
      <Span text={content.title} />
      <Link href={latestVersion.href}>{content.links[0]?.label}</Link>
    </div>
  )
}
```

A section like this can sit in the [header area](./layout-areas.md) of every page, since it draws nothing except on an older version. Its words belong in its markdown, where they can be translated.

### Menus That Keep to One Version

`hierarchy` takes the options of `website.getPageHierarchy` and gives the tree of what's being read: the version on this page, and the latest in any other versioned section. On a site with no version folders, it's the whole tree.

```jsx
function Sidebar() {
  const { hierarchy } = useVersion()
  const pages = hierarchy({ for: 'left' })
  // …
}
```

Reading an older version, its pages take the place of the latest's in the tree, so a menu has the same shape on every version.

For a flat list, `holds(route)` says whether a page belongs with what's being read:

```js
const { holds } = useVersion()
const pages = website.getPageHierarchy({ nested: false }).filter((page) => holds(page.route))
```

### Reference

```js
const {
  isVersioned,     // boolean: the page is in a section with version folders
  versions,        // the section's versions, latest first
  currentVersion,  // the one being read
  latestVersion,   // the section's latest
  isOlderVersion,  // boolean: reading anything but the latest
  versionScope,    // the route of the folder holding the versions, e.g. '/docs'
  holds,           // (route) => boolean
  hierarchy,       // (options) => the page tree of what's being read
} = useVersion()
```

| Version field | Description |
|---|---|
| `id` | The folder's name, or `latest` for the pages beside the folders |
| `label` | The folder page's `label` or `title`, else its name. Null for the pages beside the folders |
| `latest` | Whether this is the section's latest |
| `route` | Where the version starts: `/docs/v1`, or `/docs` for the pages beside the folders |
| `href` | Where it leads from the page being read |

## URLs That Name Their Version

With no pages beside the folders, the newest folder is the latest, and every URL says its version:

```
pages/api/
├── v1/   # /api/v1/users
└── v2/   # /api/v2/users, the latest
```

This suits an API, where a version in the URL is the point. For docs, those URLs age: a link to `/docs/v2/guide` stays on v2 after the next release.

## Things to Keep in Mind

- **Version whole sections, and keep few.** Each version you keep is one more set of pages in the site's page list, and one more thing to look after.
- **Older versions render with today's foundation.** It has to keep the section types they use. If an old version needs its old design, or you have many, publish it as its own site, under its own `base`.
- **A folder named like a version is one.** `pages/rest/v1/users/` keeps its URL, `/rest/v1/users`, and `useVersion` reports it as a version of `/rest`.
- **With version folders directly in `pages/`, the whole site is versioned.** `/about` reads as the latest and a switcher can appear on it, leading to the older version's first page. To keep pages out of it, put the docs in a folder of their own.
- **Copying a version folder by hand keeps its IDs.** The build warns about two pages with one ID, since a `page:` link leads to only one of them. `uniweb add version` avoids it.

---

## See Also

- [Page Configuration](./page-configuration.md) — `seo`, `hideIn` and the rest of `page.yml`
- [Linking](../authoring/linking.md) — Page references
- [Navigation Patterns](./navigation-patterns.md) — Building navigation
- [CLI Commands](./cli-commands.md) — `uniweb add version`
