// Cell boxes for pictures. The Image keeps a picture's aspect inside its box, so a box
// too tall leaves a blank strip under the picture and a box too wide leaves one at the
// sides; the sides are the better place for it, so every box is sized for the tallest
// common cell and rounded down. Terminal fonts run from 2.0 to about 2.2 tall per wide
// (Orca: 2.14).
// ponytail: a guess, not a measurement; read the cell's pixel size (TIOCGWINSZ) if a
// picture ever needs its exact size, which would also stop small pictures being upscaled.
import type { Size } from './png'

export type Cells = { columns: number; rows: number }

const CELL_ASPECT = 2.2

// A shown picture: as wide as the chat allows, and never taller than this.
const CHAT_MAX_COLUMNS = 120
const CHAT_MAX_ROWS = 40

/** The cell box a shown picture fills: as wide as the room allows, kept to its aspect ratio. */
export function fitChat(size: Size, columns: number): Cells {
  const cols = Math.max(1, Math.min(CHAT_MAX_COLUMNS, columns))
  const rows = Math.floor((cols * size.height) / size.width / CELL_ASPECT)
  if (rows <= CHAT_MAX_ROWS) return { columns: cols, rows: Math.max(1, rows) }
  return { columns: Math.max(1, Math.floor((CHAT_MAX_ROWS * CELL_ASPECT * size.width) / size.height)), rows: CHAT_MAX_ROWS }
}

// A pasted picture's tile above the prompt: a bordered box with a label row under the picture.
const TILE_ROWS = 6
const TILE_MIN_ROWS = 2
const TILE_MAX_COLUMNS = 40
const TILE_CHROME = { rows: 3, columns: 2 }
const TILE_GAP = 1
// A paste whose size is unknown (too big to read) is drawn landscape.
const UNKNOWN: Size = { width: 16, height: 10 }

/** One tile's picture box `rows` tall, kept to its aspect, never wider than TILE_MAX_COLUMNS. */
export function tileBox(size: Size | null, rows: number): Cells {
  const { width, height } = size ?? UNKNOWN
  const columns = Math.floor((rows * CELL_ASPECT * width) / height)
  if (columns <= TILE_MAX_COLUMNS) return { columns: Math.max(1, columns), rows }
  return { columns: TILE_MAX_COLUMNS, rows: Math.max(1, Math.floor((TILE_MAX_COLUMNS * height) / (CELL_ASPECT * width))) }
}

/**
 * One row of tiles that fits `columns` across and `maxRows` down: the tallest tiles that
 * fit, shrunk down to TILE_MIN_ROWS; past that the row is cut and the rest counted in `hidden`.
 */
export function tileRow(sizes: readonly (Size | null)[], maxRows: number, columns: number): { boxes: Cells[]; hidden: number } {
  const tallest = Math.min(TILE_ROWS, maxRows - TILE_CHROME.rows)
  if (tallest < 1) return { boxes: [], hidden: sizes.length }
  const widthOf = (boxes: readonly Cells[], hidden: number) =>
    boxes.reduce((w, b) => w + b.columns + TILE_CHROME.columns, 0) + TILE_GAP * Math.max(0, boxes.length - 1) + (hidden > 0 ? TILE_GAP + `+${hidden}`.length : 0)
  let boxes: Cells[] = []
  for (let rows = tallest; rows >= Math.min(TILE_MIN_ROWS, tallest); rows--) {
    boxes = sizes.map(size => tileBox(size, rows))
    if (widthOf(boxes, 0) <= columns) return { boxes, hidden: 0 }
  }
  let kept = boxes.length
  while (kept > 0 && widthOf(boxes.slice(0, kept), boxes.length - kept) > columns) kept--
  return { boxes: boxes.slice(0, kept), hidden: boxes.length - kept }
}

/** `text` centred in `columns` cells, so a label spans its tile and a press anywhere under the picture lands on it. */
export function centred(text: string, columns: number): string {
  const pad = Math.max(0, columns - text.length)
  return ' '.repeat(Math.floor(pad / 2)) + text + ' '.repeat(pad - Math.floor(pad / 2))
}
