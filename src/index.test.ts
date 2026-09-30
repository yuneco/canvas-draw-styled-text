import { describe, it, expect } from 'vitest'
import * as lib from '.'

describe('public exports', () => {
  it('exposes functions and sample extensions', () => {
    expect(typeof lib.defineText).toBe('function')
    expect(typeof lib.drawStyledText).toBe('function')
    expect(typeof lib.measureStyledText).toBe('function')
    expect(typeof lib.setDebug).toBe('function')
    expect(typeof lib.isEmoji).toBe('function')
    expect(typeof lib.underLineExtension.beforeSegment).toBe('function')
    expect(typeof lib.markerExtension.beforeSegment).toBe('function')
  })

  it('exposes font weight constants', () => {
    expect(lib.FONT_WEIGHT_NORMAL).toBe(400)
    expect(lib.FONT_WEIGHT_BOLD).toBe(700)
  })
})
