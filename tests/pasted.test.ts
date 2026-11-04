import { expect, test } from 'claude-code/testing'

import { centred, tileBox, tileRow } from '../hooks/layout'
import { tagsOf } from '../hooks/pasted'
import { pngSize } from '../hooks/png'

const pngHead = (width: number, height: number) => {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 0, 0, 0, 0, 0])
  new DataView(bytes.buffer).setUint32(16, width)
  new DataView(bytes.buffer).setUint32(20, height)
  return btoa(String.fromCharCode(...bytes))
}

test('the tags of a draft: each number once, in order', () => {
  expect(tagsOf('see [Image #2], [Image #1] and [Image #2] again')).toEqual([2, 1])
  expect(tagsOf('[Image 1] [image #3]')).toEqual([])
})

test('a PNG size comes from the IHDR, and anything else is refused', () => {
  expect(pngSize(pngHead(1630, 632))).toEqual({ width: 1630, height: 632 })
  expect(pngSize(pngHead(0, 10))).toBeNull()
  expect(pngSize(btoa('\xff\xd8\xff\xe0 a jpeg, not a png, long enough'))).toBeNull()
  expect(pngSize(btoa('short'))).toBeNull()
})

test('a tile keeps its aspect within the width cap', () => {
  expect(tileBox({ width: 500, height: 500 }, 6)).toEqual({ columns: 13, rows: 6 })
  expect(tileBox({ width: 3000, height: 500 }, 6)).toEqual({ columns: 40, rows: 3 })
  expect(tileBox({ width: 100, height: 2000 }, 6)).toEqual({ columns: 1, rows: 6 })
  expect(tileBox(null, 6)).toEqual({ columns: 21, rows: 6 })
})

test('a row of tiles is always six rows tall, and is cut with a count of the rest when too wide', () => {
  const squares = [{ width: 500, height: 500 }, { width: 500, height: 500 }, { width: 500, height: 500 }]
  expect(tileRow(squares, 100)).toEqual({ boxes: squares.map(() => ({ columns: 13, rows: 6 })), hidden: 0 })
  expect(tileRow(squares, 20)).toEqual({ boxes: [{ columns: 13, rows: 6 }], hidden: 2 })
  expect(tileRow(squares, 10)).toEqual({ boxes: [], hidden: 3 })
})

test('a label is centred across its tile', () => {
  expect(centred('#1', 6)).toBe('  #1  ')
  expect(centred('#12', 2)).toBe('#12')
})
