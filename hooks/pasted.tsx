// The band above the prompt: a thumbnail for each [Image #n] the draft holds, with its
// number under it; a press on the number opens the paste full size.
//
// Claude Code raises no event for an image paste (the tag shows up on the next keystroke),
// so the draft is polled. It caches each paste as <tmp>/claude-<uid>/<project>/<session>/images/<n>.<ext>.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Paste } from '../types'
import { centred, tileRow } from './layout'
import { pngSize } from './png'
import type { Size } from './png'

const POLL_MS = 200
const TAG = /\[Image #(\d+)\]/g

const pastes = atom({ plugin: 'images', key: 'pasted' } as const, [] as Paste[])

// The cache folder, once found for this session: it only exists after the first paste.
let cache: { session: string; dir: string } | undefined
// Each PNG's size by path; null when the file is too big to read.
const sizes = new Map<string, Size | null>()
// Files that are not PNGs and could not be converted: never looked at again.
const rejected = new Set<string>()
// The tags last drawn, so an unchanged draft writes nothing; undefined while a tile still
// lacks its file (a paste being written), so the next poll looks again.
let drawn: string | undefined
let written = ''
let polling = false

/** The image numbers a draft names, each once, in the order they first appear. */
export const tagsOf = (draft: string): number[] => [...new Set([...draft.matchAll(TAG)].map(m => Number(m[1])))]

// Claude Code's paste cache for this session: <base>/claude-*/<project>/<session>/images.
async function cacheDir($: EngineInterface): Promise<string | null> {
  const session = await $.session.id()
  if (cache?.session === session) return cache.dir
  const base = ((await $.env.get('CLAUDE_CODE_TMPDIR')) ?? '/tmp').replace(/\/+$/, '')
  for (const root of await $.fs.list(base).catch(() => [])) {
    if (root.kind !== 'dir' || !root.name.startsWith('claude-')) continue
    for (const project of await $.fs.list(`${base}/${root.name}`).catch(() => [])) {
      const dir = `${base}/${root.name}/${project.name}/${session}/images`
      if (project.kind === 'dir' && (await $.fs.exists(dir))) {
        cache = { session, dir }
        return dir
      }
    }
  }
  return null
}

// The PNG for paste n: the cached file when it is one, else a PNG converted from it once
// (sips, so macOS only), kept beside the cache folder so it is never taken for a paste.
async function pngOf($: EngineInterface, dir: string, n: number): Promise<{ png: string; source: string } | null> {
  const files = await $.fs.list(dir).catch(() => [])
  const file = files.find(f => f.kind === 'file' && f.name.split('.')[0] === String(n))
  if (!file) return null
  const source = `${dir}/${file.name}`
  if (/\.png$/i.test(file.name)) return { png: source, source }
  if (rejected.has(source)) return null
  const png = `${dir.slice(0, -'/images'.length)}/pasted-${n}.png`
  if (!(await $.fs.exists(png))) {
    const { exitCode } = await $.process.run(['sips', '-s', 'format', 'png', '-Z', '800', source, '--out', png]).catch(() => ({ exitCode: 1 }))
    if (exitCode !== 0) {
      rejected.add(source)
      return null
    }
  }
  return { png, source }
}

async function pasteOf($: EngineInterface, dir: string | null, n: number): Promise<Paste> {
  const none: Paste = { n, png: null, source: null, size: null }
  const file = dir === null ? null : await pngOf($, dir, n)
  if (!file || rejected.has(file.png)) return none
  if (!sizes.has(file.png)) {
    // Over $.fs.read's 4 MiB: no size, but the terminal still draws it.
    const bytes = await $.fs.read(file.png, { as: 'bytes' }).catch(() => null)
    if (bytes) {
      const size = pngSize(bytes.base64)
      if (!size) {
        // Shorter than a PNG header, it may still be being written; longer, it is no PNG.
        if (bytes.base64.length > 32) rejected.add(file.png)
        return none
      }
      sizes.set(file.png, size)
    } else sizes.set(file.png, null)
  }
  return { n, png: file.png, source: file.source, size: sizes.get(file.png) ?? null }
}

async function poll($: EngineInterface) {
  if (polling) return
  polling = true
  try {
    const tags = tagsOf((await $.prompt.read()).text)
    const key = tags.join(',')
    if (key === drawn) return
    const dir = tags.length > 0 ? await cacheDir($) : null
    const list: Paste[] = []
    for (const n of tags) list.push(await pasteOf($, dir, n))
    drawn = list.every(p => p.png !== null) ? key : undefined
    const json = JSON.stringify(list)
    if (json === written) return
    await update($, pastes, () => list)
    written = json
  } finally {
    polling = false
  }
}

// At the session's start: watch the draft.
export function startPasted($: EngineInterface) {
  $.clock.every(POLL_MS, () => poll($))
}

export const registerPasted: Register = on => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.hasSurvey) return next(e)
    const list = await read($, pastes)
    if (list.length === 0) return next(e)
    const { boxes, hidden } = tileRow(list.map(p => p.size), e.props.maxRows, e.props.bodyColumns)
    if (boxes.length === 0) return next(e)
    const { Box, Button, Image, Text } = $.ui.resolve(e)
    const below = await next(e)

    const tile = (paste: Paste, box: { columns: number; rows: number }) => {
      const label = centred(`#${paste.n}`, box.columns)
      const source = paste.source
      return (
        <Box key={`paste-${paste.n}`} flexDirection="column" alignItems="center" borderStyle="round" borderDimColor>
          {paste.png === null ? (
            <Box width={box.columns} height={box.rows} alignItems="center" justifyContent="center">
              <Text dimColor wrap="truncate">no preview</Text>
            </Box>
          ) : (
            <Image key={`png-${paste.n}`} source={{ file: paste.png, format: 'png' }} columns={box.columns} rows={box.rows} alt={`[Image #${paste.n}]`} />
          )}
          {source === null ? (
            <Text dimColor>{label}</Text>
          ) : (
            <Button key={`open-${paste.n}`} plain dimColor label={label} onPress={() => void $.process.run(['open', source]).catch(() => undefined)} />
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" columnGap={1}>
          {boxes.map((box, i) => tile(list[i]!, box))}
          {hidden > 0 && <Text dimColor>+{hidden}</Text>}
        </Box>
        {below}
      </Box>
    )
  })
}
