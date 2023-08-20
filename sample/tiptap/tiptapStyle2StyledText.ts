import { StyledText } from "../../src"
import { Style } from "../../src/drawText/defs/style"

type TiptapAttrs = {
  color: string
  fontSize: string
}
type TiptapMark = {
  type: "textStyle"
  attrs: Partial<TiptapAttrs>
}
type TiptapSegmentText = {
  text: string
  type: "text"
  marks?: TiptapMark[]
}
type TiptapSegmentHardBreak = {
  type: "hardBreak"
}
type TiptapSegment = TiptapSegmentText | TiptapSegmentHardBreak

export const tiptapStyle2StyledText = (contents: TiptapSegment[]): StyledText<{}> => {
  const initialStyle: Style = {
    fontFamily: "'BIZ UDPGothic', 'Hiragino Kaku Gothic Pro', sans-serif",
    fontSize: 20,
    fontColor: "#333",
    fontWeight: 400,
    fontStyle: "normal",
  }

  const styles: {
    at: number
    style: Partial<typeof initialStyle>
  }[] = []

  let currentText = ""
  let charIndex = 0
  contents.forEach((segment) => {
    let currentStyle = { ...initialStyle }
    if (segment.type === "text") {
      const { text, marks } = segment
      const styleMark = marks?.find((mark) => mark.type === "textStyle")
      if (styleMark) {
        const { color, fontSize } = styleMark.attrs
        if (color) {
          currentStyle.fontColor = color
        }
        if (fontSize) {
          currentStyle.fontSize = parseInt(fontSize) ?? initialStyle.fontSize
        }          
      }
      styles.push({
        at: charIndex,
        style: { ...currentStyle },
      })
      currentText += text
      charIndex += text.length
    } else if (segment.type === "hardBreak") {
      currentText += "\n"
      charIndex++
    }
  })
  return {
    text: currentText,
    initialStyle,
    setting: {},
    extensions: {},
    styles,
  }
}