# Draw styled text on Canvas

Demo:
https://yuneco.github.io/canvas-draw-styled-text/

## Features

This package provides a function to draw styled text on Canvas. It supports the following features:

- [x] font size
- [x] font family
- [x] font color
- [x] font weight
- [x] text align: left, center, right
- [x] line height
- [x] writing mode: horizontal-tb, vertical-rl（Japanese 縦書き）
- [x] text decoration: underline, line-through, overline
- [x] extensions: create your custom styles

Note: This package is still in exprimental stage. All the API may change in the future.

## Usage

### Installation & Import.

To get started, install the package via npm:

```sh
npm install @yuneco/canvas-text-styled
```

Then, import the drawStyledText function in your JS/TS code:

```ts
import { drawStyledText, defineText } from '@yuneco/canvas-text-styled'
```

### Drawing Styled Text

```ts
// Define your styled text as JSON object.
// defineText is a helper function for TypeScript users.
const sampleText = defineText({
  // text
  text: `Hello, world!
multiline text is supported.`,

  // text box common settings
  setting: {
    lineHeight: 1.5,
    align: 'left',
    direction: 'horizontal',
    // overflow wrap mode. css property 'overflow-wrap' compatible.
    // basically, line breaks at the end of the word. only difference is when a word is longer than the line width.
    // 'normal' (default): word will be overflowed.
    // 'break-word': word will be split at the middle.
    // note: if single character is longer than the line width, it will be overflowed in both cases.
    overflowWrap: 'normal',
    // lang for Intl.Segmenter (used for get char length)
    lang: 'en',
  },

  // extensions.
  // pass an empty object if you don't need it.
  extensions: {},

  // initial style
  initialStyle: {
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontColor: '#333',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },

  // style change instructions.
  // pass an empty array if you don't need it.
  styles: [],
})

// Get the canvas context
const ctx = yourCanvas.getContext('2d')
if (!ctx) {
  throw new Error('Failed to get canvas context')
}

// Draw the text on the canvas at (0, 0) with a wrap width of 300px
drawStyledText(ctx, sampleText, 0, 0, 300)
```

### Using Multiple Styles

You can apply multiple styles to your text:

```ts
const sampleText = defineText({
  // text
  text: `Hello, world!
multiline text is supported.`,
  // initial style
  initialStyle: {
    // ...
  },
  // text box common settings
  setting: {
    // ...
  },
  // change style
  styles: [
    // change color to red at 5th character.
    // other style properties are inherited from initialStyle.
    {
      at: 5,
      style: { fontColor: 'red' },
    },
    // change font size to 30px at 10th character.
    // note that fontColor is inherited from previous style.
    {
      at: 10,
      style: { fontSize: 30 },
    },
  ],
})
```

### Using Pre-measured Information for Performance Optimization

The drawStyledText function returns a MeasuredMatrix object, which can be used for performance optimization:

```ts
// draw and get mesured info
const mesured = drawStyledText(ctx, sampleText, 0, 0, 300)
// change line height
sampleText.lineHeight *= 1.5
// draw with pre-measured info
drawStyledText(ctx, sampleText, 0, 500, 300, mesured)
```

The pre-measured information includes line break positions and the size of each character's bounding box. Therefore, it is intended to be reused exclusively for the same text content and under the same wrap width settings. Using it for different text or wrap width configurations may lead to rendering issues or errors.

If you do not anticipate the need to repeatedly draw the same content or if performance optimization is not a concern for your application, you can ignore this feature.

### Vertical Writing

Set `direction: 'vertical'` to lay out lines vertically (top to bottom, right to left). The text box is drawn from `(x, y)` downward, and `maxWidth` is used as the line length.

By default, the canvas renders each glyph according to the CSS `writing-mode` of the canvas element (e.g. upright CJK and rotated Latin with `vertical-rl`), so set it on your canvas:

```ts
canvas.style.writingMode = 'vertical-rl'
drawStyledText(ctx, verticalText, 300, 0, 400)
```

> [!WARNING]
> Chrome 154 and later render canvas text horizontally regardless of the canvas element's CSS `writing-mode`, following the HTML spec. With the default settings, CJK characters in vertical text are drawn sideways on these versions.

#### `canvasWritingMode`

`setting.canvasWritingMode` specifies the CSS `writing-mode` of canvases used for measuring and drawing, independently of `direction`. For example, with a font whose glyphs, advances and orientations are prepared for vertical writing, you can lay out lines vertically while the canvas renders text horizontally. This works the same in browsers that apply CSS `writing-mode` to canvas text and in browsers that don't.

```ts
const verticalText = defineText({
  text: '日本語とEnglish 123',
  setting: {
    direction: 'vertical',
    canvasWritingMode: 'horizontal-tb',
  },
  extensions: {},
  initialStyle: {
    // a font prepared by your app for vertical writing
    fontFamily: '"Your Vertical Font"',
    fontSize: 32,
    fontColor: '#000',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },
  styles: [],
})
drawStyledText(ctx, verticalText, 300, 0, 400)
```

- When specified, the value is used for measurement, and applied to the drawing canvas only while `drawStyledText` is running. The canvas's inline `writing-mode` is restored afterwards (an inline `!important` priority is not preserved).
- When omitted, measurement uses the writing mode matching `direction` and the drawing canvas's CSS is left as is.
- `canvasWritingMode` doesn't convert glyphs. Specifying `'horizontal-tb'` alone does not make a regular font look like vertical writing. Preparing such a font is up to your app.
- `'vertical-rl'` doesn't guarantee that the browser applies CSS vertical writing to canvas text.

#### `rotateGrapheme`

`setting.rotateGrapheme` rotates specific graphemes when drawing. It is called for each grapheme, and returning `90` or `-90` rotates the grapheme by the angle (degrees, clockwise) around its center, relative to how the canvas draws it in the line.

For example, with a font prepared for vertical writing, graphemes missing in the font (e.g. emoji) are drawn with a fallback font and appear sideways in vertical text. Rotate them by `-90` to cancel the rotation of the line:

```ts
import { isEmoji } from '@yuneco/canvas-text-styled'

setting: {
  direction: 'vertical',
  canvasWritingMode: 'horizontal-tb',
  // appFontCovers: your own check of the font's character coverage (optional)
  rotateGrapheme: (g) => (isEmoji(g) || !appFontCovers(g) ? -90 : undefined),
},
```

- It is called when measuring, for every grapheme except line breaks, in any `direction` and `canvasWritingMode`. It should return the same result for the same grapheme.
- Values other than `90` and `-90` mean no rotation.
- The advance of a rotated grapheme is 1em (`fontSize` of its style), regardless of its glyph width. The size across the line doesn't change, so a rotated glyph wider than 1em may overflow the line.
- With a `vertical-rl` canvas, the rotation is applied in addition to the browser's vertical text rendering.
- `isEmoji(grapheme)` returns true for graphemes displayed as emoji by default (with `Emoji_Presentation` characters or VS16 `U+FE0F`), e.g. `😀`, `👨‍👩‍👧`, `🇯🇵`, `❤️`, `1️⃣`, and false for text presentation characters such as `❤`, `©` and `1`.

### Use Extensions

You can use extensions to add your own custom styles. As an example, canvas-text-styled package provide `underLineExtension`.

To use the extension, you need to pass it to the `extensions` property of the `defineText` function:

```ts
import { drawStyledText, defineText, underLineExtension } from '@yuneco/canvas-text-styled'

const sampleText = defineText({
  // text
  text: `Hello, world!
multiline text is supported.`,

  // text box common settings
  setting: {
    /* ... */
  },

  // extensions.
  // pass key-value pairs.
  // key: extension name. you can use any string as this name.
  // value: extension object.
  extensions: {
    underline: underlineExtension,
  },

  // initial style
  initialStyle: {
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontColor: '#333',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
    // settings for underline extension
    // (only required if you want to use the extension as an initial style)
    underline: true,
  },

  // style change instructions.
  styles: [
    {
      at: 5,
      style: {
        // disable underline at 5th character.
        // this change will be applied until the next style change for underline.
        underline: false,
      },
    },
    {
      at: 10,
      style: {
        // enable underline at 10th character.
        // you can pass an object to customize the style.
        // (options are defined in each extension).
        underline: {
          width: 2,
        },
      },
    },
    {
      at: 15,
      style: {
        // other style changes are not affected to underline extension.
        // so {underline: width: 2} is still applied here.
        color: 'red',
      },
    },
  ],
})
```

### Create Your Own Extensions

You can create your own extensions. An extension is an object that implements the `Extension` interface. Below is an example of a `marker` extension that draws a colored line under the text:

```ts
import { Extension } from '@yuneco/canvas-text-styled'

/**
 * options for marker extension.
 * if true, default options will be used.
 */
type MarkerOption =
  | true
  | {
      /** marker width as percentage of line height */
      width: number
      /** color of marker */
      color: string
    }

const defaultMarkerLineOption: MarkerOption = {
  width: 50,
  color: '#ff0',
}

/**
 * marker extension.
 */
export const markerExtension: Extension<MarkerOption> = {
  /**
   * Drawing function for the extension.
   * If initialStyle and styles indicate that the extension should be applied,
   * this function will be called before draw text of each segment of the text.
   */
  beforeSegment: (ctx, segment, options) => {
    // check passed option and use the default if necessary.
    const opt = options === true ? defaultMarkerLineOption : { ...defaultMarkerLineOption, ...options }
    // Calculate the position and size of the marker.
    // 2nd parameter includes the text content and the position of the exch character.
    const lh = segment.line.lineMetrix.lineAscent + segment.line.lineMetrix.lineDescent
    const w = (opt.width / 100) * lh
    const y = segment.pos.y + lh - w / 2
    ctx.save()
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.strokeStyle = opt.color
    ctx.lineWidth = w
    ctx.moveTo(segment.pos.x + w / 2, y)
    ctx.lineTo(segment.pos.x - w / 2 + segment.text.reduce((sum, c) => sum + c.metrix.width, 0), y)
    ctx.stroke()
    ctx.restore()
  },
}
```

## License

MIT

## Contact

https://twitter.com/yuneco
