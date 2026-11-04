# Claude Images

A Claude Code mod for images in the chat, both ways:

- **Pasted images**: paste an image into the prompt and a thumbnail appears above the input, instead of a bare `[Image #1]` tag. Press the number under a tile to open the paste full size.
- **Shown images**: Claude gets one tool, `show_image`, that draws a PNG inline in place of the tool's result row, with a button that opens it in Preview. Claude uses it on its own after visual work: it screenshots a page with headless Playwright, or renders a chart or a design, and shows the result instead of asking you to open a file.

## Install

Inside Claude Code, run:

```
/plugin install images --marketplace ixxq/claude-images
```

Answer `y` to add the marketplace, pick a scope, then run `/reload-plugins` or start a new session.

## What you get

- A row of thumbnails above the prompt, one per `[Image #n]` tag in the draft, each six rows tall; tiles that do not fit across are counted as `+N`. A terminal too short for the band scrolls it, so give the band room: a two-line status line leaves more than a four-line one.
- `show_image(path, title?)`: a PNG at an absolute path, at most 2 MiB, drawn at the width of the chat and kept to its aspect ratio, with **Open in Preview** under it (macOS `open -a Preview`).
- Nothing else: no video, no history, no telemetry, no updater. About 300 lines.

## Terminals

Pictures draw where Claude Code's own `Image` element draws: Ghostty, kitty and terminals that speak the kitty graphics protocol, Orca included. Elsewhere each picture's alt text is drawn in its place (`[Image #1]`, `[image: title]`).

A paste that is not a PNG (a JPEG from a browser, say) is converted once with `sips`, so the thumbnail needs macOS; on Linux such a tile says `no preview`.

## Developing

```
claude plugin validate .
claude plugin test .
```

Or install from the folder, so edits are picked up with `/reload-plugins`:

```
claude plugin marketplace add ~/dev/oss/claude-images
claude plugin install images@claude-images
```

## License

MIT
