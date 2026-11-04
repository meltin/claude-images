// The size of a PNG, read from its IHDR chunk: the first 24 bytes of the file.
export type Size = { width: number; height: number }

const SIGNATURE = 0x89504e47
const IHDR = 0x49484452

/** Width and height from the first bytes of a PNG, given as base64; null unless they open as one. */
export function pngSize(base64: string): Size | null {
  // 32 base64 characters decode to the 24 bytes that hold the signature and the IHDR size.
  const head = Uint8Array.from(atob(base64.slice(0, 32)), c => c.charCodeAt(0))
  if (head.length < 24) return null
  const v = new DataView(head.buffer)
  if (v.getUint32(0) !== SIGNATURE || v.getUint32(12) !== IHDR) return null
  const size = { width: v.getUint32(16), height: v.getUint32(20) }
  return size.width > 0 && size.height > 0 ? size : null
}
