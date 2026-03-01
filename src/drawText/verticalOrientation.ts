import { splitText } from './splitText'

export type VerticalTextOrientation = 'mixed' | 'sideways'

const ASCII_SIDEWAYS_MIN = 0x20
const ASCII_SIDEWAYS_MAX = 0x7e
const EMOJI_SIDEWAYS = /\p{Extended_Pictographic}/u

export const getVerticalTextOrientation = (grapheme: string): VerticalTextOrientation => {
  if (!grapheme) {
    return 'mixed'
  }

  if (EMOJI_SIDEWAYS.test(grapheme)) {
    return 'sideways'
  }

  for (const char of grapheme) {
    const codePoint = char.codePointAt(0)
    if (codePoint === undefined || codePoint < ASCII_SIDEWAYS_MIN || codePoint > ASCII_SIDEWAYS_MAX) {
      return 'mixed'
    }
  }

  return 'sideways'
}

export const getVerticalTextOrientations = (text: string, lang?: string): VerticalTextOrientation[] => {
  const chars = splitText(text, lang)
  return chars.map(getVerticalTextOrientation)
}
