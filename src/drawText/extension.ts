import { CharMetrix, LineText, Style } from '..'

/** extensions option. instructed on initialStyle or styles array */
type Options = true | Record<string, string | number | boolean>

/** context when drawing chars */
type DrawingSegment = {
  /** current line info */
  line: LineText,
  /** segment to draw */
  text: CharMetrix[],
  /** position of start this segment */
  pos: { x: number; y: number },
  /** style for this segment */
  style: Style,
}

/** extension definition */
export type StyleExtension = {
  apply: (
    /** canvas context */
    ctx: CanvasRenderingContext2D,
    /** drawing content and context info */
    segment: DrawingSegment,
    /** extension options */
    options: Options
  ) => void
}

export type ExtensionInstructions<KS extends string> = {
  [K in KS]: Options | false
}
