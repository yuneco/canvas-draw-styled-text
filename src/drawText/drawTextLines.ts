import { CharMetrix, LineMetrix, LineText, MeduredMatrix } from '..'
import { lineBreakWithCharMetrixes } from './breakLine'
import { getSafariVerticalOffset } from './compatibility/safari'
import { drawLineBox, drawLineSeparator, drawMetrixBox, drawOuterBox } from './debugDraw'
import { StyledText } from './defs/defineText'
import { ExtensionsMap, StyleInstructionWithExtension, StyleWithExtension } from './defs/extension'
import { Style, BaseOptions } from './defs/style'
import { sharedCanvas, sharedCtx } from './sharedCtx'
import { splitText } from './splitText'
import {
  getVerticalTextOrientation,
  getVerticalTextOrientations,
  type VerticalTextOrientation,
} from './verticalOrientation'

let DEBUG = false
export const setDebug = (debug: boolean) => {
  DEBUG = debug
}

const setStyle = (ctx: CanvasRenderingContext2D, style: Style) => {
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  ctx.fillStyle = style.fontColor
}

const mesureTextCharWidth = <M extends ExtensionsMap>(text: StyledText<M>): CharMetrix[] => {
  const { initialStyle, styles } = text
  const charWidths: CharMetrix[] = []
  const instructions: StyleInstructionWithExtension<M>[] = []
  styles.forEach((s) => (instructions[s.at] = s))

  const isVertical = text.setting.direction === 'vertical'
  const chars = splitText(text.text, text.setting.lang)
  const orientations = isVertical ? chars.map(getVerticalTextOrientation) : []
  const textLength = chars.length

  let ctx = isVertical ? sharedCtx('vertical', orientations[0] ?? 'sideways') : sharedCtx('horizontal')
  setStyle(ctx, initialStyle)
  let currentStyle = { ...initialStyle }
  for (let i = 0; i < textLength; i++) {
    const char = chars[i]
    if (isVertical) {
      const nextCtx = sharedCtx('vertical', orientations[i] ?? 'sideways')
      if (nextCtx !== ctx) {
        ctx = nextCtx
        setStyle(ctx, currentStyle)
      }
    }
    const style = instructions[i]
    if (style) {
      currentStyle = { ...currentStyle, ...style.style }
      setStyle(ctx, currentStyle)
    }
    // get metrix.
    // use zero width space for line break.
    const isBr = char === '\n'
    const zeroWidthSpace = '\u200b'
    const metrix = ctx.measureText(isBr ? zeroWidthSpace : char)
    charWidths.push({ metrix, textChar: char })
  }
  return charWidths
}

const computeLineText = <M extends ExtensionsMap>(
  styledText: StyledText<M>,
  charWidths: CharMetrix[],
  breaks: LineMetrix[],
  charOrientations: VerticalTextOrientation[]
): LineTextForDraw<M>[] => {
  const { styles } = styledText
  const instructions: StyleInstructionWithExtension<M>[] = []
  styles.forEach((s) => (instructions[s.at] = s))

  const lines = breaks.map((lineMetrix, index) => {
    const nextLineMetrix = breaks.at(index + 1)
    const nextBreakAt = nextLineMetrix ? nextLineMetrix.at : charWidths.length
    const chars = charWidths.slice(lineMetrix.at, nextBreakAt)
    const orientations = charOrientations.slice(lineMetrix.at, nextBreakAt)
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
      orientations,
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

type LineTextForDraw<M extends ExtensionsMap> = LineText<M> & {
  orientations: VerticalTextOrientation[]
}

const SEGMENT_RENDER_PADDING = 8

// WebKit does not reliably apply per-run text-orientation changes on a single
// visible canvas, so vertical runs are first rendered on orientation-fixed
// offscreen canvases and then composited onto the destination canvas.
const drawVerticalSegmentImage = (
  ctx: CanvasRenderingContext2D,
  orientation: VerticalTextOrientation,
  style: Style,
  segText: string,
  segWidth: number,
  pos: { x: number; y: number },
  lineAscent: number,
  lineHeight: number,
  adjustment: { x: number; y: number }
) => {
  const renderCanvas = sharedCanvas('vertical', orientation)
  const renderCtx = sharedCtx('vertical', orientation)
  const padding = SEGMENT_RENDER_PADDING
  const width = Math.max(1, Math.ceil(segWidth + padding * 2))
  const height = Math.max(1, Math.ceil(lineHeight + padding * 2))
  const transform = ctx.getTransform()
  const scaleX = Math.max(1, Math.hypot(transform.a, transform.b))
  const scaleY = Math.max(1, Math.hypot(transform.c, transform.d))
  const backingWidth = Math.max(1, Math.ceil(width * scaleX))
  const backingHeight = Math.max(1, Math.ceil(height * scaleY))

  renderCanvas.width = backingWidth
  renderCanvas.height = backingHeight
  renderCtx.textBaseline = 'middle'
  renderCtx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  setStyle(renderCtx, style)
  renderCtx.clearRect(0, 0, width, height)
  renderCtx.fillText(segText, padding - adjustment.x, padding + lineAscent)

  const savedSmoothing = ctx.imageSmoothingEnabled
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(renderCanvas, pos.x - padding, pos.y - padding, width, height)
  ctx.imageSmoothingEnabled = savedSmoothing
}

const drawTextLinesWithWidthAndBreaks = <M extends ExtensionsMap>(
  ctx: CanvasRenderingContext2D,
  lines: LineTextForDraw<M>[],
  text: StyledText<M>,
  maxWidth: number
) => {
  const { align, lineHeight = 1 } = text.setting
  const isVertical = text.setting.direction === 'vertical'

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
      const orientation = line.orientations.at(charIndex) ?? 'sideways'
      const previousOrientation = line.orientations.at(charIndex - 1)
      // update style
      if (charWithStyle.style) {
        style = mergeStyle(style, charWithStyle.style)
        setStyle(ctx, style as Style)
      }

      // get same style/orientation segment
      if (charIndex === 0 || charWithStyle.style || (isVertical && previousOrientation !== orientation)) {
        const segChars: CharMetrix[] = [charWithStyle.char]
        const segStart = charIndex
        const maxLen = line.charsWithStyle.length - segStart
        for (let segCharIndex = 1; segCharIndex < maxLen; segCharIndex++) {
          const cs = line.charsWithStyle.at(segStart + segCharIndex)
          const nextOrientation = line.orientations.at(segStart + segCharIndex) ?? 'sideways'
          if (!cs || cs.style || (isVertical && nextOrientation !== orientation)) {
            break
          }
          segChars.push(cs.char)
        }
        const segWidth = segChars.reduce((sum, c) => sum + c.metrix.width, 0)
        const segText = segChars.map((c) => c.textChar).join('')
        const currentOrientation = isVertical ? orientation : ctx.canvas.style.textOrientation

        if (DEBUG) {
          console.log('[drawStyledText:segment]', {
            text: segText,
            textOrientation: currentOrientation,
          })
        }

        // call extension if exists
        for (let name in style) {
          const extension = (text.extensions ?? {})[name]
          const option = style[name]
          const currentStyle = { ...style } as Style
          if (extension && option)
            extension.beforeSegment(ctx, { line, text: segChars, pos, style: currentStyle }, option)
        }

        // get drawing offset for safari bug
        const fitstChar = segChars.at(0)
        const adjustment = isVertical && fitstChar ? getSafariVerticalOffset(fitstChar.metrix) : { x: 0, y: 0 }
        if (isVertical) {
          const currentStyle = { ...style } as Style
          drawVerticalSegmentImage(
            ctx,
            orientation,
            currentStyle,
            segText,
            segWidth,
            pos,
            line.lineMetrix.lineAscent,
            lh,
            adjustment
          )
        } else {
          ctx.fillText(segText, pos.x - adjustment.x, pos.y + line.lineMetrix.lineAscent)
        }
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
  const charWidths = mesureTextCharWidth(text)
  const lineBreaks = lineBreakWithCharMetrixes(text.text, charWidths, maxWidth, text.setting.overflowWrap === 'break-word')
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
  const isVertical = text.setting.direction === 'vertical'
  const charOrientations = isVertical
    ? getVerticalTextOrientations(text.text, text.setting.lang)
    : splitText(text.text, text.setting.lang).map(() => 'sideways' as const)

  const charWidths = preMedured?.charWidths ? preMedured?.charWidths : mesureTextCharWidth(text)
  const lineBreaks =
    preMedured?.charWidths && preMedured?.lineBreaks
      ? preMedured?.lineBreaks
      : lineBreakWithCharMetrixes(text.text, charWidths, maxWidth, text.setting.overflowWrap === 'break-word')
  const lines = computeLineText(text, charWidths, lineBreaks, charOrientations)

  const box = getOuterBoxForLines(lineBreaks, maxWidth, text.setting)
  const outerBox = {
    x: x + box.x,
    y: y + box.y,
    width: box.width,
    height: box.height,
  }
  DEBUG && drawOuterBox(ctx, outerBox.x, outerBox.width, outerBox.height)

  ctx.save()
  ctx.textBaseline = isVertical ? 'middle' : 'alphabetic'
  if ((ctx as any).textRendering) {
    ;(ctx as any).textRendering = 'optimizeSpeed'
  }

  if (isVertical) {
    ctx.rotate((Math.PI / 2) * 1)
    ctx.translate(y, -x)
  } else {
    ctx.translate(x, y)
  }

  const savedKerning = ctx.canvas.style.fontKerning
  const savedOrientation = ctx.canvas.style.textOrientation
  ctx.canvas.style.fontKerning = 'none'
  drawTextLinesWithWidthAndBreaks(ctx, lines, text, maxWidth)
  ctx.canvas.style.fontKerning = savedKerning
  ctx.canvas.style.textOrientation = savedOrientation
  ctx.restore()

  return {
    charWidths,
    lineBreaks,
    outerBox,
  }
}
