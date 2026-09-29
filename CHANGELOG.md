# Changelog

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
