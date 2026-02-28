import { describe, it, expect, beforeAll } from 'vitest'
import { splitText } from './splitText'

const FONT = '30px "BIZ UDPGothic"'

const createCanvas = (writingMode: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  canvas.style.fontKerning = 'none'
  canvas.style.visibility = 'hidden'
  canvas.style.position = 'absolute'
  canvas.style.top = '-1px'
  canvas.style.writingMode = writingMode
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  ctx.font = FONT
  return ctx
}

let ctxV: CanvasRenderingContext2D
let ctxH: CanvasRenderingContext2D

beforeAll(() => {
  const fontLoaded = document.fonts.check(FONT)
  console.log('BIZ UDPGothic loaded:', fontLoaded)

  ctxH = createCanvas('horizontal-tb')
  ctxH.textBaseline = 'alphabetic'
  ctxV = createCanvas('vertical-rl')
  ctxV.textBaseline = 'middle'
})

describe('Issue B: vertical alphanumeric width (WebKit bug)', () => {
  it('control: Japanese full-width characters have consistent width in both modes', () => {
    const chars = ['あ', 'い', '漢']
    for (const ch of chars) {
      const hWidth = ctxH.measureText(ch).width
      const vWidth = ctxV.measureText(ch).width
      const ratio = vWidth / hWidth
      console.log(`[control] "${ch}" h=${hWidth.toFixed(1)} v=${vWidth.toFixed(1)} ratio=${ratio.toFixed(2)}`)
      expect(ratio).toBeGreaterThan(0.5)
      expect(ratio).toBeLessThan(2.0)
    }
  })

  it('vertical width of alphanumeric chars should approximate horizontal height (rotated)', () => {
    const chars = ['A', 'B', 'W', '0', '9']
    for (const ch of chars) {
      const hMetrics = ctxH.measureText(ch)
      const hWidth = hMetrics.width
      const hHeight = hMetrics.actualBoundingBoxAscent + hMetrics.actualBoundingBoxDescent
      const vWidth = ctxV.measureText(ch).width

      console.log(`[B] "${ch}" hW=${hWidth.toFixed(1)} hH=${hHeight.toFixed(1)} vW=${vWidth.toFixed(1)} ratio(vW/hH)=${(vWidth / hHeight).toFixed(2)}`)

      // In vertical mode, alphanumeric chars rotate 90°
      // so vertical width should be close to horizontal height
      // Allow generous tolerance (0.5x - 2.0x) to catch only clear bugs
      expect(vWidth / hHeight).toBeGreaterThan(0.5)
      expect(vWidth / hHeight).toBeLessThan(2.0)
    }
  })
})

describe('Issue C: ZWJ emoji in vertical mode (Chromium bug)', () => {
  const zwjEmojis = ['🐈\u200D⬛', '👨\u200D👩\u200D👧']

  it('control: splitText recognizes ZWJ sequences as single graphemes', () => {
    for (const emoji of zwjEmojis) {
      const segments = splitText(emoji, 'ja')
      console.log(`[control] splitText("${emoji}") => ${segments.length} segment(s): ${JSON.stringify(segments)}`)
      expect(segments).toHaveLength(1)
    }
  })

  it('control: ZWJ emoji width in horizontal mode is reasonable', () => {
    for (const emoji of zwjEmojis) {
      const width = ctxH.measureText(emoji).width
      console.log(`[control] horizontal "${emoji}" width=${width.toFixed(1)}`)
      expect(width).toBeGreaterThan(0)
    }
  })

  it('ZWJ emoji width in vertical mode should not exceed 1.5x horizontal width', () => {
    for (const emoji of zwjEmojis) {
      const hWidth = ctxH.measureText(emoji).width
      const vWidth = ctxV.measureText(emoji).width
      const ratio = vWidth / hWidth
      console.log(`[C] "${emoji}" h=${hWidth.toFixed(1)} v=${vWidth.toFixed(1)} ratio=${ratio.toFixed(2)}`)

      // If the browser decomposes the ZWJ sequence in vertical mode,
      // the width becomes sum of individual characters (much wider)
      expect(ratio).toBeLessThan(1.5)
    }
  })
})
