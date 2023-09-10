# draw styled text on Canvas 

Demo: 
https://yuneco.github.io/canvas-draw-styled-text/

# Features

- [x] font size
- [x] font family
- [x] font color
- [x] font weight
- [x] text align: left, center, right
- [x] line height
- [x] writing mode: horizontal-tb, vertical-rl（Japanese 縦書き）
- [] text decoration: underline, line-through, overline

# Usage

## install & import

```sh
npm install @tuneco/canvas-draw-styled-text
```

```ts
import { drawStyledText } from '@tuneco/canvas-draw-styled-text'
```

## drawStyledText

```ts
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

// draw text on ctx at (0, 0) with 300px wrap width
const ctx = yourCanvas.getContext('2d')
drawStyledText(ctx, sampleText, 0, 0, 300)
```

## Use multiplt styles

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
    // change collor to red at 5th character.
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

## Use pre-measured info for performance optimization

`drawStyledText` function returns `MeduredMatrix` object. You can keep and reuse it for performance optimization.

```ts
// draw and get mesured info
const mesured = drawStyledText(ctx, sampleText, 0, 0, 300)
// change line height
sampleText.lineHeight *= 1.5
// draw with pre-measured info
drawStyledText(ctx, sampleText, 0, 500, 300, mesured)
```

pre-measured info contains line break positions and box size of each character.
So you can reuse it **only for same text and same wrap width**. Otherwise, rendering result will be broken or may cause error.

If you do not need to draw same contents repeatedly or do not mind performance optimization, you can ignore this feature.

# License
MIT

# Contact
https://twitter.com/yuneco
