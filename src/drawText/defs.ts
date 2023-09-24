export type Style = {
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  fontStyle: 'normal' | 'italic' | 'oblique'
}

export const FONT_WEIGHT_NORMAL = 400
export const FONT_WEIGHT_BOLD = 700

/**
 * style change instruction.
 */
export type StyleInstruction = {
  /** position at char index */
  at: number
  /** style to change */
  style: Partial<Style>
}

export type StyledTextSetting = {
  /** initial style */
  initialStyle: Style
  /** line height */
  lineHeight?: number
  /** text align */
  align?: 'left' | 'center' | 'right'
  /** text direction */
  direction?: 'vertical' | 'horizontal'
}

/**
 * text with style instructions.
 */
export type StyledText = {
  /** source text */
  text: string
  /** style change instructions */
  styles: StyleInstruction[]
} & StyledTextSetting

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
export type LineText = {
  lineMetrix: LineMetrix
  charsWithStyle: {
    char: CharMetrix
    style?: Partial<Style>
  }[]
}