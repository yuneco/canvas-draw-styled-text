# Draw styled text on Canvas 

Demo: 
https://yuneco.github.io/canvas-draw-styled-text/

## Features

- [x] font size
- [x] font family
- [x] font color
- [x] font weight
- [x] text align: left, center, right
- [x] line height
- [x] writing mode: horizontal-tb, vertical-rl（Japanese 縦書き）
- [] text decoration: underline, line-through, overline

## Usage

### Installation & Import.

To get started, install the package via npm:

```sh
npm install @yuneco/canvas-text-styled
```

Then, import the drawStyledText function in your JS/TS code:

```ts
import { drawStyledText } from '@yuneco/canvas-text-styled'
```

### Drawing Styled Text

```ts
// Define your styled text
const sampleText: StyledText = {
  // text 
  text: `Hello, world!
multiline text is supported.`,
  // initial style
  initialStyle: {
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontColor: '#333',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },
  // text box common settings
  lineHeight: 1.5,
  align: 'left',
  direction: 'horizontal',
  styles: [],
}

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
const sampleText: StyledText = {
  // text 
  text: `Hello, world!
multiline text is supported.`,
  // initial style
  initialStyle: {
    // ...
  },
  // text box common settings
  lineHeight: 1.5,
  align: 'left',
  direction: 'horizontal',
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
  ]
}
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

## License
MIT

## Contact
https://twitter.com/yuneco
