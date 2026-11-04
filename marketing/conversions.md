# Conversions and Engagements

Page views say what visitors read. A **conversion** says one of them did what the site is there
for: signed up, booked a call, asked for a quote, copied the install command. An **engagement** says
they did something worth knowing that isn't a result in itself, such as signing in.

Both are reports with a `name` and nothing else of their own, so a phone number, an email address or
a form's fields stay on the page. The difference between them matters twice: a conversion rate
counts only conversions, and an ad platform only ever hears of conversions ([Advertising](./advertising.md)).

> **Audience:** whoever decides what a site counts, and the developer who sets it up.

---

## Three ways an act counts

### By itself

Some acts are reported with no setup:

| report | `name` | when |
| --- | --- | --- |
| `conversion` | `phone`, `email` | a visitor taps a `tel:` or `mailto:` link |
| `conversion` | `form`, or `form_<formId>` | a form sent through `useFormSubmit` is accepted by a provider of your own |
| `conversion` | `sign_up` | a sign-up through `@uniweb/api` is accepted |
| `engagement` | `sign_in` | a sign-in through `@uniweb/api` succeeds |

The first row needs only the runtime. The others come from code your foundation bundles, so they
start when the foundation is rebuilt.

### Because the site lists it

Nothing can tell by itself that one link is your sign-up and another your sign-in, so a link or a
page counts when `site.yml` lists it:

```yaml
services:
  tracking:
    conversions:
      - { name: get_started, page: /get-started }
      - { name: signup, link: https://app.example.com/signup }
      - { name: call_office, link: 'tel:+15551234' }
```

- **A `page` counts when a visitor opens it**, whichever link brought them. uniweb.io counts its Get
  Started page this way: the button in the header, the one in the footer and the calls to action on
  other pages all lead there, and they count as one act.
- **A `link` counts when a visitor follows it**, wherever it appears. It is a whole address, compared
  without its query or fragment, so it suits an address outside the site, such as an app's sign-up.
  A page of your own site is a `page`, which also matches it in every language.
- **A page counts on arrival too.** Don't list the page an ad or a newsletter lands on, or every
  click on it counts as a conversion.
- **The list is public:** it is in every page's data. A query isn't compared, so leave any token out
  of a link.

### Because a component reports it

Some acts only a component can see: a copy that worked, a video watched past halfway, a quote worked
out. The component reports them with kit's `trackAction`, and a param lets the site's author decide,
page by page, whether the act is a conversion or an engagement:

```jsx
import { trackAction } from '@uniweb/kit'

<Terminal
  command={command}
  onCopied={() => trackAction(block, 'command_copied', params.commandConverts)}
/>
```

That is uniweb.io's call to action, where `Terminal` is the foundation's own command box. With the
author's param on, a copy is a conversion, and off it is still counted, as an engagement. [What Counts as a Conversion](../development/component-patterns.md#what-counts-as-a-conversion)
shows the param, and `block.track('conversion', { name: 'quote_requested' })` reports one that is
always a conversion.

---

## Choosing what counts

- **Count what shows intent.** A real prospect copies the install command, opens the quick start or
  signs up; a passing click does none of these. A hover, a press of play or opening the landing page
  isn't a result.
- **Give each act one name, and use it everywhere it happens**, so your reports add them up. Name the
  act, not the place: `command_copied`, not `hero_button`. Keep it short, since a collector may cut a
  long one.
- **Each name counts once per page load.** A double tap is one conversion, and so is a visitor coming
  back to a thank-you page. A reload is a new page load and counts again.
- **Count the result where you can see it.** If people sign up on another site, such as your app,
  list the link that leaves for it: your site can't see what happens after the visitor leaves.

---

## Carrying the campaign

A conversion often happens pages after the visitor arrived, when the address no longer holds the
campaign's tags. Name the query keys of the landing address that a conversion should carry:

```yaml
services:
  tracking:
    landing: [utm_source, utm_medium, utm_campaign, utm_content, utm_term, twclid, fbclid]
```

Each conversion then carries, as `landing`, the values its visitor arrived with, for the keys that
address had. They are read once, when the page first loads, and kept in memory for that page load.

- Only the keys you name are read, and only a conversion carries them. A page view still carries just
  the three campaign tags.
- If you advertise, keep the platforms' click IDs in the list, `twclid` for X and `fbclid` for Meta:
  they are how the platform learns which of its clicks converted.
- Where your host collects, it may name the keys itself, and a list of your own replaces its.

---

## Checking that one fires

Open the published page with your browser's developer tools on the Network panel, do the act, and
look for a `POST` whose body holds `"event": "conversion"` with your name. Reports leave in batches,
on a timer and whenever the page is hidden, so switching to another tab and back sends what is
waiting.

- **Use an ordinary browser window.** A collector may take an automated or headless browser for a
  bot and drop what it sends.
- **A test on the live site is a real report**, counted with the others. To keep an ad platform from
  counting it, see [Test before you spend](./advertising.md#test-before-you-spend).
- **Nothing is reported** from the app's editing preview, or under `uniweb dev` without a collector of
  your own.

---

## See Also

- [Measuring Visits](./measuring-visits.md): what every page reports
- [Advertising](./advertising.md): sending conversions to X and Meta
- [Conversions and engagements](../reference/site-configuration.md#conversions-and-engagements): the reference
- [trackAction](../reference/kit-reference.md#trackaction): the kit function
