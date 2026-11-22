# A Picture in Every Language

A diagram, a screenshot or a map often has words in it, and those words are in one language. On a site in five languages that means five versions of the picture, redrawn each time the picture changes. Or the picture stays in English on every page.

Uniweb draws the picture's words over it as text instead. The words are content, translated with the rest of the page by the same `uniweb i18n` workflow. Where each word sits is data beside it, so one picture serves every language. Your section type renders one kit component, and the labels are in the prerendered page with no script.

This page works through a real case: the architecture picture on uniweb.io.

---

## The Example

uniweb.io is in English, Spanish, French, German and Chinese. Its backend page shows a picture of how a site connects to the Application Engine and the infrastructure behind it. The picture was drawn with its words in English, in a light version and a dark one:

![The architecture picture as drawn, its words in English](./_media/words-over-a-picture-en.webp)

On the French page, the same file shows its words in French:

![The same picture on the French page, its words in French](./_media/words-over-a-picture-fr.webp)

Each French word is a label drawn over the English one it replaces. It is set on a ground in the picture's own color behind it, so the English word underneath doesn't show. Words that are the same in every language, such as *PostgreSQL* and *Route 53*, have no label and stay as drawn. The English page shows the picture as it was made, with no labels at all.

---

## What the Section Holds

The section has its picture, the dark version beside it, and a tagged data block with the labels:

````markdown
![The bookstore website connects through Uniweb's Application Engine to PostgreSQL.](/stack-light.png)
![](/stack.png){role=dark}

```yaml:overlay
baked: [en]
sizes: { title: 4.3, label: 1, text: 1.05 }
color: "#0b1325"
ground: "#ecf4fe"
dark: { color: "#fbfdff", ground: "#0a1123" }
labels:
  - { text: "YOU", x: 20.9, y: 14.65, w: 8.8, h: 7.3, role: title, ground: "#fcfdff", dark: { color: "#e5e5e6" } }
  - { text: "INFRA", x: 80.6, y: 14.65, w: 14.2, h: 7.1, role: title, ground: "#f4f9ff", dark: { color: "#e6e6e7" } }
  - { text: "/ Identity", x: 52.8, y: 28.2, w: 10.6, h: 3.4, role: text, ground: "#e6f2fe" }
  - { text: "NAT Gateway", x: 71.8, y: 37.95, w: 7.4, h: 3.1, ground: "#f3f8fe" }
  - { text: "Firewall /\nSecurity", x: 91.8, y: 78.7, w: 6.6, h: 5.4 }
```
````

The real block has fourteen labels. You don't type these numbers: `uniweb label` places them as you draw ([below](#placing-the-labels)).

How the dark version is marked is uniweb.io's own choice: its section type shows the image with `{role=dark}` where the page is dark. A label's dark colors apply in the same places (see [Colors](#colors)).

---

## The Section Type

The block is of a standard type, `@std/overlay`, so declaring it takes one line. A block holds one overlay, so the key is declared as one record:

```js
// meta.js
export default {
  data: {
    overlay: { schema: '@std/overlay', single: true },
  },
}
```

The component wraps the picture in kit's `LabeledImage`. This is uniweb.io's, trimmed, with both versions inside:

```jsx
import { Image, LabeledImage } from '@uniweb/kit'

export function ArchitectureIllustration({ images, overlay }) {
  const image = images.find(({ role }) => role !== 'dark') ?? images[0]
  const darkImage = images.find(({ role }) => role === 'dark')

  return (
    <LabeledImage overlay={overlay} width={image.width} height={image.height} minScale={0.44}>
      <Image value={image} className="architecture-illustration__light" />
      {darkImage && <Image value={{ ...darkImage, alt: image.alt }} className="architecture-illustration__dark" />}
    </LabeledImage>
  )
}
```

The section passes `content.data.overlay` as `overlay`. `LabeledImage` places the labels and brings no looks. Your foundation gives each role its typeface and weight, as plain CSS on the class each label carries:

```css
.labeled-image__label { font-family: var(--font-code); font-weight: 500; line-height: 1.2; }
.labeled-image__label--title { font-weight: 700; }
```

That is all the code. The rest is content.

---

## What a Label Says

Each label has its words and a box on the picture. The box is in percent of the picture's width and height, so a label keeps its place at any size:

| Field | What it is |
|---|---|
| `text` | The words. The only field translated; a `\n` breaks a line |
| `x`, `y` | The center of the box |
| `w`, `h` | The size of the box: the words it covers, for a picture with words of its own |
| `role` | What the words are in the picture (below). `label` unless given |
| `align` | `left`, `center` or `right`: the side the label keeps when a longer translation grows it |
| `size` | Its own text size, in percent of the picture's width, over its role's |
| `color`, `ground`, `dark` | Its own colors, over the overlay's (see [Colors](#colors)) |

A label's role is one of four, and each is laid out its own way:

| `role` | For | Laid out |
|---|---|---|
| `title` | A heading in the picture: *YOU*, *INFRA* | One line. A longer translation grows the box |
| `label` | The name of a thing: a node, a part, a place | One line, grows |
| `text` | Words in a frame: a card's description | Wraps within `w`, centered in its frame; a longer translation grows it downward |
| `note` | Small print: a word on an arrow, a unit | One line, grows |

`sizes` gives each role's size for the whole picture, since how large a picture's words are belongs to the picture: a full-page screenshot's words are a smaller share of its width than a close-up's. With no size at all, your foundation's CSS sizes the role.

---

## Colors

By default, your foundation's CSS colors the labels: `--label-ink` for the words, and `--label-ground` for the ground behind them. That suits a picture made for the site in its theme's colors.

A picture made elsewhere, like this one, has colors no foundation knows. So the overlay can give them, as hex values:

- `color` is the color of the words, and `ground` is what is behind them where a label covers the picture's own words.
- Given on the overlay, a color applies to every label. Given on a label, it applies to that one, as for *YOU*, whose ground is lighter than most.
- `dark` holds the same two for the picture's dark version.

The dark colors apply where the page is dark, by the theme's own rule: the site's dark scheme, or a visitor's dark system when the site follows it, unless a section pins its own theme. They apply from the first paint, through rules in kit's `theme-tokens.css`, which every foundation imports. Show your picture's dark version on the same rule, under `.scheme-dark` and in a section pinned `.context-dark`, as uniweb.io's stylesheet does for its two classes. Where the overlay gives no dark value, the light one applies.

---

## Pictures That Show Their Own Words

`baked: [en]` says the picture shows its words itself, in English. So the English page shows it as drawn, and every other language covers its words with the labels.

Two other cases need nothing new:

- **A language with its own picture.** If a translator redraws the picture for German, the translation gives German its own file, as any [translated image](../authoring/translating.md) does. Add `de` to `baked`, and the German page shows its picture as drawn.
- **A picture without words.** It is the better case when you can have it: no ground to match, and nothing to hide. Leave out `baked`, and the labels show in every language, English included, with no ground.

---

## Placing the Labels

`uniweb label` opens a section's picture in your browser, on your machine, with each label as a box:

```bash
uniweb label                          # the sections with a picture's words to place
uniweb label pages/backend/1-hero.md
```

- **Draw a box loosely around a word.** It fits itself to the word, leaving out the lines and icons the box cuts through.
- **Give the label its words, its role and the side it keeps.** Move a label by dragging it, size it by its handles, and nudge it with the arrow keys.
- **Click *From the picture, every label*.** It takes each label's colors from the picture. What the labels share becomes the overlay's, and a label keeps its own where it differs. Switch to the dark version and do it again for its colors.
- **Check each language.** A button for each language shows the labels' words from the site's translations, and *Covers* shows them as a page in another language draws them.
- **Save.** It writes the block into the section's file, and nothing else in the file changes.

With `uniweb dev` running, *Open on the page* shows the section in each language, in your foundation's fonts. There you can see how the words fit.

---

## Translating

The labels are translated like the page's other words:

```bash
uniweb i18n extract     # offers each label's text, and nothing else in the block
```

Translate them in `locales/fr.json` and the rest, as any other string. A label whose words are the same in a language, like *Application Load Balancer* here, can be left untranslated, and it shows as written.

---

## Opening It Larger

A wide picture shows small in a column, and its words can come to a few pixels on a phone. `LabeledImage` offers to open the picture larger, only when that shows it larger, and the labels come along at the same proportion. Pass `enlarge={false}` to turn it off. For any other box that draws over a picture, kit's `Enlargeable` takes `whole` to do the same.

---

## Limits

- **A covering label hides words on a flat or gently shaded ground.** Over a photo, it shows as a patch. For such a picture, get a version without words.
- **A much longer translation grows its box or wraps.** Check it on the page in that language; `uniweb label` marks a translation longer than its box.
- **`uniweb label` doesn't know your fonts.** It measures with a common font, so whether a translation fits is for the page, in your foundation's fonts, to show.
- **No rotation or links yet.** A chart's vertical axis title, or a label that links somewhere, would each be an optional field added later, without changing what is stored.

---

## See Also

- [`LabeledImage`](../reference/kit-reference.md#labeledimage) and [`Enlargeable`](../reference/kit-reference.md#enlargeable) in the kit reference
- [`uniweb label`](../reference/cli-commands.md#uniweb-label) and [`uniweb i18n`](../reference/cli-commands.md#uniweb-i18n) in the command reference
- [Internationalization](./internationalization.md), for how a site's words are translated
- [The standard data types](../reference/component-metadata.md), with `@std/overlay`
