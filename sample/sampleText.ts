import { FONT_WEIGHT_BOLD, FONT_WEIGHT_NORMAL, defineText, markerExtension, underLineExtension } from "../src";

export const sampleText = defineText({
  // text content to draw
  text: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt _~^,|...

花子は、古びたアトリエで縦書きCanvasに思いを馳せていた。彼女の心は、過去の情熱的な絵画と未来の可能性とで彩られていた。CanvasRenderingContext2Dを通じて、彼女の筆が魔法のように踊り、色と形が交じり合う。「その魔法のキャンバスには、季節が舞い、想像が咲く」。花子の作品は、縦書きならではの風情が溢れ、心の底からの芸術の詩となるのだった。
-fin-`,
  // base settings applied to whole text box
  setting: {
    lineHeight: 1.5,
    align: 'left',
    direction: 'horizontal',
  },
  // style extensions to apply.
  // register your extension here.
  // the keys of this object will be used as style names in initialStyle and styles array.
  extensions: {
    underline: underLineExtension,
    marker: markerExtension,
  },
  // initial style
  initialStyle: {
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontColor: '#333',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },
  // style change instructions.
  styles: [
    {
      at: 5,
      style: { fontFamily: '"Times"', fontWeight: FONT_WEIGHT_BOLD, fontSize: 36, fontColor: '#39a' },
    },
    { at: 12, style: { fontFamily: '"Hiragino Maru Gothic Pro"', fontSize: 18, fontColor: '#777' } },
    {
      at: 22,
      style: { fontWeight: FONT_WEIGHT_BOLD, fontSize: 32, fontColor: '#ea3' },
    },
    {
      at: 27,
      style: { fontWeight: FONT_WEIGHT_NORMAL, fontColor: '#777' },
    },
    {
      at: 58,
      style: {
        fontColor: '#f63',
        fontSize: 40,
        marker: {
          color: '#feee88',
          width: 35,
        },
        underline: {
          width: 2,
        },
      },
    },
    {
      at: 61,
      style: { fontColor: '#777', fontSize: 20, underline: false, marker: false },
    },
    {
      at: 101,
      style: {
        fontFamily: "'Zen Kurenaido'",
        fontColor: '#777',
        fontSize: 18,
      },
    },
    {
      at: 104,
      style: {
        marker: false,
      },
    },
    {
      at: 113,
      style: {
        fontFamily: 'BIZ UDPGothic',
        marker: { color: 'gold' },
      },
    },
    {
      at: 122,
      style: {
        fontFamily: "'Zen Kurenaido'",
        marker: false,
      },
    },
    {
      at: 163,
      style: {
        underline: true,
      },
    },
    {
      at: 188,
      style: {
        underline: false,
      },
    },
  ],
})
