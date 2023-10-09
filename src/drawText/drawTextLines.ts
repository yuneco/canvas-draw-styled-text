import { CharMetrix, LineMetrix, LineText, MeduredMatrix } from '..'
import { lineBreakWithCharMetrixes } from './breakLine'
import { drawLineBox, drawLineSeparator, drawMetrixBox, drawOuterBox } from './debugDraw'
import { StyledText } from './defs/defineText'
import { ExtensionsMap, StyleInstructionWithExtension, StyleWithExtension } from './defs/extension'
import { Style, BaseOptions } from './defs/style'

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

const mesureTextCharWidth = <M extends ExtensionsMap>(text: StyledText<M>): CharMetrix[] => {
  const { initialStyle, styles } = text
  const charWidths: CharMetrix[] = []
  const instructions: StyleInstructionWithExtension<M>[] = []
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

const computeLineText = <M extends ExtensionsMap>(
  styledText: StyledText<M>,
  charWidths: CharMetrix[],
  breaks: LineMetrix[]
): LineText[] => {
  const { styles } = styledText
  const instructions: StyleInstructionWithExtension<M>[] = []
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

const getLineX = (align: BaseOptions['align'], lineWidth: number, maxWidth: number) => {
  switch (align) {
    case 'center':
      return (maxWidth - lineWidth) / 2
    case 'right':
      return maxWidth - lineWidth
    default:
      return 0
  }
}

const mergeStyle = <M extends ExtensionsMap>(
  style: StyleWithExtension<M>,
  newStyle: StyleWithExtension<M>
): StyleWithExtension<M> => {
  return {
    ...style,
    ...newStyle,
  }
}

const drawTextLinesWithWidthAndBreaks = <M extends ExtensionsMap>(
  ctx: CanvasRenderingContext2D,
  lines: LineText<M>[],
  text: StyledText<M>,
  maxWidth: number
) => {
  const { align, lineHeight = 1 } = text.setting

  const pos = {
    x: 0,
    y: 0,
  }

  // set initial style
  let style: StyleWithExtension<M> = { ...text.initialStyle }
  setStyle(ctx, style as Style)

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
        style = mergeStyle(style, charWithStyle.style)
        setStyle(ctx, style as Style)
      }

      // get same style segment
      if (charIndex === 0 || charWithStyle.style) {
        const segChars: CharMetrix[] = [charWithStyle.char]
        const segStart = charIndex
        const maxLen = line.charsWithStyle.length - segStart
        for (let segCharIndex = 1; segCharIndex < maxLen; segCharIndex++) {
          const cs = line.charsWithStyle.at(segStart + segCharIndex)
          if (!cs || cs.style) {
            break
          }
          segChars.push(cs.char)
        }
        const segWidth = segChars.reduce((sum, c) => sum + c.metrix.width, 0)
        const segText = segChars.map((c) => c.textChar).join('')

        // call extension if exists
        for (let name in style) {
          const extension = (text.extensions ?? {})[name]
          const option = style[name]
          const currentStyle = { ...style } as Style
          if (extension && option)
            extension.beforeSegment(ctx, { line, text: segChars, pos, style: currentStyle }, option)
        }

        ctx.fillText(segText, pos.x, pos.y + line.lineMetrix.lineAscent)
        // draw debug char box
        if (DEBUG) {
          let cx = pos.x
          segChars.forEach((c) => {
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

const getOuterBoxForLines = (
  lineBreaks: LineMetrix[],
  maxWidth: number,
  setting: BaseOptions
): { x: number; y: number; width: number; height: number } => {
  // outer box size
  const boxWidth = Math.max(...lineBreaks.map((l) => l.width))
  const boxHeight = lineBreaks.reduce(
    (acc, cur) => acc + (cur.lineAscent + cur.lineDescent) * (setting.lineHeight ?? 1),
    0
  )
  const boxX = {
    left: 0,
    center: (maxWidth - boxWidth) / 2,
    right: maxWidth - boxWidth,
  }[setting.align ?? 'left']
  return {
    x: boxX,
    y: 0,
    width: boxWidth,
    height: boxHeight,
  }
}

/**
 * mesure text with maxWidth without drawing.
 * @param text StyledText
 * @param maxWidth wrap width
 * @returns measured matrix. you can use this matrix for drawStyledText
 */
export const measureStyledText = (text: StyledText<any>, maxWidth: number): MeduredMatrix => {
  sharedCanvas.style.writingMode = text.setting.direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb'
  const charWidths = mesureTextCharWidth(text)
  const lineBreaks = lineBreakWithCharMetrixes(text.text, charWidths, maxWidth)
  return {
    charWidths,
    lineBreaks,
    outerBox: getOuterBoxForLines(lineBreaks, maxWidth, text.setting),
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
export const drawStyledText = <E extends ExtensionsMap = any>(
  ctx: CanvasRenderingContext2D,
  text: StyledText<E>,
  x: number,
  y: number,
  maxWidth: number,
  preMedured?: Partial<MeduredMatrix>
): MeduredMatrix => {
  sharedCanvas.style.writingMode = text.setting.direction === 'vertical' ? 'vertical-rl' : 'horizontal-tb'

  const charWidths = preMedured?.charWidths ? preMedured?.charWidths : mesureTextCharWidth(text)
  const lineBreaks =
    preMedured?.charWidths && preMedured?.lineBreaks
      ? preMedured?.lineBreaks
      : lineBreakWithCharMetrixes(text.text, charWidths, maxWidth)
  const lines = computeLineText(text, charWidths, lineBreaks)

  ctx.save()
  if ((ctx as any).textRendering) {
    ;(ctx as any).textRendering = 'optimizeSpeed'
  }

  if (text.setting.direction === 'vertical') {
    ctx.rotate((Math.PI / 2) * 1)
    ctx.translate(y, -x)
  } else {
    ctx.translate(x, y)
  }

  const box = getOuterBoxForLines(lineBreaks, maxWidth, text.setting)
  const outerBox = {
    x: x + box.x,
    y: y + box.y,
    width: box.width,
    height: box.height,
  }
  DEBUG && drawOuterBox(ctx, outerBox.x, outerBox.width, outerBox.height)

  const savedKerning = ctx.canvas.style.fontKerning
  ctx.canvas.style.fontKerning = 'none'
  drawTextLinesWithWidthAndBreaks(ctx, lines, text, maxWidth)
  ctx.canvas.style.fontKerning = savedKerning
  ctx.restore()

  return {
    charWidths,
    lineBreaks,
    outerBox,
  }
}
