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
import { drawStyledText, drawStyledText } from '@yuneco/canvas-text-styled'
```

### Drawing Styled Text

```ts
import { defineText,  } from "@yuneco/canvas-text-styled";

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

### Use Extensions

You can use extensions to add your own custom styles. As an example, canvas-text-styled package provide `underLineExtension`.

To use the extension, you need to pass it to the `extensions` property of the `defineText` function:

```ts
import { defineText, underLineExtension } from "@yuneco/canvas-text-styled";

const sampleText = defineText({
  // text
  text: `Hello, world!
multiline text is supported.`,

  // text box common settings
  setting: { /* ... */ },

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
