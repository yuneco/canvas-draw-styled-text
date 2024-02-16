const isSaf15 = () => {
  const ua = window.navigator.userAgent.toLowerCase()
  const isSaf = ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1
  const is15 = ua.match(/version\/15\.[.0-9]+ .*safari\//) !== null
  return isSaf && is15
}

const hasVerticalTextOffsetBug = isSaf15()

export const getSafariVerticalOffset = (box: TextMetrics): { x: number; y: number } => {
  type SafariTextMetrics = TextMetrics & {
    hangingBaseline?: number
    alphabeticBaseline?: number
  }

  const hangingBaseline = (box as SafariTextMetrics).hangingBaseline
  const alphabeticBaseline = (box as SafariTextMetrics).alphabeticBaseline

  if (hangingBaseline === undefined || alphabeticBaseline === undefined) {
    return { x: 0, y: 0 }
  }

  const offsetX = hasVerticalTextOffsetBug ? hangingBaseline - alphabeticBaseline : 0
  const offsetY = hasVerticalTextOffsetBug ? alphabeticBaseline : 0

  return { x: offsetX, y: offsetY }
}
