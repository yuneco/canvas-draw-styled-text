import { CharMetrix } from './drawText/defs'
import { drawTextLines, setDebug } from './drawText/drawTextLines'
import { sampleText } from './sampleText'
import './style.css'

const $ = (selector: string) => document.querySelector(selector) as HTMLElement
const app = $('#app')!

const setting = {
  wrapWidth: 500,
  debug: false,
  // overwrite sampleText
  isVertical: sampleText.direction === 'vertical',
  lineHeight: sampleText.lineHeight ?? 1.5,
  // set on main
  onUpdate: () => {},
}

const createAppSizeControl = () => {
  // create slider
  const widthSlider = $('#wrapWidth') as HTMLInputElement
  widthSlider.value = setting.wrapWidth.toString()
  // create slider value display span
  const widthValue = $('#wrapWidthValue')
  widthSlider.addEventListener('input', () => {
    widthValue.innerText = widthSlider.value + 'px'
    setting.wrapWidth = widthSlider.valueAsNumber
    setting.onUpdate()
  })

  // create debug checkbox
  const debugCheckbox = $('#debug') as HTMLInputElement
  debugCheckbox.checked = setting.debug
  debugCheckbox.addEventListener('change', (e) => {
    setting.debug = (e.target as HTMLInputElement).checked
    setting.onUpdate()
  })

  // create vertical checkbox
  const verticalCheckbox = $('#vertical') as HTMLInputElement
  verticalCheckbox.checked = setting.isVertical
  verticalCheckbox.addEventListener('change', (e) => {
    setting.isVertical = (e.target as HTMLInputElement).checked
    setting.onUpdate()
  })

  // create lineHeight slider
  const lineHeightSlider = $('#lineHeight') as HTMLInputElement
  lineHeightSlider.value = setting.lineHeight.toString()
  // create slider value display span
  const lineHeightValue = $('#lineHeightValue')
  lineHeightSlider.addEventListener('input', () => {
    lineHeightValue.innerText = lineHeightSlider.value
    setting.lineHeight = lineHeightSlider.valueAsNumber
    setting.onUpdate()
  })
}

const main = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.style.border = '1px solid black'
  app.appendChild(canvas)

  const lastSetting = {
    wrapWidth: setting.wrapWidth,
    isVertical: setting.isVertical,
  }
  // cache last metrixes for speed up
  // invalidate if wrapWidth or isVertical changed (see setting.onUpdate)
  let lastMetrixes: CharMetrix[] | undefined = undefined

  const draw = () => {
    setDebug(setting.debug)
    // copy sampleText and overwrite settings
    const styledText = { ...sampleText }
    styledText.lineHeight = setting.lineHeight
    styledText.direction = setting.isVertical ? 'vertical' : 'horizontal'
    const isVertical = styledText.direction === 'vertical'

    // set canvas writing mode for vertical text
    canvas.style.writingMode = isVertical ? 'vertical-rl' : 'horizontal-tb'

    const width = canvas.width / 2
    const height = canvas.height / 2
    // draw start position
    // if vertical(=right to left), draw from right
    const x = isVertical ? width : 0
    const wrapWidth = isVertical ? height : width

    console.time('drawText')
    const result = drawTextLines(ctx, styledText, x, 0, wrapWidth, { charWidths: lastMetrixes })
    lastMetrixes = result.charWidths
    console.timeEnd('drawText')
  }

  setting.onUpdate = () => {
    const isVertical = setting.isVertical
    const DEFAULT_HEIGHT = 800
    const width = isVertical ? DEFAULT_HEIGHT : setting.wrapWidth
    const height = isVertical ? setting.wrapWidth : DEFAULT_HEIGHT

    canvas.width = width * 2
    canvas.height = height * 2
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.resetTransform()
    ctx.scale(2, 2) // for retina display

    // invalidate cached metrixes if wrapWidth or isVertical changed
    if (lastSetting.wrapWidth !== setting.wrapWidth || lastSetting.isVertical !== setting.isVertical) {
      lastMetrixes = undefined
    }

    draw()
  }

  createAppSizeControl()
  setting.onUpdate()
}

const waitWebFont = () => {
  document.fonts.ready.then(setting.onUpdate);
}

main()
waitWebFont()