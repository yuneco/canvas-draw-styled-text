import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontSize from 'tiptap-extension-font-size'
import HardBreak from '@tiptap/extension-hard-break'

import './tiptapDemo.css'
import { tiptapStyle2StyledText } from './tiptapStyle2StyledText'
import { drawStyledText } from '../../src'

const toolbarEl = document.querySelector('#toolbar')!

const AlwaysHardBreak = HardBreak.extend({
  addKeyboardShortcuts () {
    return {
      Enter: () => this.editor.commands.setHardBreak()
    }
  }
})
const editor = new Editor({
  element: document.querySelector('#editor')!,
  extensions: [StarterKit.configure({
    hardBreak: false,
  }), TextStyle, Color, FontSize, AlwaysHardBreak],
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

  console.log({content,styledText})

  styledText.setting.lineHeight = 1.5
  
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  drawStyledText(ctx, styledText, 0, 0, 400)
}

const main = async () => {
  await document.fonts.ready
  drawText(editor.getJSON())
}

main()
