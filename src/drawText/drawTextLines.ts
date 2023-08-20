import { lineBreakWithCharMetrixes } from './breakLine'
import {
  Style,
  StyledText,
  CharMetrix,
  StyleInstruction,
  LineMetrix,
  MeduredMatrix,
} from './defs'

let DEBUG = false
export const setDebug = (debug: boolean) => {
  DEBUG = debug
}

// canvas for measure text
const sharedCanvas = document.createElement('canvas')
sharedCanvas.width = 1
sharedCanvas.height = 1
sharedCanvas.style.writingMode = 'vertical-rl'
const sharedCtx = sharedCanvas.getContext('2d')!

const setStyle = (ctx: CanvasRenderingContext2D, style: Style) => {
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  ctx.fillStyle = style.fontColor
}

const mesureTextCharWidth = (text: StyledText): CharMetrix[] => {
  const { initialStyle, styles } = text
  const charWidths: CharMetrix[] = []

  const instructions: StyleInstruction[] = []
  styles.forEach((s) => (instructions[s.at] = s))

  setStyle(sharedCtx, initialStyle)
  let currentStyle = { ...initialStyle }
  for (let i = 0; i < text.text.length; i++) {
    const char = text.text[i]
    const style = instructions[i]
    if (style) {
      currentStyle = { ...currentStyle, ...style.style }
      setStyle(sharedCtx, currentStyle)
    }
    charWidths.push({ metrix: sharedCtx.measureText(char) })
  }
  return charWidths
}

const linePadding = (line: LineMetrix, lineHeight: number) => {
  return ((line.lineAscent + line.lineDescent) * (lineHeight - 1)) / 2
}

const drawTextLinesWithWidthAndBreaks = (
  ctx: CanvasRenderingContext2D,
  styledText: StyledText,
  charWidths: CharMetrix[],
  breaks: LineMetrix[],
  maxWidth: number
) => {
  const { initialStyle, styles, text, lineHeight = 1 } = styledText
  const instructions: StyleInstruction[] = []
  styles.forEach((s) => (instructions[s.at] = s))
  const lines: LineMetrix[] = []
  breaks.forEach((b) => (lines[b.at] = b))

  // check text length equals charWidths length
  if (text.length !== charWidths.length) {
    throw new Error('text length and charWidths length are not equal')
  }

  const getLineStartX = () => {
    switch (styledText.align) {
      case 'center':
        return (maxWidth - currentLine.width) / 2
      case 'right':
        return maxWidth - currentLine.width
      default:
        return 0
    }
  }

  let currentLine = lines[0]
  let currentStyle = { ...initialStyle }
  setStyle(ctx, currentStyle)
  let x = getLineStartX()
  let y = ((currentLine.lineAscent + currentLine.lineDescent) * (lineHeight - 1)) / 2

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const cw = charWidths[i]
    const style = instructions[i]
    if (lines[i]) {
      // new line
      if (i !== 0) {
        y += currentLine.lineAscent + currentLine.lineDescent
        y += linePadding(currentLine, lineHeight)

        if (DEBUG) {
          ctx.save()
          ctx.beginPath()
          ctx.strokeStyle = 'blue'
          ctx.setLineDash([2, 2])
          const lx = getLineStartX()
          ctx.moveTo(lx, y)
          ctx.lineTo(lx + currentLine.width, y)
          ctx.stroke()
          ctx.restore()
        }

        currentLine = lines[i]
        x = getLineStartX()
        y += linePadding(currentLine, lineHeight)
      }
      // draw debug line box
      if (DEBUG) {
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
    }

    if (style) {
      currentStyle = { ...currentStyle, ...style.style }
      setStyle(ctx, currentStyle)
    }
    ctx.fillText(char, x, y + currentLine.lineAscent)

    // draw debug box
    if (DEBUG) {
      ctx.save()
      ctx.strokeStyle = 'red'
      ctx.strokeRect(
        x,
        y + currentLine.lineAscent - cw.metrix.actualBoundingBoxAscent,
        cw.metrix.width,
        cw.metrix.actualBoundingBoxAscent + cw.metrix.actualBoundingBoxDescent
      )
      ctx.restore()
    }

    x += cw.metrix.width
  }
}

export const drawTextLines = (
  ctx: CanvasRenderingContext2D,
  text: StyledText,
  x: number,
  y: number,
  maxWidth: number,
  preMedured?: MeduredMatrix
) => {
  sharedCanvas.style.writingMode = text.direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb'

  const charWidths = preMedured?.charWidths ? preMedured?.charWidths : mesureTextCharWidth(text)
  const lineBreaks =
    preMedured?.charWidths && preMedured?.lineBreaks
      ? preMedured?.lineBreaks
      : lineBreakWithCharMetrixes(text.text, charWidths, maxWidth)

  ctx.save()

  const boxHeight = lineBreaks.reduce((acc, cur) => acc + (cur.lineAscent + cur.lineDescent) * (text.lineHeight ?? 1), 0)
  if (text.direction === 'vertical') {
    ctx.rotate(Math.PI / 2 * 1)
    ctx.translate(y, - x)
  } else {
    ctx.translate(x, y)
  }

  if (DEBUG) {
    // draw debug box
    ctx.save()
    ctx.strokeStyle = 'green'
    ctx.strokeRect(
      -1,
      -1,
      maxWidth + 2,
      boxHeight + 2
    )
    ctx.restore()
  }

  drawTextLinesWithWidthAndBreaks(ctx, text, charWidths, lineBreaks, maxWidth)
  ctx.restore()

  return {
    charWidths,
    lineBreaks,
  }
}

