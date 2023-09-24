import { LineMetrix } from '..'

export const drawMetrixBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lineAscent: number,
  metrix: TextMetrics
) => {
  ctx.save()
  ctx.strokeStyle = 'red'
  ctx.strokeRect(
    x,
    y + lineAscent - metrix.actualBoundingBoxAscent,
    metrix.width,
    metrix.actualBoundingBoxAscent + metrix.actualBoundingBoxDescent
  )
  ctx.restore()
}

export const drawLineSeparator = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = 'blue'
  ctx.setLineDash([2, 2])
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  ctx.restore()
}

export const drawLineBox = (ctx: CanvasRenderingContext2D, x: number, y: number, currentLine: LineMetrix) => {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = 'blue'
  ctx.strokeRect(x, y, currentLine.width, currentLine.lineAscent + currentLine.lineDescent)
  ctx.setLineDash([5, 5])
  ctx.moveTo(x, y + currentLine.lineAscent)
  ctx.lineTo(x + currentLine.width, y + currentLine.lineAscent)
  ctx.stroke()
  ctx.restore()
}

export const drawOuterBox = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.save()
  ctx.strokeStyle = 'green'
  ctx.strokeRect(0, 0, w, h)
  ctx.restore()
}
