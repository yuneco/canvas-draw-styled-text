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

describe('lineBreakWithCharMetrixes with long words', () => {
  const linesOf = (text: string, maxWidth: number, breakWord = false) => {
    const chars = measureChars(text)
    const lines = lineBreakWithCharMetrixes(text, chars, maxWidth, breakWord)
    return lines.map((line, i) =>
      chars
        .slice(line.at, lines[i + 1]?.at ?? chars.length)
        .map((c) => c.textChar)
        .join('')
    )
  }
  const longWord = 'Supercalifragilistic'

  it('does not create an empty line before a word longer than maxWidth', () => {
    expect(linesOf(longWord, 60)).toEqual([longWord])
    expect(linesOf(`ab\n${longWord}`, 60)).toEqual(['ab\n', longWord])
    expect(linesOf(`ab ${longWord} cd`, 60)).toEqual(['ab ', `${longWord} `, 'cd'])
  })

  it('breaks a word longer than maxWidth with breakWord', () => {
    for (const text of [longWord, `ab ${longWord} cd`, `ab\n${longWord}`]) {
      for (let maxWidth = 30; maxWidth <= 120; maxWidth += 9) {
        const chars = measureChars(text)
        const lines = lineBreakWithCharMetrixes(text, chars, maxWidth, true)
        expect(linesOf(text, maxWidth, true).join('')).toBe(text)
        lines.forEach((line, i) => {
          if (i > 0) expect(line.at).toBeGreaterThan(lines[i - 1].at)
          // trailing white space may hang over
          const trailingSpace = chars[(lines[i + 1]?.at ?? chars.length) - 1]?.textChar === ' '
          if (!trailingSpace) expect(line.width).toBeLessThanOrEqual(maxWidth)
        })
      }
    }
  })

  it('does not break words that fit in maxWidth with breakWord', () => {
    const text = `ab ${longWord} cd`
    expect(linesOf(text, 1000, true)).toEqual([text])
    expect(linesOf('あいう。かきく', 1000, true)).toEqual(['あいう。かきく'])
  })

  it('keeps a grapheme wider than maxWidth as is with breakWord', () => {
    expect(linesOf('W', 1, true)).toEqual(['W'])
    expect(linesOf('WW', 1, true)).toEqual(['W', 'W'])
    const emoji = measureChars('🐈‍⬛A')
    const maxWidth = emoji[0].metrix.width + emoji[1].metrix.width / 2
    expect(linesOf('🐈‍⬛A', maxWidth, true)).toEqual(['🐈‍⬛', 'A'])
  })

  it('does not create an extra line when only trailing white space overflows with breakWord', () => {
    const width = measureChars('abc').reduce((sum, c) => sum + c.metrix.width, 0)
    expect(linesOf('abc   ', width + 1, true)).toEqual(['abc   '])
  })
})
