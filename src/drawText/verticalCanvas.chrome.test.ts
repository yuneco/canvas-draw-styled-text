import { describe, it, expect, afterEach } from 'vitest'
import { defineText } from './defs/defineText'
import { FONT_WEIGHT_NORMAL } from './defs/style'
import { drawStyledText } from './drawTextLines'

// Chrome 154 stopped applying the canvas element's CSS writing-mode/text-orientation to canvas text,
// following the HTML spec (chromium 040623943dfbf0928046c943709b4a6d2755b80e).
// Run with `pnpm test:chrome` on each pinned Chrome version.

const chromeMajor = Number(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1])
const appliesCssWritingMode = chromeMajor < 154

const canvases: HTMLCanvasElement[] = []
const createCtx = (writingMode: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 120
  canvas.height = 120
  canvas.style.writingMode = writingMode
  document.body.appendChild(canvas)
  canvases.push(canvas)
  return canvas.getContext('2d')!
}

afterEach(() => {
  canvases.splice(0).forEach((c) => c.remove())
})

/** whether the ink of the canvas is wider or taller */
const inkShape = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height).data
  let [left, top, right, bottom] = [width, height, 0, 0]
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 128) continue
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x + 1)
      bottom = Math.max(bottom, y + 1)
    }
  }
  expect(right).toBeGreaterThan(left)
  return right - left > bottom - top ? 'wide' : 'tall'
}

// "一" is a horizontal stroke when drawn upright
const text = defineText({
  text: '一',
  setting: { direction: 'vertical', lang: 'ja' },
  extensions: {},
  initialStyle: {
    fontFamily: 'BIZ UDPGothic',
    fontSize: 40,
    fontColor: '#000',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },
  styles: [],
})

describe(`Chrome ${chromeMajor}`, () => {
  it('detects Chrome major version from user agent', () => {
    expect(Number.isFinite(chromeMajor)).toBe(true)
  })

  it(`${appliesCssWritingMode ? 'applies' : 'ignores'} canvas CSS writing-mode to text`, () => {
    const ctx = createCtx('vertical-rl')
    ctx.font = `normal 400 40px "BIZ UDPGothic"`
    ctx.textBaseline = 'middle'
    ctx.fillText('一', 10, 60)
    // glyphs are rotated in vertical-rl canvas, so upright "一" becomes a vertical stroke
    expect(inkShape(ctx)).toBe(appliesCssWritingMode ? 'tall' : 'wide')
  })

  it(`draws CJK in vertical text ${appliesCssWritingMode ? 'upright' : 'sideways'} by default`, () => {
    const ctx = createCtx('vertical-rl')
    drawStyledText(ctx, text, 100, 10, 100)
    expect(inkShape(ctx)).toBe(appliesCssWritingMode ? 'wide' : 'tall')
  })
})
