import { describe, it, expect, vi, afterEach } from 'vitest'
import { Extension } from './defs/extension'
import { drawStyledText, measureStyledText, setDebug } from './drawTextLines'
import { FONT_SIZE, INK_MARGIN, createCtx, inkOf, makeText, removeCreatedCanvases } from './test-utils'

// Glyph orientation in vertical mode depends on browser support for CSS
// writing-mode on canvas, so vertical tests only check layout-level results.

afterEach(() => {
  setDebug(false)
  removeCreatedCanvases()
})

describe('measureStyledText', () => {
  it('measures each grapheme in order', () => {
    const { charWidths } = measureStyledText(makeText('aあ👨‍👩‍👧b'), 1000)
    expect(charWidths.map((c) => c.textChar)).toEqual(['a', 'あ', '👨‍👩‍👧', 'b'])
    charWidths.forEach((c) => expect(c.metrix.width).toBeGreaterThan(0))
  })

  it('applies style instructions at grapheme indexes', () => {
    const text = makeText('a👨‍👩‍👧bb', {}, [{ at: 3, style: { fontSize: FONT_SIZE * 2 } }])
    const { charWidths } = measureStyledText(text, 1000)
    expect(charWidths[3].textChar).toBe('b')
    expect(charWidths[3].metrix.width).toBeCloseTo(charWidths[2].metrix.width * 2, 0)
  })

  it('computes outerBox from lines, lineHeight and align', () => {
    const maxWidth = 200
    const left = measureStyledText(makeText('abc', { align: 'left' }), maxWidth)
    const center = measureStyledText(makeText('abc', { align: 'center' }), maxWidth)
    const right = measureStyledText(makeText('abc', { align: 'right' }), maxWidth)
    const doubled = measureStyledText(makeText('abc', { lineHeight: 2 }), maxWidth)

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
    expect((ink.left + ink.right) / 2).toBeCloseTo(outerBox.x + outerBox.width / 2, -1)
  })

  it('draws vertical text downward from (x, y) with lines progressing leftward', () => {
    const ctx = createCtx(300, 300, 'vertical-rl')
    const x = 250
    const y = 10
    const maxWidth = 150
    const text = makeText('あいうえおかきくけこさしすせそ', { direction: 'vertical' })
    const { outerBox } = drawStyledText(ctx, text, x, y, maxWidth)
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
    const snapshot = () => ({
      transform: ctx.getTransform().toString(),
      font: ctx.font,
      fillStyle: ctx.fillStyle,
      textBaseline: ctx.textBaseline,
    })
    const before = snapshot()
    for (const direction of ['horizontal', 'vertical'] as const) {
      drawStyledText(ctx, makeText('abc あいう', { direction }), 0, 0, 100)
      expect(snapshot()).toEqual(before)
      expect(ctx.canvas.style.fontKerning).toBe('normal')
    }
  })
})

describe('drawStyledText extensions', () => {
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
})

describe('canvasWritingMode', () => {
  const widthsOf = (setting: Parameters<typeof makeText>[1]) =>
    measureStyledText(makeText('Ab1 あ、', setting), 1000).charWidths.map((c) => c.metrix.width)

  it('measures with the given writing mode regardless of direction', () => {
    expect(widthsOf({ direction: 'vertical', canvasWritingMode: 'horizontal-tb' })).toEqual(
      widthsOf({ direction: 'horizontal' })
    )
  })

  it('measures with the writing mode matching direction when omitted', () => {
    expect(widthsOf({ direction: 'vertical' })).toEqual(
      widthsOf({ direction: 'vertical', canvasWritingMode: 'vertical-rl' })
    )
    expect(widthsOf({ direction: 'horizontal' })).toEqual(
      widthsOf({ direction: 'horizontal', canvasWritingMode: 'horizontal-tb' })
    )
  })

  it('does not carry over writing mode between measurements', () => {
    const omitted = widthsOf({ direction: 'vertical' })
    const explicit = widthsOf({ direction: 'vertical', canvasWritingMode: 'horizontal-tb' })
    expect(widthsOf({ direction: 'vertical' })).toEqual(omitted)
    expect(widthsOf({ direction: 'vertical', canvasWritingMode: 'horizontal-tb' })).toEqual(explicit)
  })

  it('applies writing mode to the drawing canvas only while drawing', () => {
    const ctx = createCtx(300, 300, 'vertical-rl')
    const modes: string[] = []
    const fillText = ctx.fillText.bind(ctx)
    ctx.fillText = (...args) => {
      modes.push(`fillText:${ctx.canvas.style.writingMode}`)
      fillText(...args)
    }
    const spy: Extension<true> = {
      beforeSegment: (c) => {
        modes.push(`extension:${c.canvas.style.writingMode}`)
      },
    }
    const text = makeText(
      'abc',
      { direction: 'vertical', canvasWritingMode: 'horizontal-tb' },
      [],
      { spy },
      { spy: true }
    )
    drawStyledText(ctx, text, 250, 10, 200)

    expect(modes).toEqual(['extension:horizontal-tb', 'fillText:horizontal-tb'])
    expect(ctx.canvas.style.writingMode).toBe('vertical-rl')
  })

  it('keeps unset writing mode unset after drawing', () => {
    const ctx = createCtx()
    ctx.canvas.style.writingMode = ''
    drawStyledText(ctx, makeText('abc', { direction: 'vertical', canvasWritingMode: 'horizontal-tb' }), 250, 10, 200)
    expect(ctx.canvas.style.getPropertyValue('writing-mode')).toBe('')
  })

  it('does not touch the drawing canvas writing mode when omitted', () => {
    const ctx = createCtx(300, 300, 'vertical-rl')
    const modes: string[] = []
    const fillText = ctx.fillText.bind(ctx)
    ctx.fillText = (...args) => {
      modes.push(ctx.canvas.style.writingMode)
      fillText(...args)
    }
    drawStyledText(ctx, makeText('abc', { direction: 'vertical' }), 250, 10, 200)
    expect(modes).toEqual(['vertical-rl'])
  })

  it('renders the same regardless of the drawing canvas writing mode', () => {
    const text = makeText('Ab1 あいう、えお', { direction: 'vertical', canvasWritingMode: 'horizontal-tb' })
    const images = ['horizontal-tb', 'vertical-rl'].map((writingMode) => {
      const ctx = createCtx(300, 300, writingMode)
      drawStyledText(ctx, text, 250, 10, 200)
      return ctx.canvas.toDataURL()
    })
    expect(images[1]).toBe(images[0])
  })

  it('restores canvas CSS and context state when an extension throws', () => {
    const ctx = createCtx(300, 300, 'vertical-rl')
    ctx.canvas.style.fontKerning = 'normal'
    ctx.textBaseline = 'top'
    const transform = ctx.getTransform().toString()
    const broken: Extension<true> = {
      beforeSegment: () => {
        throw new Error('broken extension')
      },
    }
    const text = makeText(
      'abc',
      { direction: 'vertical', canvasWritingMode: 'horizontal-tb' },
      [],
      { broken },
      { broken: true }
    )

    expect(() => drawStyledText(ctx, text, 250, 10, 200)).toThrow('broken extension')
    expect(ctx.canvas.style.writingMode).toBe('vertical-rl')
    expect(ctx.canvas.style.fontKerning).toBe('normal')
    expect(ctx.textBaseline).toBe('top')
    expect(ctx.getTransform().toString()).toBe(transform)
  })
})
