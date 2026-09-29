import { describe, it, expect, afterEach } from 'vitest'
import { drawStyledText } from '../drawText/drawTextLines'
import { createCtx, inkOf, makeText, removeCreatedCanvases } from '../drawText/test-utils'
import { underLineExtension } from './underline'

afterEach(removeCreatedCanvases)

describe('underLineExtension', () => {
  it.each([true, { width: 2 }] as const)('draws underline (option: %o)', (option) => {
    const plain = createCtx()
    drawStyledText(plain, makeText('abc'), 10, 20, 250)

    const decorated = createCtx()
    const text = makeText('abc', {}, [], { underline: underLineExtension }, { underline: option })
    drawStyledText(decorated, text, 10, 20, 250)

    expect(inkOf(decorated).count).toBeGreaterThan(inkOf(plain).count)
  })
})
