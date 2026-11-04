/** One [Image #n] of the draft, as the band draws it. */
export type Paste = {
  n: number
  /** The PNG to draw: the cached paste, or a PNG converted from it; null while there is none. */
  png: string | null
  /** The paste as Claude Code cached it, opened full size on a press; null when not found. */
  source: string | null
  /** Pixels; null when unknown (the file is too big to read), and the tile is drawn landscape. */
  size: { width: number; height: number } | null
}

declare module 'claude-code' {
  interface PluginState {
    images: { pasted: Paste[] }
  }
}
