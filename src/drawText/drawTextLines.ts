import { lineBreakWithCharMetrixes } from './breakLine'
import { drawLineBox, drawLineSeparator, drawMetrixBox, drawOuterBox } from './debugDraw'
import {
  Style,
  StyledText,
  CharMetrix,
  StyleInstruction,
  LineMetrix,
  MeduredMatrix,
  LineText,
  StyledTextSetting,
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
    charWidths.push({ metrix: sharedCtx.measureText(char), textChar: char })
  }
  return charWidths
}

const computeLineText = (styledText: StyledText, charWidths: CharMetrix[], breaks: LineMetrix[]): LineText[] => {
  const { styles } = styledText
  const instructions: StyleInstruction[] = []
  styles.forEach((s) => (instructions[s.at] = s))

  const lines = breaks.map((lineMetrix, index) => {
    const nextLineMetrix = breaks.at(index + 1)
    const nextBreakAt = nextLineMetrix ? nextLineMetrix.at : charWidths.length
    const chars = charWidths.slice(lineMetrix.at, nextBreakAt)
    const charsWithStyle = chars.map((char, cIndex) => {
      const style = instructions.at(lineMetrix.at + cIndex)?.style
      return {
        char,
        style,
      }
    })
    return {
      charsWithStyle,
      lineMetrix,
    }
  })

  return lines
}

const getLineX = (align: StyledText['align'], lineWidth: number, maxWidth: number) => {
  switch (align) {
    case 'center':
      return (maxWidth - lineWidth) / 2
    case 'right':
      return maxWidth - lineWidth
    default:
      return 0
  }
}

const drawTextLinesWithWidthAndBreaks = (
  ctx: CanvasRenderingContext2D,
  lines: LineText[],
  setting: StyledTextSetting,
  maxWidth: number
) => {
  const { initialStyle, align, lineHeight = 1 } = setting

  const pos = {
    x: 0,
    y: 0,
  }

  // set initial style
  let style = { ...initialStyle }
  setStyle(ctx, style)

  // each line
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const lw = line.lineMetrix.width
    const lx = getLineX(align, line.lineMetrix.width, maxWidth)
    const lh = line.lineMetrix.lineAscent + line.lineMetrix.lineDescent
    const lp = (lh * (lineHeight - 1)) / 2

    // start pos
    pos.x = lx
    pos.y += lp

    // draw line box
    DEBUG && drawLineBox(ctx, lx, pos.y, line.lineMetrix)

    // draw each char
    for (let charIndex = 0; charIndex < line.charsWithStyle.length; charIndex++) {
      const charWithStyle = line.charsWithStyle.at(charIndex)
      if (!charWithStyle) break
      // update style
      if (charWithStyle.style) {
        style = { ...style, ...charWithStyle.style }
        setStyle(ctx, style)
      }

      // get same style segment
      if (charIndex === 0 || charWithStyle.style) {
        const segChars: CharMetrix[] = [charWithStyle.char]
        const segStart = charIndex
        const maxLen = line.charsWithStyle.length - segStart
        for(let segCharIndex = 1; segCharIndex < maxLen; segCharIndex++) {
          const cs = line.charsWithStyle.at(segStart + segCharIndex)
          if (!cs || cs.style) {
            break
          }
          segChars.push(cs.char)
        }
        const segWidth = segChars.reduce((sum, c) => sum + c.metrix.width, 0)
        const segText = segChars.map(c => c.textChar).join('')

        // draw segment chars
        ctx.fillText(segText, pos.x, pos.y + line.lineMetrix.lineAscent)
        // draw debug char box
        if (DEBUG) {
          let cx = pos.x
          segChars.forEach(c => {
            drawMetrixBox(ctx, cx, pos.y, line.lineMetrix.lineAscent, c.metrix)
            cx += c.metrix.width
          })
        }
        // update pos
        pos.x += segWidth
      }
    }

    // update pos
    pos.y += lh + lp
    // draw line separator
    DEBUG && drawLineSeparator(ctx, lx, pos.y, lw)
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
  const lines = computeLineText(text, charWidths, lineBreaks)

  ctx.save()

  if (text.direction === 'vertical') {
    ctx.rotate((Math.PI / 2) * 1)
    ctx.translate(y, -x)
  } else {
    ctx.translate(x, y)
  }

  DEBUG && drawOuterBox(ctx, maxWidth, boxHeight)

  drawTextLinesWithWidthAndBreaks(ctx, lines, text, maxWidth)
  ctx.restore()

  return {
    charWidths,
    lineBreaks,
  }
}
