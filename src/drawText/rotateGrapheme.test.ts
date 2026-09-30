import { describe, it, expect, vi, afterEach } from 'vitest'
import { Extension } from './defs/extension'
import { BaseOptions, GraphemeRotation } from './defs/style'
import { drawStyledText, measureStyledText } from './drawTextLines'
import { FONT_SIZE, createCtx, inkOf, makeText, removeCreatedCanvases } from './test-utils'

afterEach(removeCreatedCanvases)

const rotate =
  (target: string, rotation: GraphemeRotation): BaseOptions['rotateGrapheme'] =>
  (g) =>
    g === target ? rotation : undefined

const inkCenter = (ctx: CanvasRenderingContext2D) => {
  const ink = inkOf(ctx)
  expect(ink.count).toBeGreaterThan(0)
  return {
    x: (ink.left + ink.right) / 2,
    y: (ink.top + ink.bottom) / 2,
    shape: ink.right - ink.left > ink.bottom - ink.top ? 'wide' : 'tall',
  }
}

describe('rotateGrapheme: measuring', () => {
  it('is called for graphemes except line breaks', () => {
    const rotateGrapheme = vi.fn((_grapheme: string) => undefined)
    measureStyledText(makeText('aba\nあ👨‍👩‍👧', { rotateGrapheme }), 1000)
    const called = new Set(rotateGrapheme.mock.calls.map(([g]) => g))
    expect(called).toEqual(new Set(['a', 'b', 'あ', '👨‍👩‍👧']))
  })

  it('makes a rotated grapheme advance 1em of its style', () => {
    const text = makeText('AAAb', { rotateGrapheme: rotate('A', -90) }, [{ at: 2, style: { fontSize: FONT_SIZE * 2 } }])
    const plain = measureStyledText(makeText('AAAb', {}, [{ at: 2, style: { fontSize: FONT_SIZE * 2 } }]), 1000)
    const { charWidths } = measureStyledText(text, 1000)
    expect(charWidths.map((c) => c.metrix.width)).toEqual([
      FONT_SIZE,
      FONT_SIZE,
      FONT_SIZE * 2,
      plain.charWidths[3].metrix.width,
    ])
    expect(charWidths.map((c) => c.rotation)).toEqual([-90, -90, -90, undefined])
    // other metrics are kept
    expect(charWidths[0].metrix.fontBoundingBoxAscent).toBe(plain.charWidths[0].metrix.fontBoundingBoxAscent)
  })

  it('treats return values other than 90 and -90 as no rotation', () => {
    const plain = measureStyledText(makeText('AB'), 1000)
    for (const value of [0, 45, 180, '90', null]) {
      const rotateGrapheme = (() => value) as unknown as BaseOptions['rotateGrapheme']
      const { charWidths } = measureStyledText(makeText('AB', { rotateGrapheme }), 1000)
      expect(charWidths.map((c) => c.rotation)).toEqual([undefined, undefined])
      expect(charWidths.map((c) => c.metrix.width)).toEqual(plain.charWidths.map((c) => c.metrix.width))
    }
  })

  it('breaks lines with the 1em advance', () => {
    const [a, space] = measureStyledText(makeText('A '), 1000).charWidths.map((c) => c.metrix.width)
    // "A " x3 fits without rotation, but not with rotation (1em)
    const maxWidth = (a + space) * 3 + 1
    expect((FONT_SIZE + space) * 3).toBeGreaterThan(maxWidth)
    const plain = measureStyledText(makeText('A A A A'), maxWidth)
    expect(plain.lineBreaks.map((l) => l.at)).toEqual([0, 6])
    const rotated = measureStyledText(makeText('A A A A', { rotateGrapheme: rotate('A', 90) }), maxWidth)
    expect(rotated.lineBreaks.map((l) => l.at)).toEqual([0, 4])
  })
})

describe('rotateGrapheme: drawing', () => {
  // "一" is a horizontal stroke, "□" is a square centered in the em box
  it.each([
    ['horizontal', 'horizontal-tb', 90, 'tall'],
    ['horizontal', 'horizontal-tb', -90, 'tall'],
    ['vertical', 'horizontal-tb', -90, 'wide'],
  ] as const)('rotates the glyph (%s layout, %s canvas, %i)', (direction, canvasWritingMode, rotation, shape) => {
    const ctx = createCtx(300, 300, canvasWritingMode)
    const setting = { direction, canvasWritingMode, rotateGrapheme: rotate('一', rotation) }
    drawStyledText(ctx, makeText('一', setting), 150, 20, 200)
    expect(inkCenter(ctx).shape).toBe(shape)
  })

  it.each([
    [90, 'down'],
    [-90, 'up'],
  ] as const)('rotates clockwise for positive angles (%i: → points %s)', (rotation, expected) => {
    const ctx = createCtx(300, 300)
    drawStyledText(ctx, makeText('→', { rotateGrapheme: rotate('→', rotation) }), 150, 20, 200)
    // the arrow head has more ink than the shaft
    const ink = inkOf(ctx)
    const middle = (ink.top + ink.bottom) / 2
    const data = ctx.getImageData(0, 0, 300, 300).data
    let upper = 0
    let lower = 0
    for (let y = ink.top; y < ink.bottom; y++) {
      for (let x = ink.left; x < ink.right; x++) {
        const alpha = data[(y * 300 + x) * 4 + 3]
        if (y < middle) upper += alpha
        else lower += alpha
      }
    }
    expect(lower > upper ? 'down' : 'up').toBe(expected)
  })

  it.each(['horizontal', 'vertical'] as const)(
    'draws a rotated glyph at the center of its em box (%s)',
    (direction) => {
      const draw = (rotateGrapheme?: BaseOptions['rotateGrapheme']) => {
        const ctx = createCtx(300, 300)
        const setting = { direction, canvasWritingMode: 'horizontal-tb' as const, rotateGrapheme }
        drawStyledText(ctx, makeText('あ□い', setting), 150, 20, 200)
        return ctx
      }
      // "□" advances 1em without rotation, so the rotated one should be at the same place
      const plain = draw()
      const rotated = draw(rotate('□', -90))
      const mask = (ctx: CanvasRenderingContext2D) => {
        // keep only "□" by comparing with the text without it
        const without = createCtx(300, 300)
        const setting = { direction, canvasWritingMode: 'horizontal-tb' as const }
        drawStyledText(without, makeText('あ　い', setting), 150, 20, 200)
        const a = ctx.getImageData(0, 0, 300, 300)
        const b = without.getImageData(0, 0, 300, 300).data
        for (let i = 3; i < a.data.length; i += 4) if (b[i] !== 0) a.data[i] = 0
        const out = createCtx(300, 300)
        out.putImageData(a, 0, 0)
        return inkCenter(out)
      }
      const p = mask(plain)
      const r = mask(rotated)
      expect(Math.abs(r.x - p.x)).toBeLessThanOrEqual(1.5)
      expect(Math.abs(r.y - p.y)).toBeLessThanOrEqual(1.5)
    }
  )

  it('draws a rotated grapheme as a segment by itself', () => {
    const segments: string[] = []
    const spy: Extension<true> = {
      beforeSegment: (_, segment) => {
        segments.push(segment.text.map((c) => c.textChar).join(''))
      },
    }
    const text = makeText('ab😀😀cd', { rotateGrapheme: rotate('😀', -90) }, [], { spy }, { spy: true })
    drawStyledText(createCtx(), text, 0, 0, 1000)
    expect(segments).toEqual(['ab', '😀', '😀', 'cd'])
  })

  it('uses rotations in the pre-measured matrix', () => {
    const text = makeText('あ😀い', { rotateGrapheme: rotate('😀', -90) })
    const direct = createCtx()
    drawStyledText(direct, text, 10, 20, 200)
    const preMeasured = createCtx()
    drawStyledText(preMeasured, text, 10, 20, 200, measureStyledText(text, 200))
    expect(preMeasured.canvas.toDataURL()).toBe(direct.canvas.toDataURL())
  })

  it('restores context state', () => {
    const ctx = createCtx()
    ctx.textAlign = 'end'
    ctx.textBaseline = 'top'
    const transform = ctx.getTransform().toString()
    drawStyledText(ctx, makeText('a😀b', { rotateGrapheme: rotate('😀', 90) }), 10, 20, 200)
    expect([ctx.textAlign, ctx.textBaseline, ctx.getTransform().toString()]).toEqual(['end', 'top', transform])
  })
})
