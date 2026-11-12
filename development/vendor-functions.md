# Vendor Functions

A site's backend can send an entry to another system when something happens, and write that system's answer back: a quiz submission goes out to be graded, and the grade comes back onto the submission ([Blueprint → Integrations](../reference/blueprint.md#integrations)). Usually that other system is a service someone runs at an address. When the work is small, such as grading a quiz against its answer key, a foundation can ship the logic itself: one plain JavaScript file of functions, which the platform runs for you. An integration names a function where it would otherwise need an address.

A vendor function runs outside the visitor's browser, so it can hold what a visitor must never see, like an answer key, and outside the site's backend, which stays the same for every site.

```js
// src/vendors/courses.js
export function grade(input) {
  const key = new Map(input.key.map((k) => [k.question, k.correct]))
  let points = 0
  for (const a of input.answers) {
    if (key.get(a.question) === a.chosen) points += 1
  }
  return { points, max: input.key.length }
}
```

```yaml
# blueprint.yml
integrations:
  auto-grade:
    mapping: '@/submission-to-grader'   # writes the function's input
    channel: http
    trigger: on_create
    vendor: '@/courses#grade'           # the file, then the function it exports
    reply: '@/grade-back'               # reads its answer back
    reply_about: identity.submission
    enabled: true
```

A vendor function is a calculator: data in, an answer out. Anything that needs the network, a secret, storage, a package, or more than a moment of work is a real service, reached at its address.

---

## Writing one

A foundation holds its vendor files in `src/vendors/`, and a library in its `vendors/`, one file per name: `src/vendors/courses.js` is the file `courses`. A file whose name starts with `_` is left out. Each file is a standard JavaScript module whose **named exports are its functions**, and an integration names one as `file#function`: `'@/courses#grade'`.

The file goes to the platform exactly as you wrote it. Nothing builds, bundles or minifies it, so it has to stand on its own:

- **No imports.** Keep a helper inside the file. A function that needs a package is a real service.
- **Named function exports only.** No default export, and nothing exported that isn't a function. Keep a table or a constant unexported.
- **Plain modern JavaScript.** It runs with the standard web globals (`JSON`, `Math`, `Intl`, `Date`, `crypto.subtle`), not in Node: `fs`, `process`, `Buffer` and `require` aren't there.

The foundation build stops on a file that breaks one of these, and names it. It also warns when a file uses a name of Node's (`process`, `Buffer`, `require`) or the network's (`fetch`) that it doesn't declare itself, since a test in Node lets these pass.

### Input and answer

A function takes one argument, `input`: the JSON the integration's `mapping` wrote, including what it reached through `follow`. It returns a JSON object, or a promise of one.

The answer is read through the integration's `reply` mapping, which takes only the fields it names and writes them onto the entry that was sent. Which entry and which fields an answer may change is the mapping's to say, never the function's.

To fail, throw an `Error` with a message a person can read. The integration's run is recorded as failed with that message, and the site's owner is told. An answer the reply mapping can't read fails the same way.

### A call changes nothing outside itself

One copy of a function serves many calls, from many sites, sometimes at once. So each call must depend only on its own `input`, and leave nothing behind for the next one:

```js
const keys = {}                    // ⛔ outlives the call
export function grade(input) {
  keys[input.quiz] ??= input.key   // keeps the first key ever sent for this quiz
  …
}
```

That is wrong twice: a corrected answer key is ignored, and another site sending the same quiz id is graded with this one's key.

What the file builds once, at its top, from its own code is fine: a rate table, a list of codes, a compiled pattern. Keep everything a call computes inside the call, and don't cache answers between calls. A running copy can be dropped and another started at any time, so nothing a function holds is storage.

The foundation build warns when a function writes to something declared at the top of the file: assigns to it, counts it up, or changes it with a method such as `set` or `push`. It reads names, so a write through another name for the same object gets past it.

### What it can't do

These are enforced when it runs:

- **No network.** `fetch()` throws.
- **No secrets or settings.** It receives nothing but `input`.
- **Frozen built-ins.** `Object.prototype`, `Array.prototype` and the rest can't be changed, and a module runs in strict mode, so a write to one throws. This includes *assigning* a property that a built-in prototype already has: `error.name = 'GradingError'` or `obj.toString = …` throws *"Cannot assign to read only property"*. Define it instead, in an object literal, with `Object.defineProperty`, or as a class field (`class GradingError extends Error { name = 'GradingError' }`).
- **A short time budget per call**, and limits on the size of its input and its answer.
- **Its own `console` output is discarded**, since it could hold what a learner answered. Run it on your machine instead, with `uniweb vendor run`.

### Testing

It's a plain module of pure functions, so import it in a test and call it:

```js
import { grade } from '../src/vendors/courses.js'

const answer = grade({ key: [{ question: 'q1', correct: 'b' }], answers: [{ question: 'q1', chosen: 'b' }] })
// { points: 1, max: 1 }
```

The test runs it in Node, which is more lenient than where it runs: built-ins aren't frozen there, and Node's globals and `fetch` work. To run it under the rules it runs by, use `uniweb vendor run`:

```bash
uniweb vendor run courses#grade --input test/submission.json
```

It prints the answer, or why the call failed, and the function's console output, which is discarded where it runs. A pass means the function keeps the rules above; it isn't the platform's runner, and the time it reports is your machine's. See [`uniweb vendor run`](../reference/cli-commands.md#uniweb-vendor-run).

---

## Sharing one through a library

A function several foundations use can live in a library's `vendors/`, named in the library's scope: `vendors/grading.js` in a library of `@acme` is `@acme/grading`. A foundation carries it by naming it in its `main.js`, and a site's `blueprint.yml` then names it in full:

```js
// src/main.js
export default {
  name: '@shop/classic',
  vendors: ['@acme/grading'],
}
```

```yaml
vendor: '@acme/grading#score'
```

The build reads each one from the library that defines it, checks it as a foundation's own is checked, and stops on a name not in full, one in the foundation's own scope (its own files are in `src/vendors/`), or one two packages define. A name no package of the workspace defines only warns, because it may already be registered. A site runs only functions its own foundations carry. See [Libraries](./libraries.md).

---

## On a site synced with a Uniweb backend

- `uniweb register` in a foundation registers each vendor file with it, by its name, the functions it exports, and a fingerprint of its bytes, and then uploads the file. A library's files go first, from the library, before the foundation that names them. `uniweb push` and `uniweb publish` do the same, and `uniweb register` run in a library registers and uploads all of its files.
- A file's version never changes. Registering a changed file makes a new version, and a site keeps the version its foundation registered with until the site is next published on a newer version of that foundation.
- If an upload is interrupted, run `uniweb register` again: the file is found by its fingerprint, and one already stored isn't sent again. Until its file is uploaded, an integration that names it is left out when the site's backend starts, and the publish says so.
- `blueprint.yml`'s checks warn when a line names a file none of the site's foundations carries, or a function the file doesn't export.
