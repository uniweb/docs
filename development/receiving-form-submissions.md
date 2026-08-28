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
| 2 | `services.submit` in the served payload | the host provides submission handling for this site |
| 3 | nothing | the site has no submission endpoint — draw no form |

That second row is not specific to forms. A host declares everything it offers
in one block, keyed by service name:

```js
// what the host serves in the payload — not something you author
config.services = {
  submit:    { endpoint: '/_submit' },
  search:    { endpoint: '/_search' },
  assistant: { endpoint: '/_agent/chat' },
  // A name absent from this block is not offered. So is a name present with no
  // `endpoint` — an explicit decline. Either way there is no address, which is
  // the whole answer.
}
```

Every service resolves the same way — your declaration, then the host's, then
neither — through one function, so a foundation reads them alike:

```js
import { resolveService } from '@uniweb/kit'

const { url, source } = resolveService(website, 'assistant')
if (!url) return null // this site has no assistant — render nothing, or degrade
```

**The service name is open.** The framework ships *clients* for what it
implements (search, form submission) and *resolution* for anything, so a
foundation can define a service the framework has never heard of and a host can
fill it without a framework change.

**On a host that handles submissions you configure nothing.** The host answers
for itself in the served payload: an endpoint when it will accept submissions
for this site, and no address when it will not. A `submit:` of your own
overrides whatever the host would have said.

⛔ **There is deliberately no explanatory string, and absence is not an error to
report to a visitor.** No endpoint means draw no form — or degrade to something
that still serves them, like a `mailto:` the site already carries in its
content. A visitor has no stake in which services the operator provisioned, and
"submissions are not enabled for this site" reports someone's billing state to
the public while reading like a breakage. It is neither. Any text a visitor
should read is *site content*, authored and localized — never a string the
framework invents in one language.

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

> **Your declaration outranks the host's, including when the host declined.**
> That's deliberate: a site posting to its own API, or to a form service, is
> nobody's business but the site's, and a host that could overrule it would have
> silent veto over where your visitors' data goes.
>
> The footgun is the narrow case where you point `submit:` at *the host's own*
> endpoint after the host declined to accept submissions for this site. The form
> then renders **live** — the framework has a destination and no way to know the
> host won't honour it — and the POST is rejected when it arrives. A visitor
> types an answer and loses it.
>
> So: declare `submit:` when you are providing the destination. If a host
> supplies one, let it, and leave `submit:` unset — that way a decline reaches
> the visitor as a disabled form with an explanation, which is the honest
> outcome, instead of a rejection after they have typed.

> **Status:** host-supplied destinations are live on Uniweb Cloud — a site
> published there gets one without declaring anything. Anywhere else, `submit:`
> is how you provide it.

---

## The component side

`useFormSubmit()` resolves the destination and tracks the request:

```jsx
import { useFormSubmit } from '@uniweb/kit'

export default function ContactForm({ content, block }) {
  const [values, setValues] = useState({})
  const { submit, status, error, canSubmit } = useFormSubmit({
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
| `canUploadFiles` | whether attachments can be delivered — check before rendering a file input |
| `submit(values, overrides?)` | send; resolves with the response, rejects on failure |
| `reset()` | back to `idle` |

**Check `canSubmit` when you render, not only when you submit.** A form that
only fails on the button press has already wasted someone's time filling it in.

**And don't explain the absence to your visitors.** The hook gives you a
boolean and no wording, deliberately: which services a site's operator bought
is not a visitor's concern, "submissions are not enabled" reads like a breakage
when nothing is broken, and any such sentence would be in one language on a site
that may be multilingual — or unilingual in something other than English. Text a
visitor reads belongs in your **content**, where it gets translated with
everything else. Render nothing, or fall back to contact details the site
already carries.

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

const { url } = resolveSubmitTarget(website)
if (!url) return null // no submission endpoint — draw no form

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
  "formId": "contact",
  "metadata": {
    "sectionType": "ContactForm",
    "sectionId": "contact",
    "pageId": "about",
    "pageLabel": "About Us",
    "preview": { "title": "Ada", "subtitle": "ada@example.com" }
  }
}
```

`formId` is a top-level field and the rest of the origin rides in `metadata`.
The split is worth knowing if you are writing the endpoint: `formId` is what
submissions are *grouped by*, so it is the one an endpoint typically stores as
its own column, while `metadata` is an opaque blob it reads back for display.
It is omitted entirely when nothing supplies one.

Anything non-2xx becomes a thrown `Error`. If the response body carries an
`error` string, that's the message — so an endpoint can explain a rejection
(validation, rate limiting) and the component displays it without knowing the
rules.

---

## Uploads

A form with a file field sends the answers and the attachments separately, so
bytes never ride inside the JSON. Pass the `File` objects and the rest is
handled:

```js
await submitForm({
  formData: values,
  target: url,
  files: [{ file, field: 'photos' }],   // or a bare File
})
// → { submissionId, filesUploaded: 1 }
```

Three requests: the manifest (derived from the files, so it cannot disagree with
them), then each file's bytes, then a finalize. `useFormSubmit` exposes
`canUploadFiles` for the render-time decision — check it where you decide
whether to show a file input, not after someone has attached something.

**The finalize step is checked, not assumed.** An endpoint reports what it
actually found in storage, and every upload can return 2xx with one still
missing — so a count lower than what was sent throws rather than resolving. When
the endpoint reports its own figures they come back to you:

```js
// → { submissionId, filesUploaded: 2, filesRecorded: 2, totalSizeBytes: 8213 }
```

An endpoint that reports nothing is not claiming a loss, and none is invented.

**Passing `fileSlots` instead of `files` sends a manifest with no bytes.** It is
still accepted, and it warns, because a declared attachment nobody receives is a
submission that looks complete and is not.

**A failure after the first request says what landed.** By then the submission
exists, so the error names it — *"submission sub-3 was recorded, but uploading
'big.pdf' failed"* — and a form can tell the visitor their message arrived and
their file did not, instead of reporting a flat failure or a false success.

---

## See Also

- [Site Configuration](../reference/site-configuration.md) — the `submit:` key
- [Kit Reference](../reference/kit-reference.md) — the full API
- [Writing Content](../authoring/writing-content.md) — how an author describes a form
