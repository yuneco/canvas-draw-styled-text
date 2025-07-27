import { CharMetrix, LineMetrix } from "./defs/metrix"
import { LineBreaker } from 'css-line-break';

type Word = {
  /** char count */
  length: number;
  /** width(px) of word */
  width: number;
  /** char metrixes in this word */
  chars: CharMetrix[];
}

const WHITE_SPACE = /\p{White_Space}/u;

const createBreaker = (text: string) => {
  return LineBreaker(text, {
    lineBreak: 'strict',
    wordBreak: 'normal'
  });
}
type Breaker = ReturnType<typeof createBreaker>

/**
 * get next word from text
 * @param breaker line breaker for source text
 * @param CharMetrixes metrix of all char
 * @returns next word. if no word, return undefined
 */
const nextWord = (breaker: Breaker, CharMetrixes: CharMetrix[]): Word | undefined => {
  const lb = breaker.next()
  if (lb.done) {
    return undefined
  }
  const start = lb.value.start
  const end = lb.value.end
  const length = end - start
  const chars = CharMetrixes.slice(start, end)
  const width = chars.reduce((sum, c) => sum + c.metrix.width, 0)
  return { length, width, chars }
}

/**
 * split word by max width
 * @param word word to split
 * @param maxWidth max width
 * @returns 1st word, 2nd word. 1st word is the part of word that is less than maxWidth, 2nd word is the rest of word.
 *   2nd word may longer than maxWidth.
 *   if word is less than maxWidth, return single [word] array.
 */
const splitWordByMaxWidth = (word: Word, maxWidth: number): [Word] | [Word, Word] => {
  if (word.width <= maxWidth || word.chars.length <= 1) {
    return [word]
  }

  let totalWidth = 0
  let splitAt = 0
  for (let i = 0; i < word.chars.length; i++) {
    const char = word.chars[i]
    const isWhiteSpace = WHITE_SPACE.test(char.textChar)
    if (i > 0 && totalWidth + char.metrix.width > maxWidth && !isWhiteSpace) {
      splitAt = i
      break
    }
    totalWidth += char.metrix.width
  }

  if (splitAt === 0) {
    return [word]
  }

  return [
    // 1st word
    {
      length: splitAt,
      width: totalWidth,
      chars: word.chars.slice(0, splitAt)
    },
    // 2nd word
    {
      length: word.length - splitAt,
      width: word.width - totalWidth,
      chars: word.chars.slice(splitAt)
    }
  ]
}

/**
 * detect line break with char metrixes.
 * @param text source text
 * @param charMetrixes metrix of all char
 * @param maxWidth wrap width
 * @param forceOverflowWrap break at mid of word if word is overflown
 * @returns line break metrixes
 */
export const lineBreakWithCharMetrixes = (text: string, charMetrixes: CharMetrix[], maxWidth: number, forceOverflowWrap: boolean): LineMetrix[] => {
  const breaker = createBreaker(text)
  let index = 0;

  const lines: LineMetrix[] = []
  const newLine = () => {
    const l = { at: index, width: 0, lineAscent: 0, lineDescent: 0, lineMargin: 0 }
    lines.push(l)
    return l
  }

  // current line
  let line: LineMetrix = newLine()
  // overflown part of word from previous line. exists only forceOverflowWrap option used.
  let overflownWord: Word | undefined = undefined

  // add word to current line and move index to next word
  const addWordToCurrentLine = (word: Word) => {
    line.width += word.width
    line.lineAscent = Math.max(line.lineAscent, ...word.chars.map(c => c.metrix.fontBoundingBoxAscent))
    line.lineDescent = Math.max(line.lineDescent, ...word.chars.map(c => c.metrix.fontBoundingBoxDescent))
    index += word.length;
  }

  while (index < charMetrixes.length) {
    // get next word
    let word: Word | undefined = overflownWord ?? nextWord(breaker, charMetrixes);
    overflownWord = undefined

    // reached end of text
    if (!word) {
      break
    }

    // nothing add after current line created.
    const isLineHead = line.at === index

    // overflow at line head -> split word
    if (forceOverflowWrap && isLineHead && word.width > maxWidth) {
      [word, overflownWord] = splitWordByMaxWidth(word, maxWidth)
      addWordToCurrentLine(word) // add only 1st word to current line
      line = newLine() // create new line for overflown word
      continue
    }

    // overflow at line middle -> break line before this word
    if (!isLineHead && line.width + word.width > maxWidth) {
      overflownWord = word
      line = newLine()
      continue
    }

    // add word to current line
    addWordToCurrentLine(word)

    // if end of line, create additional line
    const isEndOfLine = word.chars.at(-1)?.textChar === '\n'
    if (isEndOfLine) {
      line = newLine()
    }
  }

  return lines

}