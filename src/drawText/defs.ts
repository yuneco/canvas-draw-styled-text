import { ExtensionInstructions, StyleExtension } from './extension'


export type Style<E extends string = ''> = {
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  fontStyle: 'normal' | 'italic' | 'oblique'
  extension?: Partial<ExtensionInstructions<E>>
}

export const FONT_WEIGHT_NORMAL = 400
export const FONT_WEIGHT_BOLD = 700

/**
 * style change instruction.
 */
export type StyleInstruction<E extends string = ''> = {
  /** position at char index */
  at: number
  /** style to change */
  style: Partial<Style<E>>
}

type Extensions<E extends string = ''> = E extends '' ? {} : { [K in E]: StyleExtension }
type ExtensionRegister<E extends string = ''> = E extends '' ? {} : {extensions: Extensions<E>}

export type StyledTextSetting<E extends string = ''> = {
  /** initial style */
  initialStyle: Style<E>
  /** line height */
  lineHeight?: number
  /** text align */
  align?: 'left' | 'center' | 'right'
  /** text direction */
  direction?: 'vertical' | 'horizontal'
} & ExtensionRegister<E>

/**
 * text with style instructions.
 */
export type StyledText<E extends string = ''> = {
  /** source text */
  text: string
  /** style change instructions */
  styles: StyleInstruction<E>[]
} & StyledTextSetting<E>

/** char metrix */
export type CharMetrix = {
  metrix: TextMetrics
  textChar: string
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
}

/**
 * computed line text.
 */
export type LineText<E extends string = ''> = {
  lineMetrix: LineMetrix
  charsWithStyle: {
    char: CharMetrix
    style?: Partial<Style<E>>
  }[]
}
