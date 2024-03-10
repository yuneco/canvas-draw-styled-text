export const splitText = (text: string, lang?: string): string[] => {
  if (!Intl.Segmenter || !lang) {
    return [...text]
  }

  const segmenter = new Intl.Segmenter(lang, { granularity: 'grapheme' })
  const segments = segmenter.segment(text)
  return [...segments].map((s) => s.segment)
}
