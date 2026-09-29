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
}

/** CSS writing-mode for canvases */
export type CanvasWritingMode = 'horizontal-tb' | 'vertical-rl'
