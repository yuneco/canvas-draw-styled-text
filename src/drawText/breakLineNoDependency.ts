import { CharMetrix, LineMetrix } from "./defs"

const AVOID_HEAD_CHARS = [..."!),.:;?]]¢—’”‰℃℉、。々〉》」』】〕〟ぁぃぅぇぉっゃゅょゎ゛゜ゝゞァィゥェォッャュョヮヵヶ・ーヽヾ！％），．：；？］｝"]
const AVOID_TAIL_CHARS = [..."([{£§‘“〈《「『【〒〔〝＃＄（＠［｛￥"]
const AVOID_CHARS = [...AVOID_HEAD_CHARS, ...AVOID_TAIL_CHARS]
const ASCII_WORD_CHARS = [..."0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"]

type Word = {
  /** char count */
  length: number;
  /** width(px) of word */
  width: number;
  /** char metrixes in this word */
  chars: CharMetrix[];
}

/**
 * get next word from text
 * @param text source text
 * @param CharMetrixes metrix of all char
 * @param at search start index
 * @returns word start at `at`
 */
const nextWord = (text: string, CharMetrixes: CharMetrix[], at: number): Word => {
  const chars: CharMetrix[] = [CharMetrixes[at]]
  let length = 1
  let width = CharMetrixes[at].metrix.width

  if (ASCII_WORD_CHARS.includes(text[at])) {
    for (let i = at + 1; i < text.length; i++) {
      if (ASCII_WORD_CHARS.includes(text[i])) {
        length++
        width += CharMetrixes[i].metrix.width
        chars.push(CharMetrixes[i])
      } else {
        break;
      }
    }
    return { length, width, chars }
  }

  if (AVOID_CHARS.includes(text[at])) {
    for (let i = at + 1; i < text.length; i++) {
      if (AVOID_CHARS.includes(text[i])) {
        length++
        width += CharMetrixes[i].metrix.width
        chars.push(CharMetrixes[i])
      } else {
        break;
      }
    }
    return { length, width, chars }
  }

  return { length, width, chars }
}

/**
 * get next word includes successor signs from text.
 * @param text source text
 * @param CharMetrixes metrix of all char
 * @param at search start index
 * @returns word start at `at` includes tail chars like `!`, `?`, `.` ...
 */
const nextWordWithTail = (text: string, CharMetrixes: CharMetrix[], at: number): Word => {
  const word = nextWord(text, CharMetrixes, at)

  let index = at + word.length
  while (index < CharMetrixes.length) {
    const char = CharMetrixes[index]
    if (AVOID_HEAD_CHARS.includes(text[index])) {
      word.length++
      word.width += char.metrix.width
      word.chars.push(char)
      index++
    } else {
      break;
    }
  }
  return word
}

/**
 * detect line break with char metrixes.
 * @param text source text
 * @param charMetrixes metrix of all char
 * @param maxWidth wrap width
 * @returns line break metrixes
 */
export const lineBreakWithCharMetrixes = (text: string, charMetrixes: CharMetrix[], maxWidth: number): LineMetrix[] => {
  const lines: LineMetrix[] = []
  const newLine = () => {
    const l = { at: 0, width: 0, lineAscent: 0, lineDescent: 0, lineMargin: 0 }
    lines.push(l)
    return l
  }
  let line: LineMetrix = newLine()

  let index = 0;
  while (index < charMetrixes.length) {
    // check line break char

    const char = text[index]
    if (char === '\n') {
      // not add width for break char
      // add font ascent & descent for height of line
      line.lineAscent = Math.max(line.lineAscent, charMetrixes[index].metrix.fontBoundingBoxAscent )
      line.lineDescent = Math.max(line.lineDescent, charMetrixes[index].metrix.fontBoundingBoxDescent)
  
      index++
      line = newLine()
      line.at = index
      continue
    }

    const word = nextWordWithTail(text, charMetrixes, index);

    if (line.width + word.width > maxWidth) {
      line = newLine()
      line.at = index
    }

    line.width += word.width
    line.lineAscent = Math.max(line.lineAscent, ...word.chars.map(c => c.metrix.fontBoundingBoxAscent) )
    line.lineDescent = Math.max(line.lineDescent, ...word.chars.map(c => c.metrix.fontBoundingBoxDescent))

    index += word.length;
  }
  return lines

}