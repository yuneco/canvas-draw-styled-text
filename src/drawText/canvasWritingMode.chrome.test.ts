import { describe, it, expect, afterEach } from 'vitest'
import { drawStyledText } from './drawTextLines'
import { createCtx, inkOf, makeText, removeCreatedCanvases } from './test-utils'

// canvasWritingMode on each pinned Chrome version. Run with `pnpm test:chrome`.
// See verticalCanvas.chrome.test.ts for the difference between the versions.

const chromeMajor = Number(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1])
const appliesCssWritingMode = chromeMajor < 154

afterEach(removeCreatedCanvases)

const inkShape = (ctx: CanvasRenderingContext2D) => {
  const ink = inkOf(ctx)
  expect(ink.count).toBeGreaterThan(0)
  return ink.right - ink.left > ink.bottom - ink.top ? 'wide' : 'tall'
}

describe(`canvasWritingMode on Chrome ${chromeMajor}`, () => {
  it("renders vertical layout with horizontal canvas text for 'horizontal-tb'", () => {
    const ctx = createCtx(300, 300, 'vertical-rl')
    drawStyledText(ctx, makeText('一', { direction: 'vertical', canvasWritingMode: 'horizontal-tb' }), 250, 10, 200)
    // glyphs of a regular font are rotated with the line. a font prepared for vertical writing cancels it
    expect(inkShape(ctx)).toBe('tall')
  })

  it(`follows the browser for 'vertical-rl' (${appliesCssWritingMode ? 'upright' : 'sideways'})`, () => {
    const ctx = createCtx(300, 300, 'horizontal-tb')
    drawStyledText(ctx, makeText('一', { direction: 'vertical', canvasWritingMode: 'vertical-rl' }), 250, 10, 200)
    expect(inkShape(ctx)).toBe(appliesCssWritingMode ? 'wide' : 'tall')
  })
})
