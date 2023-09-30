import { StyledText, FONT_WEIGHT_NORMAL, FONT_WEIGHT_BOLD } from '../src/drawText/defs'
import { underLineExtension } from '../src/drawText/extensions/underline'
import { markerExtension } from '../src/drawText/extensions/marker'

export const sampleText: StyledText<'underline' | 'marker'> = {
  text: `Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt _~^,|...

花子は、古びたアトリエで縦書きCanvasに思いを馳せていた。彼女の心は、過去の情熱的な絵画と未来の可能性とで彩られていた。CanvasRenderingContext2Dを通じて、彼女の筆が魔法のように踊り、色と形が交じり合う。「その魔法のキャンバスには、季節が舞い、想像が咲く」。花子の作品は、縦書きならではの風情が溢れ、心の底からの芸術の詩となるのだった。
-fin-`,
  initialStyle: {
    fontFamily: 'sans-serif',
    fontSize: 20,
    fontColor: '#333',
    fontWeight: FONT_WEIGHT_NORMAL,
    fontStyle: 'normal',
  },
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
        extension: {
          marker: {
            color: '#feee88',
          },
          underline: true,
        },
      },
    },
    {
      at: 61,
      style: { fontColor: '#777', fontSize: 20, extension: { underline: false, marker: false } },
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
        extension: {
          marker: false
        }
      }
    },
    {
      at: 113,
      style: {
        extension: { marker: { color: 'gold' } },
      },
    },
    {
      at: 122,
      style: {
        extension: {
          marker: false
        }
      }
    },
    {
      at: 163,
      style: {
        extension: { underline: { width: 2 } },
      },
    },
    {
      at: 188,
      style: {
        extension: { underline: false },
      },
    },
  ],
  lineHeight: 1.5,
  align: 'left',
  direction: 'horizontal',
  extensions: {
    underline: underLineExtension,
    marker: markerExtension,
  },
}
