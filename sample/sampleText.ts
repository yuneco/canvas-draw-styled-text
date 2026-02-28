import { FONT_WEIGHT_BOLD, FONT_WEIGHT_NORMAL, defineText, markerExtension, underLineExtension } from '../src'

export const sampleText = defineText({
  // text content to draw
  text: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt _~^,|...
山路を登りながら、こう考えた。

智に働けば角が立つ。情に棹させば流される。意地を通せば窮屈だ。とかくに人の世は住みにくい。
emoji:🐈‍⬛❤️‍🔥👨‍👩‍👧
終わり。
`,
  // base settings applied to whole text box
  setting: {
    lineHeight: 1.5,
    align: 'left',
    direction: 'horizontal',
    lang: 'ja',
    overflowWrap: 'break-word',
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
    fontFamily: '"Noto Sans JP", "Hiragino Maru Gothic Pro"',
    fontSize: 30,
    fontColor: '#333',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },
  // style change instructions.
  styles: [
    {
      at: 5,
      style: { fontWeight: FONT_WEIGHT_BOLD, fontSize: 36, fontColor: '#39a' },
    },
    { at: 12, style: { fontSize: 18, fontColor: '#777' } },
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
      at: 117,
      style: {
        marker: { color: 'gold' },
      },
    },
    {
      at: 127,
      style: {
        marker: false,
        fontSize: 32,
      },
    },
    {
      at: 162,
      style: {
        fontFamily: '"BIZ UDPGothic"',
        underline: true,
        fontSize: 48,
      },
    },
  ],
})
