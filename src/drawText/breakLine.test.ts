import { describe, it, expect, beforeEach } from 'vitest'
import { lineBreakWithCharMetrixes } from './breakLine'
import { CharMetrix } from './defs/metrix'

describe('lineBreakWithCharMetrixes', () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')!
    // Set a standard font for consistent measurements
    ctx.font = '16px sans-serif'
  })

  const createCharMetrix = (char: string): CharMetrix => {
    const metrics = ctx.measureText(char)
    return {
      metrix: metrics,
      textChar: char,
    }
  }

  const createCharMetrixes = (text: string): CharMetrix[] => {
    return text.split('').map(char => createCharMetrix(char))
  }

  it('should create a single line for text that fits within maxWidth', () => {
    const text = 'hello'
    const charMetrixes = createCharMetrixes(text)
    const totalWidth = charMetrixes.reduce((sum, c) => sum + c.metrix.width, 0)
    const maxWidth = totalWidth + 10 // Add some margin

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(1)
    expect(result[0].at).toBe(0)
    expect(result[0].width).toBe(totalWidth)
    expect(result[0].lineAscent).toBeGreaterThan(0)
    expect(result[0].lineDescent).toBeGreaterThan(0)
  })

  it('should break into multiple lines when text exceeds maxWidth', () => {
    const text = 'hello world'
    const charMetrixes = createCharMetrixes(text)
    const helloWidth = charMetrixes.slice(0, 5).reduce((sum, c) => sum + c.metrix.width, 0)
    const maxWidth = helloWidth + 5 // Only fits "hello" plus a bit

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result.length).toBeGreaterThan(1)
    expect(result[0].at).toBe(0)
    expect(result[1].at).toBeGreaterThan(0)
  })

  it('should handle newline characters by creating new lines', () => {
    const text = 'hello\nworld'
    const charMetrixes = createCharMetrixes(text)
    const maxWidth = 1000 // Wide enough to fit both words

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(2)
    expect(result[0].at).toBe(0)
    expect(result[1].at).toBe(6) // After "hello\n"
  })

  it('should handle empty text', () => {
    const text = ''
    const charMetrixes: CharMetrix[] = []
    const maxWidth = 100

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(1)
    expect(result[0].at).toBe(0)
    expect(result[0].width).toBe(0)
  })

  it('should calculate correct line metrics with real character measurements', () => {
    const text = 'Aj'
    const charMetrixes = createCharMetrixes(text)
    const maxWidth = 1000

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(1)
    expect(result[0].width).toBe(charMetrixes[0].metrix.width + charMetrixes[1].metrix.width)
    expect(result[0].lineAscent).toBeGreaterThan(0)
    expect(result[0].lineDescent).toBeGreaterThan(0)
  })
})