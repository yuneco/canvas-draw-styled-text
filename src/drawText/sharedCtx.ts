import type { VerticalTextOrientation } from './verticalOrientation'

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

const createShared = () => {
  const createVerticalShared = (orientation: VerticalTextOrientation) => {
    const canvas = createCanvas()
    canvas.style.writingMode = 'vertical-rl'
    canvas.style.textOrientation = orientation
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')!
    ctx.textBaseline = 'middle'
    return { canvas, ctx }
  }

  // canvas and ctx for horizontal writing mode
  const canvasH = createCanvas()
  canvasH.style.writingMode = 'horizontal-tb'
  document.body.appendChild(canvasH)
  const ctxH = canvasH.getContext('2d')!
  ctxH.textBaseline = 'alphabetic'

  return {
    vertical: {
      mixed: createVerticalShared('mixed'),
      sideways: createVerticalShared('sideways'),
    },
    horizontal: {
      canvas: canvasH,
      ctx: ctxH,
    },
  }
}

const shared = createShared()

export const sharedCanvas = (
  dir: 'vertical' | 'horizontal' = 'horizontal',
  orientation: VerticalTextOrientation = 'sideways'
) => {
  if (dir === 'horizontal') {
    return shared.horizontal.canvas
  }

  return shared.vertical[orientation].canvas
}

export const sharedCtx = (
  dir: 'vertical' | 'horizontal' = 'horizontal',
  orientation: VerticalTextOrientation = 'sideways'
) => {
  if (dir === 'horizontal') {
    return shared.horizontal.ctx
  }

  return shared.vertical[orientation].ctx
}
