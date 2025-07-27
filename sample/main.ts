import { MeduredMatrix } from '../src/drawText/defs/metrix'
import { drawStyledText, setDebug } from '../src/drawText/drawTextLines'
import { sampleText } from './sampleText'
import './style.css'

const $ = (selector: string) => document.querySelector(selector) as HTMLElement
const app = $('#app')!

const config = {
  wrapWidth: 500,
  debug: false,
  // overwrite sampleText
  isVertical: sampleText.setting.direction === 'vertical',
  lineHeight: sampleText.setting.lineHeight ?? 1.5,
  align: sampleText.setting.align ?? 'left',
  overflowWrap: sampleText.setting.overflowWrap ?? 'normal',
  // set on main
  onUpdate: (force?: boolean) => {},
}

const createAppSizeControl = () => {
  // init wrapWidth slider
  const widthSlider = $('#wrapWidth') as HTMLInputElement
  widthSlider.value = config.wrapWidth.toString()
  // init slider value display span
  const widthValue = $('#wrapWidthValue')
  widthSlider.addEventListener('input', () => {
    widthValue.innerText = widthSlider.value + 'px'
    config.wrapWidth = widthSlider.valueAsNumber
    config.onUpdate()
  })

  // init debug checkbox
  const debugCheckbox = $('#debug') as HTMLInputElement
  debugCheckbox.checked = config.debug
  debugCheckbox.addEventListener('change', (e) => {
    config.debug = (e.target as HTMLInputElement).checked
    config.onUpdate()
  })

  // init vertical checkbox
  const verticalCheckbox = $('#vertical') as HTMLInputElement
  verticalCheckbox.checked = config.isVertical
  verticalCheckbox.addEventListener('change', (e) => {
    config.isVertical = (e.target as HTMLInputElement).checked
    config.onUpdate()
  })

  // init lineHeight slider
  const lineHeightSlider = $('#lineHeight') as HTMLInputElement
  lineHeightSlider.value = config.lineHeight.toString()
  // init slider value display span
  const lineHeightValue = $('#lineHeightValue')
  lineHeightSlider.addEventListener('input', () => {
    lineHeightValue.innerText = lineHeightSlider.value
    config.lineHeight = lineHeightSlider.valueAsNumber
    config.onUpdate()
  })

  // init align select
  const alignSelect = $('#textAlign') as HTMLSelectElement
  alignSelect.value = config.align
  alignSelect.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value
    const align = (['left', 'center', 'right'] as const).find((a) => a === value)
    if (align) {
      config.align = align
      config.onUpdate()
    }
  })

  // init overflowWrap select
  const overflowWrapSelect = $('#overflowWrap') as HTMLSelectElement
  overflowWrapSelect.value = config.overflowWrap
  overflowWrapSelect.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value
    config.overflowWrap = value === 'break-word' ? 'break-word' : 'normal'
    config.onUpdate()
  })
}

const main = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.style.border = '1px solid black'
  app.appendChild(canvas)

  const lastSetting = {
    wrapWidth: config.wrapWidth,
    isVertical: config.isVertical,
    overflowWrap: config.overflowWrap,
  }
  // cache last metrixes for speed up
  // invalidate if wrapWidth or isVertical changed (see setting.onUpdate)
  let lastMetrixes: Partial<MeduredMatrix> | undefined = undefined

  const draw = () => {
    setDebug(config.debug)
    // copy sampleText and overwrite settings
    const styledText = { ...sampleText }
    styledText.setting.align = config.align
    styledText.setting.lineHeight = config.lineHeight
    styledText.setting.direction = config.isVertical ? 'vertical' : 'horizontal'
    styledText.setting.overflowWrap = config.overflowWrap
    const isVertical = styledText.setting.direction === 'vertical'

    // set canvas writing mode for vertical text
    canvas.style.writingMode = isVertical ? 'vertical-rl' : 'horizontal-tb'

    const width = canvas.width / 2
    const height = canvas.height / 2
    // draw start position
    // if vertical(=right to left), draw from right
    const x = isVertical ? width : 0
    const wrapWidth = isVertical ? height : width

    console.time('drawText')
    lastMetrixes = drawStyledText(ctx, styledText, x, 0, wrapWidth, lastMetrixes)

    console.timeEnd('drawText')
  }

  config.onUpdate = (force) => {
    if (force) {
      lastMetrixes = undefined
    }
    const isVertical = config.isVertical
    const DEFAULT_HEIGHT = 800
    const width = isVertical ? DEFAULT_HEIGHT : config.wrapWidth
    const height = isVertical ? config.wrapWidth : DEFAULT_HEIGHT

    canvas.width = width * 2
    canvas.height = height * 2
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.resetTransform()
    ctx.scale(2, 2) // for retina display

    // invalidate cached metrixes if wrapWidth or isVertical changed
    if (lastSetting.isVertical !== config.isVertical) {
      lastMetrixes = undefined
    }
    if (lastSetting.wrapWidth !== config.wrapWidth && lastMetrixes) {
      lastMetrixes.lineBreaks = undefined
    }
    lastSetting.wrapWidth = config.wrapWidth
    lastSetting.isVertical = config.isVertical
    lastSetting.overflowWrap = config.overflowWrap

    draw()
  }

  createAppSizeControl()
  config.onUpdate()
}

const waitWebFont = async () => {
  await document.fonts.ready
  window.requestAnimationFrame(() => config.onUpdate(true))
}

main()
waitWebFont()
