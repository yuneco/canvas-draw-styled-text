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
  // canvas and ctx for vertical writing mode
  const canvasV = createCanvas()
  canvasV.style.writingMode = 'vertical-rl'
  document.body.appendChild(canvasV)
  const ctxV = canvasV.getContext('2d')!
  ctxV.textBaseline = 'middle'

  // canvas and ctx for horizontal writing mode
  const canvasH = createCanvas()
  canvasH.style.writingMode = 'horizontal-tb'
  document.body.appendChild(canvasH)
  const ctxH = canvasH.getContext('2d')!
  ctxH.textBaseline = 'alphabetic'

  return {
    vertical: {
      canvas: canvasV,
      ctx: ctxV,
    },
    horizontal: {
      canvas: canvasH,
      ctx: ctxH,
    },
  }
}

const shared = createShared()

export const sharedCanvas = (dir: 'vertical' | 'horizontal' = 'horizontal') => shared[dir].canvas
export const sharedCtx = (dir: 'vertical' | 'horizontal' = 'horizontal') => shared[dir].ctx
