// Images in the chat, both ways: the pictures you paste, above the prompt, and
// the pictures Claude shows, in the transcript.
import type { Register } from 'claude-code'

import { registerPasted, startPasted } from './pasted'
import { registerShown, startShown } from './shown'

export const register: Register = (on, options) => {
  // One session.start for both halves: the engine refuses the same event hooked twice without a matcher.
  on('session.start', async ($, e, next) => {
    startPasted($)
    await startShown($)
    return next(e)
  })
  registerPasted(on, options)
  registerShown(on, options)
}
