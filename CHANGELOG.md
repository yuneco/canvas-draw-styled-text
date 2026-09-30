# Changelog

## 0.1.14

### Added

- `setting.rotateGrapheme` (`(grapheme: string) => 90 | -90 | undefined`): rotates specific graphemes around their center when drawing. A rotated grapheme advances 1em. See [rotateGrapheme](./README.md#rotategrapheme).
  - With `direction: 'vertical'` and `canvasWritingMode: 'horizontal-tb'`, return `-90` for graphemes missing in a font prepared for vertical writing (e.g. emoji) to show them upright.
- `isEmoji(grapheme)`: whether the grapheme is displayed as emoji by default.
- Exported type `GraphemeRotation`. `CharMetrix` has an optional `rotation` for rotated graphemes.

### Unchanged

- Without `rotateGrapheme`, measurement and rendering are the same as 0.1.13.

## 0.1.13

### Added

- `setting.overflowWrap` (`'normal' | 'break-word'`, default `'normal'`), compatible with the CSS `overflow-wrap` property. With `'break-word'`, a word longer than the wrap width is broken between graphemes to fit in the line. A single grapheme wider than the wrap width still overflows.

### Fixed

- `lineBreaks` no longer contains an empty line before a word longer than the wrap width at the beginning of the text or right after a newline. Previously, such a word was preceded by an empty line (`width: 0`, same `at` as the next line).
  - The rendering and `outerBox` are the same as before, because the empty line had no height.
  - **The number and contents of `lineBreaks` returned by `measureStyledText` / `drawStyledText` change for such text.** Check your code if it depends on them (e.g. counting lines or mapping text positions to lines).

## 0.1.12

### Added

- `setting.canvasWritingMode` (`'horizontal-tb' | 'vertical-rl'`): specifies the CSS `writing-mode` of canvases used for measuring and drawing text, independently of the layout `direction`. See [Vertical Writing](./README.md#vertical-writing).
  - This is a workaround for Chrome 154+, which renders canvas text horizontally regardless of the canvas element's CSS `writing-mode`. Combine `direction: 'vertical'` and `canvasWritingMode: 'horizontal-tb'` with a font prepared for vertical writing.
  - When specified, `drawStyledText` applies it to the drawing canvas while drawing and restores the canvas's inline `writing-mode` afterwards. **If you have been setting and restoring the drawing canvas's `writing-mode` yourself to match the measurement (e.g. with a patched 0.1.11), it's no longer needed.**
  - The Safari 15 vertical text offset fix is not applied when `canvasWritingMode` is `'horizontal-tb'`.
- Exported type `CanvasWritingMode`.

### Fixed

- `drawStyledText` now restores the canvas's `font-kerning` and the context state (`ctx.restore()`) even if an extension throws.

### Unchanged

- Without `canvasWritingMode`, measurement and rendering are the same as 0.1.11.

## 0.1.11

- Fixed word length for characters consisting of multiple code points in line breaking.
