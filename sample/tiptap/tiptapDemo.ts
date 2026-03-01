import { Editor, Extension } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style'

import './tiptapDemo.css'
import { tiptapStyle2StyledText } from './tiptapStyle2StyledText'
import { drawStyledText } from '../../src'

const toolbarEl = document.querySelector('#toolbar')!

const EnterAsHardBreak = Extension.create({
  name: 'enterAsHardBreak',
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => editor.commands.setHardBreak(),
    }
  },
})
const editor = new Editor({
  element: document.querySelector('#editor')!,
  extensions: [StarterKit, TextStyle, Color, FontSize, EnterAsHardBreak],
  content: '<p>あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。</p>',
  onUpdate: ({ editor }) => {
    const json = editor.getJSON()
    drawText(json)
  }
})

const COLORS = [
  '#000',
  '#F94144',
  '#F8961E',
  '#F9C74F',
  '#90BE6D',
  '#43AA8B',
  '#0077B6',   
]
const SIZES = [12, 20, 36]

const createColorButton = (color: string) => {
  const btn = document.createElement('button')

  btn.classList.add('colorButton')
  btn.style.color = color
  btn.textContent = color
  btn.onclick = () => editor.chain().focus().setColor(color).run()

  return btn
}

const createSizeButton = (size: number) => {
  const btn = document.createElement('button')

  btn.classList.add('sizeButton')
  btn.textContent = `${size}px`
  btn.onclick = () => editor.chain().focus().setFontSize(`${size}px`).run()
  return btn
}


COLORS.forEach(color => {
  toolbarEl.appendChild(createColorButton(color))
})
SIZES.forEach(size => {
  toolbarEl.appendChild(createSizeButton(size))
})

// vertical/horizontal toggle
let isVertical = false
const toggleBtn = document.createElement('button')
toggleBtn.textContent = '横書き'
toggleBtn.classList.add('sizeButton')
const editorEl = document.querySelector('#editor') as HTMLElement
toggleBtn.onclick = () => {
  isVertical = !isVertical
  toggleBtn.textContent = isVertical ? '縦書き' : '横書き'
  editorEl.style.writingMode = isVertical ? 'vertical-rl' : 'horizontal-tb'
  editorEl.style.textOrientation = isVertical ? 'sideways' : ''
  redraw()
}
toolbarEl.appendChild(toggleBtn)

const canvasWidth = 400
const canvasHeight = 300
const DPI = Math.min(window.devicePixelRatio, 2)
const canvas = document.getElementById('canvas') as HTMLCanvasElement
canvas.width = canvasWidth * DPI
canvas.height = canvasHeight * DPI
canvas.style.width = `${canvasWidth}px`
canvas.style.height = `${canvasHeight}px`
const ctx = canvas.getContext('2d')!
ctx.scale(DPI, DPI)

const drawText = (json: any) => {
  const content = json.content?.[0]?.content
  if (!content || !(content.length > 0)) return
  const styledText = tiptapStyle2StyledText(content)

  styledText.setting.lineHeight = 1.5
  styledText.setting.direction = isVertical ? 'vertical' : 'horizontal'

  canvas.style.writingMode = isVertical ? 'vertical-rl' : 'horizontal-tb'
  canvas.style.textOrientation = ''
  ctx.resetTransform()
  ctx.scale(DPI, DPI)
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const x = isVertical ? canvasWidth : 0
  const wrapWidth = isVertical ? canvasHeight : canvasWidth

  drawStyledText(ctx, styledText, x, 0, wrapWidth)
}

const redraw = () => drawText(editor.getJSON())

const main = async () => {
  await document.fonts.ready
  redraw()
}

main()
