const isSaf15 = () => {
  const ua = window.navigator.userAgent.toLowerCase()
  const isSaf = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1
  const is15 = ua.match(/version\/15\.([.0-9])+ safari\//)
  return isSaf && is15
}

const hasVerticalTextOffsetBug = isSaf15()

export const getSafariVerticalOffset = (box: TextMetrics): { x: number; y: number } => {
  const offsetX = hasVerticalTextOffsetBug ? box.hangingBaseline - box.alphabeticBaseline : 0
  const offsetY = hasVerticalTextOffsetBug ? box.alphabeticBaseline : 0

  return { x: offsetX, y: offsetY }
}
