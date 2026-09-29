import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  FONT_WEIGHT_BOLD,
  FONT_WEIGHT_NORMAL,
  defineText,
  drawStyledText,
  markerExtension,
  measureStyledText,
  setDebug,
  underLineExtension,
  type BaseOptions,
  type Extension,
  type ExtensionOptions,
  type ExtensionsMap,
  type InitialStyleWithExtensionOptions,
  type StyleInstructionWithExtension,
} from '.'

// Contract tests for the public API exported from src/index.ts.
// Glyph orientation in vertical mode depends on browser support for CSS
// writing-mode on canvas, so vertical tests only check layout-level results.

const FONT_FAMILY = 'BIZ UDPGothic'
const FONT_SIZE = 20

const makeText = <M extends ExtensionsMap = {}>(
  text: string,
  setting: BaseOptions = {},
  styles: StyleInstructionWithExtension<NoInfer<M>>[] = [],
  extensions: M = {} as M,
  initialExtensionOptions: ExtensionOptions<NoInfer<M>> = {}
) =>
  defineText<M>({
    text,
    setting: { lang: 'ja', ...setting },
    extensions,
    initialStyle: {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE,
      fontColor: '#000',
      fontWeight: FONT_WEIGHT_NORMAL,
      fontStyle: 'normal',
      ...initialExtensionOptions,
    } as InitialStyleWithExtensionOptions<M>,
    styles,
  })

const createCtx = (width = 300, height = 300, writingMode = 'horizontal-tb') => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.writingMode = writingMode
  document.body.appendChild(canvas)
  return canvas.getContext('2d')!
}

/** bounding box and count of non-transparent pixels */
const inkOf = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height).data
  let count = 0
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      count++
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x + 1)
      bottom = Math.max(bottom, y + 1)
    }
  }
  return { count, left, top, right, bottom }
}

const INK_MARGIN = 4

afterEach(() => {
  setDebug(false)
  document.querySelectorAll('body > canvas:not([style*="hidden"])').forEach((c) => c.remove())
})

describe('exports', () => {
  it('exposes the public API', () => {
    expect(typeof defineText).toBe('function')
    expect(typeof drawStyledText).toBe('function')
    expect(typeof measureStyledText).toBe('function')
    expect(typeof setDebug).toBe('function')
    expect(typeof underLineExtension.beforeSegment).toBe('function')
    expect(typeof markerExtension.beforeSegment).toBe('function')
    expect(FONT_WEIGHT_NORMAL).toBe(400)
    expect(FONT_WEIGHT_BOLD).toBe(700)
  })

  it('defineText returns the given definition as is', () => {
    const def = {
      text: 'abc',
      setting: {},
      extensions: {},
      initialStyle: {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE,
        fontColor: '#000',
        fontWeight: FONT_WEIGHT_NORMAL,
        fontStyle: 'normal',
      },
      styles: [],
    } as const
    expect(defineText(def as any)).toBe(def)
  })
})

describe('measureStyledText', () => {
  it('measures each grapheme in order', () => {
    const text = 'aあ👨‍👩‍👧b'
    const { charWidths } = measureStyledText(makeText(text), 1000)
    expect(charWidths.map((c) => c.textChar)).toEqual(['a', 'あ', '👨‍👩‍👧', 'b'])
    charWidths.forEach((c) => expect(c.metrix.width).toBeGreaterThan(0))
  })

  it('applies style instructions at grapheme indexes', () => {
    const text = 'a👨‍👩‍👧bb'
    const { charWidths } = measureStyledText(makeText(text, {}, [{ at: 3, style: { fontSize: FONT_SIZE * 2 } }]), 1000)
    expect(charWidths[3].textChar).toBe('b')
    expect(charWidths[3].metrix.width).toBeCloseTo(charWidths[2].metrix.width * 2, 0)
  })

  it('keeps text in a single line when it fits', () => {
    const { charWidths, lineBreaks } = measureStyledText(makeText('Hello, 世界'), 1000)
    expect(lineBreaks).toHaveLength(1)
    expect(lineBreaks[0].at).toBe(0)
    const sum = charWidths.reduce((s, c) => s + c.metrix.width, 0)
    expect(lineBreaks[0].width).toBeCloseTo(sum, 5)
  })

  it('breaks lines at newline', () => {
    const { lineBreaks } = measureStyledText(makeText('abc\ndef'), 1000)
    expect(lineBreaks.map((l) => l.at)).toEqual([0, 4])
  })

  it('wraps lines within maxWidth without breaking before closing punctuation', () => {
    const text = 'あいうえお。かきくけこ、さしすせそ。たちつてと'
    const chars = measureStyledText(makeText(text), 1000).charWidths.map((c) => c.textChar)
    for (let maxWidth = 60; maxWidth <= 300; maxWidth += 7) {
      const { lineBreaks } = measureStyledText(makeText(text), maxWidth)
      expect(lineBreaks.length).toBeGreaterThan(1)
      lineBreaks.forEach((line, i) => {
        if (i === 0) expect(line.at).toBe(0)
        else expect(line.at).toBeGreaterThan(lineBreaks[i - 1].at)
        expect(line.width).toBeLessThanOrEqual(maxWidth)
        expect(['、', '。']).not.toContain(chars[line.at])
      })
    }
  })

  it('computes outerBox from lines, lineHeight and align', () => {
    const maxWidth = 200
    const text = 'abc'
    const left = measureStyledText(makeText(text, { align: 'left' }), maxWidth)
    const center = measureStyledText(makeText(text, { align: 'center' }), maxWidth)
    const right = measureStyledText(makeText(text, { align: 'right' }), maxWidth)
    const doubled = measureStyledText(makeText(text, { lineHeight: 2 }), maxWidth)

    const line = left.lineBreaks[0]
    expect(left.outerBox).toEqual({
      x: 0,
      y: 0,
      width: line.width,
      height: line.lineAscent + line.lineDescent,
    })
    expect(center.outerBox.x).toBeCloseTo((maxWidth - line.width) / 2, 5)
    expect(right.outerBox.x).toBeCloseTo(maxWidth - line.width, 5)
    expect(doubled.outerBox.height).toBeCloseTo(left.outerBox.height * 2, 5)
  })
})

describe('drawStyledText', () => {
  it('returns the same layout as measureStyledText with outerBox offset by x, y', () => {
    const text = makeText('あいうえお。かきくけこ、さしすせそ。', { align: 'center' })
    const measured = measureStyledText(text, 120)
    const drawn = drawStyledText(createCtx(), text, 10, 20, 120)
    expect(drawn.lineBreaks).toEqual(measured.lineBreaks)
    expect(drawn.charWidths.map((c) => c.metrix.width)).toEqual(measured.charWidths.map((c) => c.metrix.width))
    expect(drawn.outerBox).toEqual({
      ...measured.outerBox,
      x: measured.outerBox.x + 10,
      y: measured.outerBox.y + 20,
    })
  })

  it('draws horizontal text inside outerBox', () => {
    const ctx = createCtx()
    const { outerBox } = drawStyledText(ctx, makeText('Hello, 世界'), 10, 20, 250)
    const ink = inkOf(ctx)
    expect(ink.count).toBeGreaterThan(0)
    expect(ink.left).toBeGreaterThanOrEqual(outerBox.x - INK_MARGIN)
    expect(ink.right).toBeLessThanOrEqual(outerBox.x + outerBox.width + INK_MARGIN)
    expect(ink.top).toBeGreaterThanOrEqual(outerBox.y - INK_MARGIN)
    expect(ink.bottom).toBeLessThanOrEqual(outerBox.y + outerBox.height + INK_MARGIN)
  })

  it.each(['left', 'center', 'right'] as const)('places text by align: %s', (align) => {
    const ctx = createCtx()
    const { outerBox } = drawStyledText(ctx, makeText('HHH', { align }), 10, 20, 250)
    const ink = inkOf(ctx)
    const inkCenter = (ink.left + ink.right) / 2
    expect(inkCenter).toBeCloseTo(outerBox.x + outerBox.width / 2, -1)
  })

  it('draws vertical text downward from (x, y) with lines progressing leftward', () => {
    const ctx = createCtx(300, 300, 'vertical-rl')
    const x = 250
    const y = 10
    const maxWidth = 150
    const { outerBox } = drawStyledText(ctx, makeText('あいうえおかきくけこさしすせそ', { direction: 'vertical' }), x, y, maxWidth)
    const ink = inkOf(ctx)
    expect(ink.count).toBeGreaterThan(0)
    expect(ink.right).toBeLessThanOrEqual(x + INK_MARGIN)
    expect(ink.left).toBeGreaterThanOrEqual(x - outerBox.height - INK_MARGIN)
    expect(ink.top).toBeGreaterThanOrEqual(y - INK_MARGIN)
    expect(ink.bottom).toBeLessThanOrEqual(y + maxWidth + INK_MARGIN)
  })

  it('uses pre-measured matrix when given', () => {
    const text = makeText('あいうえお。かきくけこ、さしすせそ。')
    const measured = measureStyledText(text, 120)

    const ctxA = createCtx()
    const drawn = drawStyledText(ctxA, text, 10, 20, 120, measured)
    expect(drawn.charWidths).toBe(measured.charWidths)
    expect(drawn.lineBreaks).toBe(measured.lineBreaks)

    const ctxB = createCtx()
    drawStyledText(ctxB, text, 10, 20, 120)
    expect(ctxA.canvas.toDataURL()).toBe(ctxB.canvas.toDataURL())
  })

  it('restores context state and canvas font-kerning', () => {
    const ctx = createCtx()
    ctx.setTransform(2, 0, 0, 2, 5, 5)
    ctx.font = '10px serif'
    ctx.fillStyle = '#ff0000'
    ctx.textBaseline = 'top'
    ctx.canvas.style.fontKerning = 'normal'
    const before = {
      transform: ctx.getTransform().toString(),
      font: ctx.font,
      fillStyle: ctx.fillStyle,
      textBaseline: ctx.textBaseline,
    }
    for (const direction of ['horizontal', 'vertical'] as const) {
      drawStyledText(ctx, makeText('abc あいう', { direction }), 0, 0, 100)
      expect({
        transform: ctx.getTransform().toString(),
        font: ctx.font,
        fillStyle: ctx.fillStyle,
        textBaseline: ctx.textBaseline,
      }).toEqual(before)
      expect(ctx.canvas.style.fontKerning).toBe('normal')
    }
  })
})

describe('extensions', () => {
  it('calls beforeSegment with options for each styled segment before drawing it', () => {
    const spy: Extension<{ tag: string }> = { beforeSegment: vi.fn() }
    const ctx = createCtx()
    const fillText = vi.spyOn(ctx, 'fillText')
    const text = makeText(
      'abcdef',
      {},
      [
        { at: 2, style: { spy: { tag: 'A' } } },
        { at: 4, style: { spy: false } },
      ],
      { spy }
    )
    drawStyledText(ctx, text, 0, 0, 1000)

    const calls = vi.mocked(spy.beforeSegment).mock.calls
    expect(calls).toHaveLength(1)
    const [calledCtx, segment, options] = calls[0]
    expect(calledCtx).toBe(ctx)
    expect(options).toEqual({ tag: 'A' })
    expect(segment.text.map((c) => c.textChar).join('')).toBe('cd')
    expect(segment.style.fontSize).toBe(FONT_SIZE)

    const segFill = fillText.mock.calls.findIndex(([s]) => s === 'cd')
    expect(segFill).toBeGreaterThanOrEqual(0)
    expect(vi.mocked(spy.beforeSegment).mock.invocationCallOrder[0]).toBeLessThan(
      fillText.mock.invocationCallOrder[segFill]
    )
  })

  it('applies extension options in initialStyle from the first segment', () => {
    const spy: Extension<true> = { beforeSegment: vi.fn() }
    drawStyledText(createCtx(), makeText('abc', {}, [], { spy }, { spy: true }), 0, 0, 1000)
    const calls = vi.mocked(spy.beforeSegment).mock.calls
    expect(calls).toHaveLength(1)
    expect(calls[0][1].text.map((c) => c.textChar).join('')).toBe('abc')
    expect(calls[0][2]).toBe(true)
  })

  it.each([
    ['underLineExtension', underLineExtension, { width: 2 }],
    ['markerExtension', markerExtension, { width: 50, color: '#f00' }],
  ] as const)('%s draws decoration', (_, extension, option) => {
    const plain = createCtx()
    drawStyledText(plain, makeText('abc'), 10, 20, 250)

    const decorated = createCtx()
    drawStyledText(decorated, makeText('abc', {}, [], { deco: extension as Extension<any> }, { deco: option }), 10, 20, 250)

    expect(inkOf(decorated).count).toBeGreaterThan(inkOf(plain).count)
  })
})
