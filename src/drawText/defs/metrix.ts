import { ExtensionsMap, StyleWithExtension } from './extension'
import { GraphemeRotation } from './style'

/** char metrix */
export type CharMetrix = {
  /** metrics of the char. `width` is the advance (1em if rotated) */
  metrix: TextMetrics
  textChar: string
  /** rotation from `setting.rotateGrapheme`, if rotated */
  rotation?: GraphemeRotation
}

/** line metrix */
export type LineMetrix = {
  at: number
  width: number
  lineAscent: number
  lineDescent: number
}

/** pre-measured matrix */
export type MeduredMatrix = {
  charWidths: CharMetrix[]
  lineBreaks: LineMetrix[]
  outerBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * computed line text.
 */
export type LineText<M extends ExtensionsMap = any> = {
  lineMetrix: LineMetrix
  charsWithStyle: {
    char: CharMetrix
    style?: StyleWithExtension<M>
  }[]
}
