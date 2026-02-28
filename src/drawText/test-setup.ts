export {}

const fontFace = new FontFace(
  'BIZ UDPGothic',
  `url(/src/drawText/fixtures/BIZUDPGothic-Regular.ttf)`
)
await fontFace.load()
document.fonts.add(fontFace)
await document.fonts.ready
