import { CharMetrix, LineMetrix } from "./defs/metrix"
import {LineBreaker} from 'css-line-break';

type Word = {
  /** char count */
  length: number;
  /** width(px) of word */
  width: number;
  /** char metrixes in this word */
  chars: CharMetrix[];
}

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
 * detect line break with char metrixes.
 * @param text source text
 * @param charMetrixes metrix of all char
 * @param maxWidth wrap width
 * @returns line break metrixes
 */
export const lineBreakWithCharMetrixes = (text: string, charMetrixes: CharMetrix[], maxWidth: number): LineMetrix[] => {
  const breaker = createBreaker(text)
  const lines: LineMetrix[] = []
  const newLine = () => {
    const l = { at: 0, width: 0, lineAscent: 0, lineDescent: 0, lineMargin: 0 }
    lines.push(l)
    return l
  }
  let line: LineMetrix = newLine()

  let index = 0;
  while (index < charMetrixes.length) {
    const word = nextWord(breaker, charMetrixes);
    if (!word) {
      break
    }

    if (line.width + word.width > maxWidth) {
      line = newLine()
      line.at = index
    }

    line.width += word.width
    line.lineAscent = Math.max(line.lineAscent, ...word.chars.map(c => c.metrix.fontBoundingBoxAscent) )
    line.lineDescent = Math.max(line.lineDescent, ...word.chars.map(c => c.metrix.fontBoundingBoxDescent))

    index += word.length;

    const isEndOfLine = word.chars.at(-1)?.textChar === '\n'
    if (isEndOfLine) {
      line = newLine()
      line.at = index
    }
  }
  return lines

}