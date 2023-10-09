import { CharMetrix, LineText } from './metrix'
import { Style } from './style'

/** context when drawing chars */
export type DrawingSegment = {
  /** current line info */
  line: LineText
  /** segment to draw */
  text: CharMetrix[]
  /** position of start this segment */
  pos: { x: number; y: number }
  /** style for this segment */
  style: Style
}

/** extension definition */
export type Extension<O> = {
  apply: (
    /** canvas context */
    ctx: CanvasRenderingContext2D,
    /** drawing content and context info */
    segment: DrawingSegment,
    /** extension options */
    options: O
  ) => void
}

/** extract option type from extension */
export type OptionOf<E> = E extends Extension<infer O> ? O : never

/** key-value map of set of extensions */
export type ExtensionsMap = {
  [name: string]: Extension<any>
}
/** options for extensions map */
export type ExtensionOptions<M extends ExtensionsMap> = Partial<{
  [K in keyof M]: Partial<OptionOf<M[K]>> | false
}>

/** initial style definition with extension options */
export type InitialStyleWithExtensionOptions<M extends ExtensionsMap> = Style & ExtensionOptions<M>

/** style definition with extension options */
export type StyleWithExtension<M extends ExtensionsMap> = Partial<Style> & ExtensionOptions<M>

/** style instruction with extension options */
export type StyleInstructionWithExtension<M extends ExtensionsMap> = {
  at: number
  style: StyleWithExtension<M>
}
