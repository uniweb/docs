# Advertising

An ad platform decides who sees your ad, and it learns from what you tell it. This guide sets up
that feedback: your site reports what visitors do, and the platform hears which of its clicks led
to a result.

> **Audience:** whoever runs a site's ads, and the developer who sets the site up for them.

---

## Why the platform needs to hear back

A campaign judged by clicks or likes gets the cheapest clicks and likes the platform can find. The
cheapest come from accounts that like whatever their feed shows and click on ads: bots, and people
paid to engage. They never read a page or sign up, so the campaign looks busy and brings nobody.

A real prospect behaves differently once they arrive. They read, they stay, and some of them do what
the site is for. When the platform hears which of its clicks led to that, it can look for more
people like them, and a campaign set to optimize for a conversion spends on them instead of on
clicks. A like or a click is cheap to fake, but a conversion on your own site isn't.

So the loop needs three things:

1. **What counts**, which you decide: your [conversions](./conversions.md).
2. **The ad's click, kept with the visitor**: the platform's click ID, from the address the ad
   brought them to.
3. **A way back to the platform**: its pixel in your pages, or its conversions API called from a
   server. Uniweb Cloud does the second, so no platform script runs in your visitors' browsers.

---

## Tag the ad's link

Give each ad a link with campaign tags, so your own reports can tell its visitors apart:

```text
https://example.com/start?utm_source=X&utm_medium=paid_social&utm_campaign=spring&utm_term=developers&utm_content=video
```

- **One tag for each level you compare:** the campaign in `utm_campaign`, the ad group in
  `utm_term`, and the ad in `utm_content`. On a search ad, `utm_term` usually holds the keyword
  instead.
- **Keep paid and free apart:** `utm_medium=paid_social` on an ad and `social` on a post. With the
  same tags, the visitors an ad bought are counted with those a post brought for free.
- **Keep all five tags in [`landing`](./conversions.md#carrying-the-campaign).** Page views carry
  only the source, medium and campaign; a conversion carries whatever that list names.
- **The platform adds its own click ID** to the address, `twclid` from X and `fbclid` from Meta, so
  leave it out of the link you give it.
- **Land on a page that isn't a conversion,** or every click counts as one.

### Let the platform fill in the names

You don't have to write a link for each ad. A platform fills in placeholders in an ad's link when it
shows the ad. In X Ads Manager, `{{campaign_name}}`, `{{adgroup_name}}` and `{{ad_name}}` become the
names you gave the campaign, the ad group and the ad, so one link serves every ad:

```text
https://example.com/start?utm_source=X&utm_medium=paid_social&utm_campaign={{campaign_name}}&utm_term={{adgroup_name}}&utm_content={{ad_name}}
```

- **Names or IDs.** X also offers `{{campaign_id}}`, `{{adgroup_id}}` and `{{ad_id}}`. Names read
  better in a report; IDs survive a rename and match the platform's own reports. Choose before the
  ads run, and leave the names alone once they do, or one ad's visitors can end up in two rows.
- **Name things the way you want them in a report:** short, and in one style, such as
  `spring-launch` and `developers`. The name is the tag.
- **Tag only what you'll compare.** Each different set of values is a row of its own in a campaign
  report. `{{placement}}` and `{{site_source}}` say where an ad was shown, and in a tag they multiply
  every ad's rows by the places it appeared. A key other than the five `utm_` tags reaches your
  reports only through a conversion's `landing`, and only if the list names it.
- **Don't name a live campaign `test`.** With `{{campaign_name}}` in its link, every visitor would
  arrive with the test tag, and no conversion would reach the platform
  ([Test before you spend](#test-before-you-spend)).
- **Each platform has its own spelling.** Meta's are `{{campaign.name}}`, `{{adset.name}}` and
  `{{ad.name}}`. Check the list your platform offers.
- **After a click on the live ad, read the address you land on.** A misspelled placeholder can arrive
  as written.

---

## Connect X or Meta, on Uniweb Cloud

Your host sends the conversions your site reports to X or Meta from its servers. Nothing goes in
your pages. Name the platform's pixel in `site.yml`, and map each conversion to the event you made
for it on the platform:

```yaml
services:
  x:
    pixel: 'o1abc'                      # your X pixel ID
    events:
      signup: 'tw-o1abc-o2def'          # a conversion your site reports → its event in X
      command_copied: 'tw-o1abc-o3ghi'
```

Then set the platform's token from the site's folder. Uniweb Cloud keeps it, and it never goes in a
file:

```bash
uniweb site secret x token
```

The rows and the token take effect at your next publish. Where each platform gives its token, and
what each option does, is in [Ad platforms: X and Meta](../reference/site-configuration.md#ad-platforms-x-and-meta).

What the host sends is narrow:

- **Only for a visitor who arrived through one of the platform's ads,** as their landing address
  shows. Everyone else's conversions stay in your own reports.
- **Only conversions that have an event in `events`.** An engagement is never sent.
- **With the ad's click, the visitor's IP address and browser, the page and the time.** Those are
  what let the platform match the conversion to its click.

---

## One event for each act

Make an event on the platform for each act you count, and map each name to its own. The platform
then reports sign-ups apart from copies, and you can choose which of them a campaign optimizes for.
Mapping several names to one event also works, but the platform then counts them as a single act,
even though your own reports keep each name.

---

## Test before you spend

- **A landing address with `utm_campaign=test` marks a test click.** Its conversions are never sent,
  so you can try the whole site side, from the ad's link to the conversion, without the platform
  counting it. [Checking that one fires](./conversions.md#checking-that-one-fires) shows how to watch
  for it.
- **To see the platform receive one, click your own live ad and do the act.** The click is real, and
  it is counted like any other. The platform's events screen then shows the event as received.
- **Don't leave the test tag on a live ad.** None of its conversions would reach the platform.

---

## Tell your visitors

Each conversion that is sent gives the platform the visitor's IP address, browser and ad click. Say so
in your privacy policy: which platform, what it receives, and when. That is only for visitors who
came from its ads and then did something the site counts.

---

## Judge a campaign by what its visitors do

The platform charges for clicks, so judge a campaign by what came of them. Compare campaigns by their
visitors: how many converted, which acts they did, and how long they stayed on the pages they
opened. A campaign with many arrivals, short stays and no conversions is buying the wrong audience,
however good its click rate looks.

---

## Anywhere else

On a static host there is no server to send conversions. Install the platform's own tag with
[`head.html`](../reference/site-configuration.md#custom-head-injection), and follow its instructions
for reporting conversions from the browser. The `x` and `meta` rows do nothing there, and a build
leaves them out.

---

## See Also

- [Conversions and Engagements](./conversions.md): deciding what counts
- [Measuring Visits](./measuring-visits.md): what every page reports, and campaign tags
- [Ad platforms: X and Meta](../reference/site-configuration.md#ad-platforms-x-and-meta): the reference
- [`uniweb site secret`](../reference/cli-commands.md#uniweb-site): setting a token
