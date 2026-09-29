import { CanvasWritingMode } from './defs/style'

type Direction = 'vertical' | 'horizontal'

const createCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  canvas.style.fontKerning = 'none'
  canvas.style.visibility = 'hidden'
  canvas.style.position = 'absolute'
  canvas.style.top = '-1px'
  return canvas
}

const defaultWritingMode = (dir: Direction): CanvasWritingMode => (dir === 'vertical' ? 'vertical-rl' : 'horizontal-tb')

// canvas and ctx for each combination of layout direction and canvas writing mode.
// each canvas keeps its writing mode so that measurement never depends on previous calls.
const shared = new Map<string, { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }>()

const getShared = (dir: Direction, writingMode: CanvasWritingMode) => {
  const key = `${dir}/${writingMode}`
  const cached = shared.get(key)
  if (cached) {
    return cached
  }
  const canvas = createCanvas()
  canvas.style.writingMode = writingMode
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = dir === 'vertical' ? 'middle' : 'alphabetic'
  const created = { canvas, ctx }
  shared.set(key, created)
  return created
}

export const sharedCanvas = (dir: Direction = 'horizontal', writingMode: CanvasWritingMode = defaultWritingMode(dir)) =>
  getShared(dir, writingMode).canvas
export const sharedCtx = (dir: Direction = 'horizontal', writingMode: CanvasWritingMode = defaultWritingMode(dir)) =>
  getShared(dir, writingMode).ctx
