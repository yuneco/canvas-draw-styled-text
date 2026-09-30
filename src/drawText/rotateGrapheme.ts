import { CharMetrix } from './defs/metrix'
import { GraphemeRotation } from './defs/style'

const TEXT_METRICS_KEYS = [
  'actualBoundingBoxAscent',
  'actualBoundingBoxDescent',
  'actualBoundingBoxLeft',
  'actualBoundingBoxRight',
  'alphabeticBaseline',
  'emHeightAscent',
  'emHeightDescent',
  'fontBoundingBoxAscent',
  'fontBoundingBoxDescent',
  'hangingBaseline',
  'ideographicBaseline',
] as const

/** normalize a value returned by `setting.rotateGrapheme` */
export const toRotation = (value: unknown): GraphemeRotation | undefined =>
  value === 90 || value === -90 ? value : undefined

/**
 * copy text metrics with another advance width.
 * TextMetrics properties are getters of the native object, so they can't be overridden by spreading.
 */
export const withAdvance = (metrix: TextMetrics, width: number): TextMetrics => {
  const copied: Record<string, number> = { width }
  TEXT_METRICS_KEYS.forEach((key) => {
    const value = (metrix as unknown as Record<string, number | undefined>)[key]
    if (value !== undefined) {
      copied[key] = value
    }
  })
  return copied as unknown as TextMetrics
}

/**
 * draw a rotated grapheme around the center of its em box.
 * @param x start of the char along the line
 * @param baselineY baseline position used for other chars in the line (with current ctx.textBaseline)
 */
export const drawRotatedGrapheme = (
  ctx: CanvasRenderingContext2D,
  char: CharMetrix,
  rotation: GraphemeRotation,
  x: number,
  baselineY: number
) => {
  const { metrix } = char
  // offset from the baseline to the middle of the em box. 0 when textBaseline is 'middle'
  const ascent = metrix.emHeightAscent ?? metrix.fontBoundingBoxAscent
  const descent = metrix.emHeightDescent ?? metrix.fontBoundingBoxDescent
  ctx.save()
  ctx.translate(x + metrix.width / 2, baselineY - (ascent - descent) / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char.textChar, 0, 0)
  ctx.restore()
}
