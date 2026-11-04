# Measuring Visits

You want to know which pages help, where visitors come from, and whether the ones a campaign brings
stay to read. A Uniweb site reports what its visitors do from the site itself: there is no tag to
install, nothing is stored on a visitor's device, and it works the same on any foundation.

> **Audience:** whoever reads a site's numbers, and the developer who sets the site up.

---

## Turning it on

Reports need somewhere to go, so nothing is sent until the site names a destination.

On Uniweb Cloud (`uniweb publish`, or publishing from the Uniweb app), ask your host to collect for
you:

```yaml
# site.yml
services:
  tracking: true
```

On any other host, name a collector of your own. It receives the reports as JSON, in batches, in the
format [the reference](../reference/site-configuration.md#what-your-collector-receives) describes:

```yaml
services:
  tracking: https://collector.example.com/events
```

A page shown in the app's editing preview reports nothing, so composing a site doesn't count as
traffic. Neither does `uniweb dev`, which has no host, unless you name a collector.

---

## What a page reports

The runtime sends these by itself:

| report | when | what it carries |
| --- | --- | --- |
| `page_view` | each page a visitor opens, including the first | the page, the site that linked to yours, and the campaign tags the visitor arrived with |
| `time_on_page` | when the visitor leaves the page | how long it was in front of them, `durationMs` |
| `outbound_click` | a visitor follows a link to another site | that site's host name, and nothing else of the address |
| `section_view` | a section is at least half on screen, once per page view | the section |
| `section_click` | a click inside a section | the section |
| `conversion`, `engagement` | an act the site counts | the act's name: [Conversions and Engagements](./conversions.md) |

Components can report more. Kit's `<Media>` reports how far a video was watched, and
`useReadingDepth()` how far down a long section a reader got.

Which of these are sent is the site's choice. With a collector of your own, the default is
`page_view`, `outbound_click` and `section_view`; `emit: all` adds the rest, including any a later
release adds. Where your host collects, the default is what your host says it collects. Either way,
`emit` in `site.yml` decides: [Choosing what is sent](../reference/site-configuration.md#choosing-what-is-sent-emit).

---

## Where visitors come from

`page_view` carries the page that linked the visitor to your site (`referrer`), and three campaign
tags from the address they arrived at: `utm_source`, `utm_medium` and `utm_campaign`. Any link you
control can say where it was: an ad, a newsletter, a post.

```text
https://example.com/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=spring
```

Both are read once, when the visitor arrives, and every later page view of that visit carries them,
since the address loses its tags as soon as the visitor moves on. So a count of page views by
`utm_source` counts the views of visitors who *arrived* from that source.

Tag your links in one scheme and keep to it, since a report can only split what the tags tell
apart. Give a paid post `utm_medium=paid_social` and a free one `social`, for instance, or the
visitors an ad bought are counted with those a post brought for free.

A conversion can carry more of that first address, such as `utm_content` for the ad or an ad
platform's click ID: [Carrying the campaign](./conversions.md#carrying-the-campaign).

---

## How long they stay

`time_on_page` is reported once for each page a visitor opens, at the first moment they leave it:
by opening another page, switching to another tab or app, or closing it. A phone can discard a page
in the background without warning, so the switch is the last moment a report is sure to leave.

So it measures the time until the visitor first looked away. A reader who switches apps to paste a
command and comes back is counted up to the switch. A page left open on a screen nobody is reading
counts the whole time, and a few of those pull an average far up, so a median says more about how
long people read.

---

## What it doesn't count

Nothing is stored on the visitor's device: no cookie, and no local storage. Each report carries a
`visit` value that lives in the page's memory and identifies one page load, so your collector can
put a visit's reports in order. It can't be linked to another tab, another day or another site.

Unique visitors, sessions, returning visitors and bounce rates all need an identifier kept on the
device, and this has none. It counts page views and acts, and stops there. That is a trade, and it
is worth knowing before you compare these numbers with another tool's.

If the laws where you operate call for consent, `consent: required` holds every report until the
visitor answers, and a component in your foundation asks the question:
[Consent](../reference/site-configuration.md#consent).

A vendor's own analytics, such as Google Analytics, measures in its own way, beside this:
[Google Analytics and Tag Manager](../reference/site-configuration.md#google-analytics-and-tag-manager).

---

## See Also

- [Conversions and Engagements](./conversions.md): counting what visitors do
- [Advertising](./advertising.md): telling an ad platform which clicks converted
- [Tracking](../reference/site-configuration.md#tracking): every option, and the format a collector receives
- [Section Analytics](../reference/page-configuration.md#section-analytics-tracksections): `section_view` per page
