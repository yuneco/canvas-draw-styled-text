export type Style = {
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  fontStyle: 'normal' | 'italic' | 'oblique'
}

export const FONT_WEIGHT_NORMAL = 400
export const FONT_WEIGHT_BOLD = 700

export type StyleInstruction = {
  at: number
  style: Partial<Style>
}

export type StyledText = {
  text: string
  initialStyle: Style
  styles: StyleInstruction[]
  lineHeight?: number
  align?: 'left' | 'center' | 'right'
  direction?: 'vertical' | 'horizontal'
}

export type CharMetrix = {
  metrix: TextMetrics
}

export type LineMetrix = {
  at: number
  width: number
  lineAscent: number
  lineDescent: number
}

export type MeduredMatrix = {
  charWidths?: CharMetrix[]
  lineBreaks?: LineMetrix[]
}