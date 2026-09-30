import { describe, it, expect } from 'vitest'
import { isEmoji } from './isEmoji'

describe('isEmoji', () => {
  it.each(['😀', '👨‍👩‍👧', '🐈‍⬛', '❤️‍🔥', '❤️', '🇯🇵', '1️⃣', '©️', '👍🏽', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'])('%s is emoji', (g) => {
    expect(isEmoji(g)).toBe(true)
  })

  it.each(['あ', 'A', '1', '#', '©', '™', '❤', '→', ' '])('%s is not emoji', (g) => {
    expect(isEmoji(g)).toBe(false)
  })
})
