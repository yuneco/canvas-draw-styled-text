import { describe, it, expect, afterEach } from 'vitest'
import { drawStyledText } from '../drawText/drawTextLines'
import { createCtx, inkOf, makeText, removeCreatedCanvases } from '../drawText/test-utils'
import { markerExtension } from './marker'

afterEach(removeCreatedCanvases)

describe('markerExtension', () => {
  it.each([true, { width: 50, color: '#f00' }] as const)('draws marker (option: %o)', (option) => {
    const plain = createCtx()
    drawStyledText(plain, makeText('abc'), 10, 20, 250)

    const decorated = createCtx()
    const text = makeText('abc', {}, [], { marker: markerExtension }, { marker: option })
    drawStyledText(decorated, text, 10, 20, 250)

    expect(inkOf(decorated).count).toBeGreaterThan(inkOf(plain).count)
  })
})
