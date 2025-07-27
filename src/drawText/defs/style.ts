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
  /** text lang. default: html lang prop */
  lang?: string
  /** line breake method for overflown line. default is normal */
  overflowWrap?: 'normal' | 'break-word'
}
