import { lineBreakWithCharMetrixes } from './breakLine'
import { drawLineBox, drawLineSeparator, drawMetrixBox, drawOuterBox } from './debugDraw'
import { Style, StyledText, CharMetrix, StyleInstruction, LineMetrix, MeduredMatrix } from './defs'

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
    charWidths.push({ metrix: sharedCtx.measureText(char), textChar: char })
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

        // draw line separator
        DEBUG && drawLineSeparator(ctx, getLineStartX(), y, currentLine.width)

        currentLine = lines[i]
        x = getLineStartX()
        y += linePadding(currentLine, lineHeight)
      }

      // draw line box
      DEBUG && drawLineBox(ctx, x, y, currentLine)
    }

    if (style) {
      currentStyle = { ...currentStyle, ...style.style }
      setStyle(ctx, currentStyle)
    }
    ctx.fillText(char, x, y + currentLine.lineAscent)

    // draw debug box
    DEBUG && drawMetrixBox(ctx, x, y, currentLine.lineAscent, cw.metrix)

    x += cw.metrix.width
  }
}

/**
 * mesure text with maxWidth without drawing.
 * @param text StyledText
 * @param maxWidth wrap width
 * @returns measured matrix. you can use this matrix for drawStyledText
 */
export const measureStyledText = (text: StyledText, maxWidth: number): MeduredMatrix => {
  sharedCanvas.style.writingMode = text.direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb'
  const charWidths = mesureTextCharWidth(text)
  const lineBreaks = lineBreakWithCharMetrixes(text.text, charWidths, maxWidth)
  return {
    charWidths,
    lineBreaks,
  }
}

/**
 * get size of text box.
 * @param preMesured pre measured matrix.
 * @returns size of text box.
 */
export const getSizeForMeasuredStyledText = (preMesured: MeduredMatrix): { width: number; height: number } => {
  const boxHeight = preMesured.lineBreaks.reduce((acc, cur) => acc + (cur.lineAscent + cur.lineDescent), 0)
  const boxWidth = Math.max(...preMesured.lineBreaks.map((l) => l.width))
  return {
    width: boxWidth,
    height: boxHeight,
  }
}

/**
 * draw styled text.
 * @param ctx drawing context of canvas.
 * @param text StyledText
 * @param x draw start x
 * @param y draw start y
 * @param maxWidth wrap width
 * @param preMedured pre measured matrix. if you want to draw same text multiple times, you can pass this matrix for speed up.
 * @returns measured matrix. you can use this matrix for drawStyledText. Otherwise, just ignore this return value.
 */
export const drawStyledText = (
  ctx: CanvasRenderingContext2D,
  text: StyledText,
  x: number,
  y: number,
  maxWidth: number,
  preMedured?: Partial<MeduredMatrix>
): MeduredMatrix => {
  sharedCanvas.style.writingMode = text.direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb'

  const charWidths = preMedured?.charWidths ? preMedured?.charWidths : mesureTextCharWidth(text)
  const lineBreaks =
    preMedured?.charWidths && preMedured?.lineBreaks
      ? preMedured?.lineBreaks
      : lineBreakWithCharMetrixes(text.text, charWidths, maxWidth)
  const boxHeight = lineBreaks.reduce(
    (acc, cur) => acc + (cur.lineAscent + cur.lineDescent) * (text.lineHeight ?? 1),
    0
  )

  ctx.save()

  if (text.direction === 'vertical') {
    ctx.rotate((Math.PI / 2) * 1)
    ctx.translate(y, -x)
  } else {
    ctx.translate(x, y)
  }

  DEBUG && drawOuterBox(ctx, maxWidth, boxHeight)

  drawTextLinesWithWidthAndBreaks(ctx, text, charWidths, lineBreaks, maxWidth)
  ctx.restore()

  return {
    charWidths,
    lineBreaks,
  }
}
