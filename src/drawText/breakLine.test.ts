import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { lineBreakWithCharMetrixes } from './breakLine'
import { CharMetrix } from './defs/metrix'

describe('lineBreakWithCharMetrixes', () => {
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  // 測定済み文字幅（一度だけ測定）
  let charWidths: Record<string, number>
  let charMetrics: Record<string, TextMetrics>

  beforeAll(() => {
    // 文字幅測定用のCanvasを作成（一度だけ）
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')!
    measureCtx.font = '16px sans-serif'

    // 事前に各文字の幅を測定してテストで使用
    const testChars = ['h', 'e', 'l', 'o', 'w', 'r', 'd', 'A', 'j', ' ', '\n']
    charWidths = {}
    charMetrics = {}

    testChars.forEach(char => {
      const metrics = measureCtx.measureText(char)
      charWidths[char] = metrics.width
      charMetrics[char] = metrics
    })

    // デバッグ用：測定した文字幅を表示
    console.log('Measured character widths:', charWidths)
  })

  beforeEach(() => {
    // 各テスト用のCanvasを作成
    canvas = document.createElement('canvas')
    ctx = canvas.getContext('2d')!
    ctx.font = '16px sans-serif'
  })

  const createCharMetrix = (char: string): CharMetrix => {
    const metrics = charMetrics[char] || ctx.measureText(char)
    return {
      metrix: metrics,
      textChar: char,
    }
  }

  const createCharMetrixes = (text: string): CharMetrix[] => {
    return text.split('').map(char => createCharMetrix(char))
  }

  // 文字列の期待幅を計算するヘルパー関数
  const calculateExpectedWidth = (text: string): number => {
    return text.split('').reduce((sum, char) => {
      return sum + (charWidths[char] || ctx.measureText(char).width)
    }, 0)
  }

  it('should create a single line for text that fits within maxWidth', () => {
    // 最大幅に収まるテキストが単一行になることを検証
    // 事前に測定した文字幅を使用して正確な期待値を設定
    const text = 'hello'
    const charMetrixes = createCharMetrixes(text)
    const expectedWidth = calculateExpectedWidth(text)
    const maxWidth = expectedWidth + 10 // Add some margin

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(1)
    expect(result[0].at).toBe(0)
    expect(result[0].width).toBe(expectedWidth)
    expect(result[0].lineAscent).toBeGreaterThan(0)
    expect(result[0].lineDescent).toBeGreaterThan(0)
  })

  it('should break into multiple lines when text exceeds maxWidth', () => {
    // 最大幅を超えるテキストが複数行に折り返されることを検証
    // "hello "（スペース含む）の正確な幅で制限し、"world"が次の行に送られることを確認
    const text = 'hello world'
    const charMetrixes = createCharMetrixes(text)
    const helloSpaceWidth = calculateExpectedWidth('hello ')
    const worldWidth = calculateExpectedWidth('world')
    const maxWidth = helloSpaceWidth + 5 // "hello "まで収まる幅

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result.length).toBeGreaterThan(1)
    expect(result[0].at).toBe(0)
    expect(result[0].width).toBe(helloSpaceWidth)
    expect(result[1].at).toBe(6) // "hello "の後から開始
    expect(result[1].width).toBe(worldWidth)
  })

  it('should handle newline characters by creating new lines', () => {
    // 改行文字（\n）によって強制的に新しい行が作られることを検証
    // 十分な幅があっても改行文字で行が分かれることを確認
    const text = 'hello\nworld'
    const charMetrixes = createCharMetrixes(text)
    // 改行文字も単語として扱われるため、"hello\n"の幅を期待値とする
    const helloWithNewlineWidth = calculateExpectedWidth('hello\n')
    const worldWidth = calculateExpectedWidth('world')
    const maxWidth = 1000 // Wide enough to fit both words

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(2)
    expect(result[0].at).toBe(0)
    // 改行文字も含めた幅が計算される
    expect(result[0].width).toBe(helloWithNewlineWidth)
    expect(result[1].at).toBe(6) // After "hello\n"
    expect(result[1].width).toBe(worldWidth)
  })

  it('should handle empty text', () => {
    // 空のテキストでも最低1行は作られることを検証
    // 幅0の行が1つ作られることを確認
    const text = ''
    const charMetrixes: CharMetrix[] = []
    const maxWidth = 100

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(1)
    expect(result[0].at).toBe(0)
    expect(result[0].width).toBe(0)
  })

  it('should calculate correct line metrics with real character measurements', () => {
    // 実際のフォントメトリクスを使用して正確な行の寸法が計算されることを検証
    // 事前に測定した文字幅を使用して期待値を設定
    const text = 'Aj'
    const charMetrixes = createCharMetrixes(text)
    const expectedWidth = calculateExpectedWidth(text)
    const maxWidth = 1000

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    expect(result).toHaveLength(1)
    expect(result[0].width).toBe(expectedWidth)
    expect(result[0].lineAscent).toBeGreaterThan(0)
    expect(result[0].lineDescent).toBeGreaterThan(0)
  })

  it('EXPECTED TO FAIL: should not allow any line to exceed maxWidth (current limitation)', () => {
    // 【現状の制限事項を示すテスト】単語が最大幅を超える場合の問題を検証
    // 現在のロジックでは、一つの単語が最大幅を超えてもそのまま配置されてしまう
    // このテストは現状では失敗することが期待される（実装の改善が必要）
    const text = 'hello'
    const charMetrixes = createCharMetrixes(text)
    const expectedWordWidth = calculateExpectedWidth(text)
    const maxWidth = expectedWordWidth / 2 // 単語の半分の幅に制限

    const result = lineBreakWithCharMetrixes(text, charMetrixes, maxWidth)

    // すべての行の幅がmaxWidthを超えないことを期待するが、現状では失敗する
    const maxLineWidth = Math.max(...result.map(line => line.width))
    expect(maxLineWidth).toBeLessThanOrEqual(maxWidth) // これが失敗する（行の幅がmaxWidthを超える）

    // デバッグ情報を出力
    console.log(`Expected word width: ${expectedWordWidth}, Max width: ${maxWidth}, Actual max line width: ${maxLineWidth}`)
    console.log(`Lines: ${result.length}`)
    result.forEach((line, i) => {
      console.log(`Line ${i}: width=${line.width}, at=${line.at}`)
    })
  })
})