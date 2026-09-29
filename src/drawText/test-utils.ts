import { defineText } from './defs/defineText'
import {
  ExtensionOptions,
  ExtensionsMap,
  InitialStyleWithExtensionOptions,
  StyleInstructionWithExtension,
} from './defs/extension'
import { CharMetrix } from './defs/metrix'
import { BaseOptions, FONT_WEIGHT_NORMAL } from './defs/style'
import { splitText } from './splitText'

// shared helpers for tests. loaded font is set up in test-setup.ts

export const FONT_FAMILY = 'BIZ UDPGothic'
export const FONT_SIZE = 20
export const FONT = `normal ${FONT_WEIGHT_NORMAL} ${FONT_SIZE}px ${FONT_FAMILY}`

/** allowed overhang of glyph ink from layout boxes (px) */
export const INK_MARGIN = 4

export const makeText = <M extends ExtensionsMap = {}>(
  text: string,
  setting: BaseOptions = {},
  styles: StyleInstructionWithExtension<NoInfer<M>>[] = [],
  extensions: M = {} as M,
  initialExtensionOptions: ExtensionOptions<NoInfer<M>> = {}
) =>
  defineText<M>({
    text,
    setting: { lang: 'ja', ...setting },
    extensions,
    initialStyle: {
      fontFamily: FONT_FAMILY,
      fontSize: FONT_SIZE,
      fontColor: '#000',
      fontWeight: FONT_WEIGHT_NORMAL,
      fontStyle: 'normal',
      ...initialExtensionOptions,
    } as InitialStyleWithExtensionOptions<M>,
    styles,
  })

const createdCanvases: HTMLCanvasElement[] = []

export const createCtx = (width = 300, height = 300, writingMode = 'horizontal-tb') => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.writingMode = writingMode
  document.body.appendChild(canvas)
  createdCanvases.push(canvas)
  return canvas.getContext('2d')!
}

export const removeCreatedCanvases = () => {
  createdCanvases.splice(0).forEach((c) => c.remove())
}

/** measure graphemes in the same way as the library (horizontal, FONT) */
export const measureChars = (text: string): CharMetrix[] => {
  const ctx = createCtx(1, 1)
  ctx.font = FONT
  return splitText(text, 'ja').map((textChar) => ({
    textChar,
    metrix: ctx.measureText(textChar === '\n' ? '​' : textChar),
  }))
}

/** bounding box and count of non-transparent pixels */
export const inkOf = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas
  const data = ctx.getImageData(0, 0, width, height).data
  let count = 0
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      count++
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x + 1)
      bottom = Math.max(bottom, y + 1)
    }
  }
  return { count, left, top, right, bottom }
}
