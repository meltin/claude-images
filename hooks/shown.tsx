// One tool, show_image(path, title?): the PNG is drawn in place of the tool's
// result row by Claude Code's own Image element (kitty graphics, Ghostty/kitty/Orca).
import type { EngineInterface, Register } from 'claude-code'

import { fitChat } from './layout'
import { pngSize } from './png'
import type { Size } from './png'

const NAME = 'show_image'
const TOOL = 'mcp__images__show_image'
// Image's `png` source takes at most 2 MiB decoded; Orca also refuses larger files.
const MAX_BYTES = 2 * 1024 * 1024

type Pic = Size & { png: string; title: string; path: string }

// Shown pictures, by tool call, so a redraw sends nothing new; refilled from
// the file after a reload.
const pics = new Map<string, Pic>()

const load = async ($: EngineInterface, path: string, title: string): Promise<Pic> => {
  if (!path.startsWith('/')) throw new Error('the path must be absolute')
  if (!/\.png$/i.test(path)) throw new Error('only PNG is shown; convert first (sips -s format png in.jpg --out out.png)')
  const { size } = await $.fs.stat(path)
  if (size > MAX_BYTES) throw new Error(`${size} bytes is over 2 MiB; shrink it first`)
  const { base64 } = await $.fs.read(path, { as: 'bytes' })
  const dims = pngSize(base64)
  if (!dims) throw new Error('not a PNG')
  return { png: base64, title, path, ...dims }
}

// At the session's start: the tool the model calls.
export async function startShown($: EngineInterface) {
  await $.tool.register({
    name: NAME,
    description: 'Shows a PNG inline in the chat, in place of this call\'s result row. Use it, unasked, whenever you made or changed something visual: screenshot a page with headless Playwright, or show a chart or design, instead of asking the user to open a file. PNG only, at most 2 MiB, absolute path. Save screenshots made only to be shown in a temp folder, not in the project.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path of a PNG file' },
        title: { type: 'string', description: 'Short caption' },
      },
      required: ['path'],
    },
    isDeferred: false,
  })
}

// The picture in place of the tool's result row.
export const registerShown: Register = on => {
  on('tool.call', { tool: TOOL }, async ($, e) => {
    const { path, title } = e as unknown as { path?: string; title?: string }
    if (!path) return { deny: 'path is needed' }
    try {
      const pic = await load($, path, title ?? path)
      pics.set(e.tool_use_id, pic)
      // A tool's own result is text; the path rides on its last line for a redraw after a reload.
      return { result: `Shown: ${pic.title} (${pic.width}×${pic.height})\n${path}` }
    } catch (err) {
      return { deny: `${path}: ${err instanceof Error ? err.message : String(err)}` }
    }
  }).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: show_image failed.` }))

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const props = e.props as { tool: string; tool_use_id: string; output: unknown; isErrored: boolean }
    if (props.tool !== TOOL || props.isErrored) return next(e)
    const ui = $.ui.resolve(e)
    if (!('Image' in ui)) return next(e)
    const { Box, Button, Image } = ui
    const lines = String(props.output).split('\n')
    const pic = pics.get(props.tool_use_id) ?? (await load($, lines[lines.length - 1] ?? '', lines[0] ?? '').catch(() => null))
    if (!pic) return next(e)
    pics.set(props.tool_use_id, pic)
    const box = fitChat(pic, (e.viewport?.columns ?? 80) - 4)
    // The Image is a leaf with no press of its own, so the opener sits under it.
    return (
      <Box flexDirection="column">
        <Image key="pic" source={{ png: pic.png }} columns={box.columns} rows={box.rows} alt={`[image: ${pic.title}]`} />
        <Button key="open" plain dimColor label="Open in Preview" onPress={() => void $.process.run(['open', '-a', 'Preview', pic.path]).catch(() => undefined)} />
      </Box>
    )
  })
}
