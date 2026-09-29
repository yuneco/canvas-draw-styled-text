import { describe, it, expect } from 'vitest'
import { defineText } from './defineText'
import { FONT_WEIGHT_NORMAL } from './style'

describe('defineText', () => {
  it('returns the given definition as is', () => {
    const def = {
      text: 'abc',
      setting: {},
      extensions: {},
      initialStyle: {
        fontFamily: 'sans-serif',
        fontSize: 20,
        fontColor: '#000',
        fontWeight: FONT_WEIGHT_NORMAL,
        fontStyle: 'normal',
      },
      styles: [],
    } as const
    expect(defineText(def as any)).toBe(def)
  })
})
