import { describe, it, expect } from 'vitest'
import { splitText } from './splitText'

describe('splitText', () => {
  it('splits text into graphemes when lang is given', () => {
    expect(splitText('aあ👨‍👩‍👧❤️‍🔥b', 'ja')).toEqual(['a', 'あ', '👨‍👩‍👧', '❤️‍🔥', 'b'])
  })

  it('keeps all characters in order', () => {
    const text = 'Hello, 世界\n🐈‍⬛'
    expect(splitText(text, 'ja').join('')).toBe(text)
  })
})
