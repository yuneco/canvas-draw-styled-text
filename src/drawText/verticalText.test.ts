import { describe, it, expect, beforeAll, vi } from 'vitest'
import { defineText } from './defs/defineText'
import { FONT_WEIGHT_NORMAL } from './defs/style'
import { drawStyledText, setDebug } from './drawTextLines'
import { splitText } from './splitText'
import { getVerticalTextOrientation } from './verticalOrientation'

const FONT_WAIT_TIMEOUT_MS = 5000

const FONTS = [
  { name: 'BIZ UDPGothic', file: '/src/drawText/fixtures/BIZUDPGothic-Regular.ttf' },
  { name: 'Noto Sans JP', file: '/src/drawText/fixtures/NotoSansJP-Regular.ttf' },
  { name: 'Roboto', file: '/src/drawText/fixtures/Roboto-Regular.ttf' },
] as const

const SYSTEM_FONT = 'Arial'

const createCanvas = (writingMode: string, textOrientation = 'mixed') => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  canvas.style.fontKerning = 'none'
  canvas.style.visibility = 'hidden'
  canvas.style.position = 'absolute'
  canvas.style.top = '-1px'
  canvas.style.writingMode = writingMode
  canvas.style.textOrientation = textOrientation
  document.body.appendChild(canvas)
  return canvas.getContext('2d')!
}

const getBrowserName = () => {
  const ua = navigator.userAgent
  if (ua.includes('HeadlessChrome') || ua.includes('Chrome')) return 'chromium'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'webkit'
  return ua
}

const waitForFont = async (font: string, sampleText: string) => {
  const startedAt = performance.now()
  while (performance.now() - startedAt < FONT_WAIT_TIMEOUT_MS) {
    await document.fonts.load(font, sampleText)
    await document.fonts.ready
    if (document.fonts.check(font, sampleText)) return true
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return document.fonts.check(font, sampleText)
}

let ctxV: CanvasRenderingContext2D
let ctxH: CanvasRenderingContext2D
let browserName: string

beforeAll(async () => {
  browserName = getBrowserName()
  console.log(`[setup][${browserName}] userAgent: ${navigator.userAgent}`)

  // Load web fonts from local fixtures
  for (const f of FONTS) {
    const face = new FontFace(f.name, `url(${f.file})`)
    await face.load()
    document.fonts.add(face)
  }
  await document.fonts.ready

  for (const f of FONTS) {
    const css = `30px "${f.name}"`
    const ok = await waitForFont(css, 'W漢')
    console.log(`[setup][${browserName}] ${f.name} loaded: ${ok}`)
    if (!ok) throw new Error(`Failed to load font: ${css}`)
  }

  ctxH = createCanvas('horizontal-tb')
  ctxH.textBaseline = 'alphabetic'
  ctxV = createCanvas('vertical-rl', 'sideways')
  ctxV.textBaseline = 'middle'
})

// This library renders vertical text by rotating the drawing canvas 90° and
// calling fillText horizontally (see drawTextLines.ts L274-276). The advance
// width used to position each glyph comes from measureText().width on a
// separate *measurement* canvas whose CSS writingMode is 'vertical-rl'.
//
// For correct glyph spacing the measurement canvas must return the same
// advance width that fillText will actually consume on the (non-vertical)
// drawing canvas. Because the drawing canvas draws horizontally, that
// advance width equals the *horizontal* measureText().width of the glyph.
//
// In other words:
//   vertical measureText().width  ≈  horizontal measureText().width
//
// With text-orientation: sideways on the measurement canvas, both Chromium
// and WebKit return horizontal-equivalent advance widths. Without it,
// WebKit returns the font height for alphanumeric characters in vertical
// mode, causing full-width (monospaced) spacing instead of proportional.

const allFonts = [...FONTS.map((f) => f.name), SYSTEM_FONT]
const testChars = ['l', 'W', 'M', 'I', '1']

describe('Issue B: vertical alphanumeric measureText width', () => {
  it('control: Japanese full-width characters have consistent width in both modes', () => {
    const chars = ['あ', 'い', '漢']
    for (const fontName of allFonts) {
      const css = `30px "${fontName}"`
      ctxH.font = css
      ctxV.font = css
      for (const ch of chars) {
        const hWidth = ctxH.measureText(ch).width
        const vWidth = ctxV.measureText(ch).width
        // Skip if font doesn't have this glyph (width=0 or fallback)
        if (hWidth === 0) continue
        const ratio = vWidth / hWidth
        console.log(`[control][${browserName}] ${fontName} "${ch}" h=${hWidth.toFixed(1)} v=${vWidth.toFixed(1)} ratio=${ratio.toFixed(2)}`)
        expect(ratio).toBeGreaterThan(0.5)
        expect(ratio).toBeLessThan(2.0)
      }
    }
  })

  it.each(allFonts)(
    'vertical measureText width should match horizontal width (%s)',
    (fontName) => {
      const css = `30px "${fontName}"`
      ctxH.font = css
      ctxV.font = css

      for (const ch of testChars) {
        const hWidth = ctxH.measureText(ch).width
        const vWidth = ctxV.measureText(ch).width
        if (hWidth === 0) continue

        const ratio = vWidth / hWidth
        console.log(
          `[B][${browserName}] ${fontName} "${ch}" hW=${hWidth.toFixed(1)} vW=${vWidth.toFixed(1)} ratio=${ratio.toFixed(2)}`
        )

        // vertical measureText().width should be close to horizontal measureText().width.
        // A large deviation means the browser returns a rotated metric (e.g. font height)
        // instead of the glyph advance width, causing full-width spacing on vertical text.
        expect(ratio).toBeGreaterThan(0.8)
        expect(ratio).toBeLessThan(1.2)
      }
    }
  )
})

describe('Issue C: ZWJ emoji in vertical mode', () => {
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

describe('Vertical orientation classification', () => {
  it('treats ASCII printable characters and emoji as sideways', () => {
    expect(getVerticalTextOrientation('A')).toBe('sideways')
    expect(getVerticalTextOrientation('7')).toBe('sideways')
    expect(getVerticalTextOrientation('(')).toBe('sideways')
    expect(getVerticalTextOrientation(' ')).toBe('sideways')
    expect(getVerticalTextOrientation('😀')).toBe('sideways')
    expect(getVerticalTextOrientation('🐈\u200D⬛')).toBe('sideways')

    expect(getVerticalTextOrientation('あ')).toBe('mixed')
    expect(getVerticalTextOrientation('漢')).toBe('mixed')
    expect(getVerticalTextOrientation('。')).toBe('mixed')
    expect(getVerticalTextOrientation('Ａ')).toBe('mixed')
    expect(getVerticalTextOrientation('\n')).toBe('mixed')
  })
})

describe('Vertical mixed/sideways segmentation', () => {
  const createStyledText = (value: string, direction: 'vertical' | 'horizontal') =>
    defineText({
      text: value,
      setting: {
        direction,
        lang: 'ja',
      },
      extensions: {},
      initialStyle: {
        fontFamily: `"${FONTS[0].name}"`,
        fontSize: 30,
        fontColor: '#000',
        fontWeight: FONT_WEIGHT_NORMAL,
        fontStyle: 'normal',
      },
      styles: [],
    })

  const collectSegmentLogs = (logSpy: ReturnType<typeof vi.spyOn>) =>
    logSpy.mock.calls
      .filter((call: unknown[]) => call[0] === '[drawStyledText:segment]')
      .map((call: unknown[]) => call[1] as { text: string; textOrientation: string })
      .map((entry: { text: string; textOrientation: string }) => ({
        text: entry.text,
        orientation: entry.textOrientation,
      }))

  it('splits vertical text into mixed and sideways runs', async () => {
    const drawCtx = createCanvas('vertical-rl')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    setDebug(true)

    await drawStyledText(drawCtx, createStyledText('あいうlll123', 'vertical'), 0, 0, 1000)

    const calls = collectSegmentLogs(logSpy)
    setDebug(false)
    logSpy.mockRestore()
    expect(calls).toEqual([
      { text: 'あいう', orientation: 'mixed' },
      { text: 'lll123', orientation: 'sideways' },
    ])
  })

  it('keeps ASCII-only runs on sideways in vertical mode', async () => {
    const drawCtx = createCanvas('vertical-rl')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    setDebug(true)

    await drawStyledText(drawCtx, createStyledText('Hello, world!', 'vertical'), 0, 0, 1000)

    const calls = collectSegmentLogs(logSpy)
    setDebug(false)
    logSpy.mockRestore()
    expect(calls).toEqual([{ text: 'Hello, world!', orientation: 'sideways' }])
  })

  it('does not change horizontal segmentation behavior', async () => {
    const drawCtx = createCanvas('horizontal-tb')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    setDebug(true)

    await drawStyledText(drawCtx, createStyledText('あいうlll123', 'horizontal'), 0, 0, 1000)

    const calls = collectSegmentLogs(logSpy)
    setDebug(false)
    logSpy.mockRestore()
    expect(calls).toEqual([{ text: 'あいうlll123', orientation: 'mixed' }])
  })
})
