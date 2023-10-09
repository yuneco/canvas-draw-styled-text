import { Extension } from '../drawText/defs/extension'

/**
 * options for marker extension.
 * if true, default options will be used.
 */
type MarkerOption =
  | true
  | {
      /** marker width as percentage of line height */
      width: number
      /** color of marker */
      color: string
    }

const defaultMarkerLineOption: MarkerOption = {
  width: 50,
  color: '#ff0',
}

/**
 * marker extension.
 */
export const markerExtension: Extension<MarkerOption> = {
  beforeSegment: (ctx, segment, options) => {
    const opt = options === true ? defaultMarkerLineOption : { ...defaultMarkerLineOption, ...options }
    const lh = segment.line.lineMetrix.lineAscent + segment.line.lineMetrix.lineDescent
    const w = (opt.width / 100) * lh
    const y = segment.pos.y + lh - w / 2
    ctx.save()
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.strokeStyle = opt.color
    ctx.lineWidth = w
    ctx.moveTo(segment.pos.x + w / 2, y)
    ctx.lineTo(segment.pos.x - w / 2 + segment.text.reduce((sum, c) => sum + c.metrix.width, 0), y)
    ctx.stroke()
    ctx.restore()
  },
}
