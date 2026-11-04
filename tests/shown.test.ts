import { expect, test } from 'claude-code/testing'

import { fitChat } from '../hooks/layout'

test('a shown picture fills the chat width, keeps its aspect and the caps', () => {
  // 80 columns of a 2.67:1 picture need 13.6 rows at 2.2 tall per wide: rounded down, never up.
  expect(fitChat({ width: 320, height: 120 }, 80)).toEqual({ columns: 80, rows: 13 })
  expect(fitChat({ width: 100, height: 1000 }, 80)).toEqual({ columns: 8, rows: 40 })
  expect(fitChat({ width: 4000, height: 100 }, 300)).toEqual({ columns: 120, rows: 1 })
})
