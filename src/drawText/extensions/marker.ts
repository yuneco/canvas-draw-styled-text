import { StyleExtension } from "../extension"


type MarkerOption = {
  width: number
  color: string
}

const defaultUnderLineOption: MarkerOption = {
  width: 50,
  color: 'transparent'
} as const

export const markerExtension: StyleExtension = {
  apply: (ctx, segment, options) => {
    const opt = options === true ? defaultUnderLineOption : { ...defaultUnderLineOption, ...options }
    const lh = segment.line.lineMetrix.lineAscent + segment.line.lineMetrix.lineDescent
    const w = opt.width / 100 * lh
    const y = segment.pos.y + lh - w / 2
    ctx.save()
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.strokeStyle = opt.color
    ctx.lineWidth = w
    ctx.moveTo(segment.pos.x + w/2, y)
    ctx.lineTo(segment.pos.x -w /2+ segment.text.reduce((sum, c) => sum + c.metrix.width, 0), y)
    ctx.stroke()
    ctx.restore()
  }
}

