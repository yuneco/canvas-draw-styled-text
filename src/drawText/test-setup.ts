export {}

const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=BIZ+UDPGothic&display=swap'
document.head.appendChild(link)

await document.fonts.load('30px "BIZ UDPGothic"')
await document.fonts.ready
