# Receiving Form Submissions

A content author can describe a form in markdown — a `yaml:form` data block, or
whatever shape your section type reads. Drawing it is your foundation's job.
This guide covers the other half: getting what a visitor typed to a server.

> **Audience:** foundation developers building a section type that submits, and
> site developers wiring one up.

---

## A form is the one feature that needs a server

Most of Uniweb works with no backend at all. A form doesn't, and it's worth
being straight about why rather than papering over it: something has to accept
the POST, store it, and let someone read it later. That's a server, whether it's
your own endpoint, a form service, or a host that provides one.

So the framework does the small part — resolve a destination, POST, report what
happened — and refuses to invent the rest. **It never picks an endpoint on your
behalf.** What it will do is use one the host offers.

That refusal is deliberate. A failed *read* degrades gracefully — a fetch that
404s becomes `[]` and the page still renders. A failed *write* loses something a
person typed and can't be recovered. The two are not symmetric, so they don't
get the same fallback behaviour. A path the framework guessed at would 404 on
every deployment that had nothing listening, and nothing in the browser could
tell the difference between that and success.

---

## Where the destination comes from

Three possibilities, in precedence order:

| | Source | When |
|---|---|---|
| 1 | `submit:` in `site.yml` | you named an endpoint yourself |
| 2 | the host | it provides submission handling for this site |
| 3 | nothing | forms render disabled, with a reason |

**On Uniweb Cloud you normally configure nothing.** The platform handles
submissions, so a site published with `uniweb publish` gets a destination
without a `submit:` key — and setting one there overrides what the platform
would have supplied.

**Elsewhere, you provide it.** `uniweb export` produces a plain static site, and
most `deploy --host` targets have no opinion about forms, so those are the cases
`submit:` exists for.

### Declaring one

```yaml
submit: /forms                              # shorthand
submit: { endpoint: /forms }                # object form
submit: https://forms.example.com/intake    # another origin
```

A relative endpoint resolves against the site's `base:`, exactly as
`search.endpoint` does. One spelling works whether the site is served from the
root, from a subdirectory (`base: /docs/`), or from a host that serves it under
a subpath. An absolute URL is used as written.

**Either way the endpoint is the site's, not the component's.** A section type
never names one — that's what lets the same foundation serve a site posting to
its own API and a site whose host handles it, with no code change.

> **Status:** the host-supplied tier is not wired up yet — today a destination
> comes from `submit:` or nowhere, on every host. Declare one explicitly until
> this note goes away.

---

## The component side

`useFormSubmit()` resolves the destination and tracks the request:

```jsx
import { useFormSubmit } from '@uniweb/kit'

export default function ContactForm({ content, block }) {
  const [values, setValues] = useState({})
  const { submit, status, error, canSubmit, unavailableReason } = useFormSubmit({
    block,
    context: { formId: 'contact' },
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || status === 'submitting') return
    try {
      await submit(values)
    } catch {
      /* the hook captured it into `error` */
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* your fields */}

      {!canSubmit && <p role="status">{unavailableReason}</p>}
      {status === 'error' && <p role="alert">{error?.message}</p>}
      {status === 'success' && <p role="status">Thanks — we'll be in touch.</p>}

      <button type="submit" disabled={!canSubmit || status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}
```

What the hook returns:

| | |
|---|---|
| `status` | `'idle'` · `'submitting'` · `'success'` · `'error'` |
| `error` | the `Error` from a failed submission, or `null` |
| `response` | the endpoint's reply on success, or `null` |
| `canSubmit` | whether this site has a destination at all |
| `unavailableReason` | why not, when `canSubmit` is false |
| `submit(values, overrides?)` | send; resolves with the response, rejects on failure |
| `reset()` | back to `idle` |

**Check `canSubmit` when you render, not only when you submit.** A form that
only fails on the button press has already wasted someone's time filling it in.
`unavailableReason` is an English default — ignore it and render your own copy
if your site is localized.

### Options

```jsx
useFormSubmit({
  block,                                  // supplies section + page context
  context: { formId: 'contact' },         // your own identifiers
  summary: (v) => ({ title: v.name, subtitle: v.email }),
})
```

`block` is worth passing: the submission then carries which section type and
page it came from, so you don't assemble that by hand.

`summary` is a short human-readable digest — `{ title, subtitle, tag? }` — so
whoever reads submissions can tell them apart at a glance. Pass a function to
compute it from the values just submitted. Omit it and one is derived from the
first two non-empty text fields.

### Submitting outside React

`submitForm()` is the same thing without the state machine, and it takes an
already-resolved `target`:

```js
import { submitForm, resolveSubmitTarget } from '@uniweb/kit'

const { url, reason } = resolveSubmitTarget(website)
if (!url) return showUnavailable(reason)

await submitForm({ formData: values, target: url })
```

It throws rather than guessing when `target` is missing — same rule as the hook,
enforced one level down.

---

## What the endpoint receives

A JSON POST:

```json
{
  "formData": { "Name": "Ada", "Email": "ada@example.com" },
  "metadata": {
    "formId": "contact",
    "sectionType": "ContactForm",
    "sectionId": "contact",
    "pageId": "about",
    "pageLabel": "About Us",
    "preview": { "title": "Ada", "subtitle": "ada@example.com" }
  }
}
```

Anything non-2xx becomes a thrown `Error`. If the response body carries an
`error` string, that's the message — so an endpoint can explain a rejection
(validation, rate limiting) and the component displays it without knowing the
rules.

---

## Uploads

A form with a file field declares its uploads up front via `fileSlots`, and the
endpoint replies with somewhere to put the bytes:

```js
await submitForm({
  formData: values,
  target: url,
  fileSlots: [{ name: 'cv.pdf', size: file.size, mime: file.type }],
})
// → { submissionId, uploadUrls: [...] }
```

Two phases, so the bytes never ride inside the JSON. What the URLs are and how
long they last is the endpoint's business.

---

## See Also

- [Site Configuration](../reference/site-configuration.md) — the `submit:` key
- [Kit Reference](../reference/kit-reference.md) — the full API
- [Writing Content](../authoring/writing-content.md) — how an author describes a form
