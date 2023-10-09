import { Extension } from '../drawText/defs/extension'

/**
 * options for underline extension.
 * if true, default options will be used.
 */
type UnderLineOption =
  | true
  | {
      /** width of underline */
      width: number
    }

const defaultUnderLineOption: UnderLineOption = {
  width: 1,
}

/**
 * underline extension.
 */
export const underLineExtension: Extension<UnderLineOption> = {
  beforeSegment: (ctx, segment, options) => {
    const opt = options === true ? defaultUnderLineOption : { ...defaultUnderLineOption, ...options }
    const y = segment.pos.y + segment.line.lineMetrix.lineAscent + 1
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = segment.style.fontColor
    ctx.lineWidth = opt.width
    ctx.moveTo(segment.pos.x, y)
    ctx.lineTo(segment.pos.x + segment.text.reduce((sum, c) => sum + c.metrix.width, 0), y)
    ctx.stroke()
    ctx.restore()
  },
}
