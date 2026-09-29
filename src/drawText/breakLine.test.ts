import { describe, it, expect, afterEach } from 'vitest'
import { lineBreakWithCharMetrixes } from './breakLine'
import { measureChars, removeCreatedCanvases } from './test-utils'

afterEach(removeCreatedCanvases)

describe('lineBreakWithCharMetrixes', () => {
  it('keeps text in a single line when it fits', () => {
    const text = 'Hello, 世界'
    const chars = measureChars(text)
    const lines = lineBreakWithCharMetrixes(text, chars, 1000)
    expect(lines).toHaveLength(1)
    expect(lines[0].at).toBe(0)
    expect(lines[0].width).toBeCloseTo(
      chars.reduce((sum, c) => sum + c.metrix.width, 0),
      5
    )
  })

  it('breaks lines at newline', () => {
    const text = 'abc\ndef'
    const lines = lineBreakWithCharMetrixes(text, measureChars(text), 1000)
    expect(lines.map((l) => l.at)).toEqual([0, 4])
  })

  it('wraps lines within maxWidth without breaking before closing punctuation', () => {
    const text = 'あいうえお。かきくけこ、さしすせそ。たちつてと'
    const chars = measureChars(text)
    for (let maxWidth = 60; maxWidth <= 300; maxWidth += 7) {
      const lines = lineBreakWithCharMetrixes(text, chars, maxWidth)
      expect(lines.length).toBeGreaterThan(1)
      lines.forEach((line, i) => {
        if (i === 0) expect(line.at).toBe(0)
        else expect(line.at).toBeGreaterThan(lines[i - 1].at)
        expect(line.width).toBeLessThanOrEqual(maxWidth)
        expect(['、', '。']).not.toContain(chars[line.at].textChar)
      })
    }
  })
})
