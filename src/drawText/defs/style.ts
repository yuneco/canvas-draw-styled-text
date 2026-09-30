export type Style = {
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  fontStyle: 'normal' | 'italic' | 'oblique'
}

export const FONT_WEIGHT_NORMAL = 400
export const FONT_WEIGHT_BOLD = 700

export type BaseOptions = {
  /** line height */
  lineHeight?: number
  /** text align */
  align?: 'left' | 'center' | 'right'
  /** text direction */
  direction?: 'vertical' | 'horizontal'
  /**
   * CSS writing-mode of canvases used for measuring and drawing text.
   * It doesn't change layout (use `direction` for it) or glyphs themselves.
   *
   * - omitted: measure with the writing mode matching `direction`, and keep the drawing canvas's CSS as is.
   * - specified: measure with this writing mode, and apply it to the drawing canvas only while drawing.
   *
   * e.g. `direction: 'vertical'` with `'horizontal-tb'` lays out lines vertically
   * while the canvas renders text horizontally. Use it with a font prepared for vertical writing.
   *
   * NOTE: `'vertical-rl'` doesn't guarantee that the browser applies CSS vertical writing to canvas text.
   * Chrome 154+ always renders canvas text horizontally.
   */
  canvasWritingMode?: CanvasWritingMode
  /** text lang. default: html lang prop */
  lang?: string
  /**
   * how to wrap a word longer than the wrap width. default: 'normal'
   *
   * - 'normal': the word overflows the line.
   * - 'break-word': the word is broken at an arbitrary point (between graphemes) to fit in the line.
   */
  overflowWrap?: 'normal' | 'break-word'
  /**
   * rotate specific graphemes when drawing. called for each grapheme (except line breaks) when measuring,
   * and should return the same result for the same grapheme.
   *
   * - return `90` or `-90` to rotate the grapheme by the angle (degrees, clockwise) around its center,
   *   relative to how the canvas draws it in the line. other values (e.g. `undefined`) mean no rotation.
   * - the advance of a rotated grapheme is 1em (`fontSize` of its style) regardless of its glyph width.
   * - the size across the line is not changed. a rotated glyph wider than 1em may overflow the line.
   *
   * e.g. with `direction: 'vertical'` and `canvasWritingMode: 'horizontal-tb'`, lines are rotated by 90deg,
   * so return `-90` for graphemes to show upright (e.g. emoji missing in a font prepared for vertical writing).
   * with a `vertical-rl` canvas, the rotation is applied in addition to the browser's vertical text rendering.
   */
  rotateGrapheme?: (grapheme: string) => GraphemeRotation | undefined
}

/** rotation angle (degrees, clockwise) for `rotateGrapheme` */
export type GraphemeRotation = 90 | -90

/** CSS writing-mode for canvases */
export type CanvasWritingMode = 'horizontal-tb' | 'vertical-rl'
