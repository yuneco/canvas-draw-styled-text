import { CharMetrix, LineMetrix } from './defs/metrix'
import { LineBreaker } from 'css-line-break'

type Word = {
  /** char count */
  length: number
  /** width(px) of word */
  width: number
  /** char metrixes in this word */
  chars: CharMetrix[]
}

const createBreaker = (text: string) => {
  return LineBreaker(text, {
    lineBreak: 'strict',
    wordBreak: 'normal',
  })
}
type Breaker = ReturnType<typeof createBreaker>

/**
 * get next word from text
 * @param breaker line breaker for source text
 * @param charMetrixes rest chars. NOTE: this function will consume this array.
 * @returns next word. if no word, return undefined
 */
const nextWord = (breaker: Breaker, charMetrixes: CharMetrix[]): Word | undefined => {
  const lb = breaker.next()
  if (lb.done) {
    return undefined
  }
  const start = lb.value.start
  const end = lb.value.end
  let restCodePointCount = end - start
  const chars: CharMetrix[] = []
  while (restCodePointCount > 0) {
    const char = charMetrixes.shift()
    if (!char) {
      break
    }
    chars.push(char)
    // reduce code point count.
    // char.textChar is a single glyph, but it may be a surrogate pair.
    restCodePointCount -= [...char.textChar].length
  }

  const width = chars.reduce((sum, c) => sum + c.metrix.width, 0)
  return { length: chars.length, width, chars }
}

const WHITE_SPACE = /\p{White_Space}/u

/**
 * split word by max width
 * @param word word to split
 * @param maxWidth max width
 * @returns 1st word that fits in maxWidth (at least 1 char), and the rest of word if split.
 *   the rest may still be longer than maxWidth. white spaces are never moved to the rest.
 */
const splitWordByMaxWidth = (word: Word, maxWidth: number): [Word] | [Word, Word] => {
  let width = 0
  let splitAt = 0
  for (let i = 0; i < word.chars.length; i++) {
    const char = word.chars[i]
    if (i > 0 && width + char.metrix.width > maxWidth && !WHITE_SPACE.test(char.textChar)) {
      splitAt = i
      break
    }
    width += char.metrix.width
  }

  if (splitAt === 0) {
    return [word]
  }

  return [
    { length: splitAt, width, chars: word.chars.slice(0, splitAt) },
    { length: word.length - splitAt, width: word.width - width, chars: word.chars.slice(splitAt) },
  ]
}

/**
 * detect line break with char metrixes.
 * @param text source text
 * @param charMetrixes metrix of all char
 * @param maxWidth wrap width
 * @param breakWord break a word at line head in the middle if it is longer than maxWidth (overflow-wrap: break-word)
 * @returns line break metrixes
 */
export const lineBreakWithCharMetrixes = (
  text: string,
  charMetrixes: CharMetrix[],
  maxWidth: number,
  breakWord = false
): LineMetrix[] => {
  const breaker = createBreaker(text)
  const restChars = [...charMetrixes]
  const lines: LineMetrix[] = []
  let index = 0
  const newLine = () => {
    const l = { at: index, width: 0, lineAscent: 0, lineDescent: 0, lineMargin: 0 }
    lines.push(l)
    return l
  }
  let line: LineMetrix = newLine()

  const addWord = (word: Word) => {
    line.width += word.width
    line.lineAscent = Math.max(line.lineAscent, ...word.chars.map((c) => c.metrix.fontBoundingBoxAscent))
    line.lineDescent = Math.max(line.lineDescent, ...word.chars.map((c) => c.metrix.fontBoundingBoxDescent))
    index += word.length
  }

  // word (or rest of a split word) to put at the head of the next line
  let pendingWord: Word | undefined = undefined
  while (pendingWord || restChars.length > 0) {
    const word: Word | undefined = pendingWord ?? nextWord(breaker, restChars)
    pendingWord = undefined
    if (!word) {
      break
    }

    const isLineHead = line.at === index

    // overflow at line middle -> move the word to the next line
    if (!isLineHead && line.width + word.width > maxWidth) {
      line = newLine()
      pendingWord = word
      continue
    }

    // overflow at line head -> keep the word as is, or split it with breakWord option
    if (breakWord && isLineHead && word.width > maxWidth) {
      const [head, rest] = splitWordByMaxWidth(word, maxWidth)
      if (rest) {
        addWord(head)
        line = newLine()
        pendingWord = rest
        continue
      }
    }

    addWord(word)

    const isEndOfLine = word.chars.at(-1)?.textChar === '\n'
    if (isEndOfLine) {
      line = newLine()
    }
  }
  return lines
}
