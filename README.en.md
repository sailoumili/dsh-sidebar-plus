# dsh-sidebar-plus

English | [中文](README.md)

Four additions to the DSH sidebar file preview:

1. A "Source" view for `.md` / `.markdown`, with Markdown source tinting and line numbers.
2. Edit and save: for Markdown files, "Edit" switches to the "Source" view; for all other formats, editing takes place directly in the current view.
3. Search and font-size controls in every view.
4. A line-number toggle in the official "plain text" view, which can be switched on or off at any time.

Images, PDFs and HTML are not handled.

## Features

**① Source view** (`.md` / `.markdown` only)
Select "Source" from the "open with" menu at the top right. The view shows line numbers on the left and tints Markdown syntax in source style.

**② Edit and save** (all text formats)
- `.md` / `.markdown`: click "Edit" to switch to the "Source" view.
- other formats (json / yaml / txt / log, etc.): click "Edit" to edit directly in the current view.
- Save: press **Ctrl+S** or click "Save". Exit: press **Esc** or click "Exit".
- If the file has been modified elsewhere, you are asked to choose "Save anyway" or "Reload latest".
- The previous version is backed up automatically before overwriting, so accidental changes can be reverted.

**③ Line-number toggle** (official "plain text" view)
Click "行号" in the toolbar to show or hide line numbers; off by default.

**④ Search and font size** (all views)
- Search: press **Ctrl+F**; **↓** or Enter for the next match, **↑** for the previous one, **Aa** to match case, **Esc** to close.
- Font size: click **A−** / **A+**, or hold **Ctrl** and scroll; click the number in the middle to reset.

## Install

Published on npm as `dsh-sidebar-plus`. From the DSH terminal:

```
dsh plugin --profile web add dsh-sidebar-plus
```

Restart DSH once after install. Later day-to-day changes to the hot files (`hot-*.cjs`) apply live within ~2 seconds — no restart, no page refresh. Only changes to the loaders themselves need a restart.

## Architecture (hot-pluggable)

```
lib/index.js     host loader: registers /dsh-sp routes + guards, hot-reloads hot-host.cjs
lib/client.js    browser loader: registers the renderer & a shell component with the official preview, pulls hot-client.cjs source and hot-swaps it
hot-host.cjs     host business: stat / save / backup / conflict — edit this, live in ~2s, no restart
hot-client.cjs   browser business: components / copy / styles / extension list — edit this, live in ~2s, no refresh
scripts/test.mjs       offline self-test: loaders + host IO sandbox + business pure functions
scripts/test-dom.mjs   jsdom + React18 render test: lines/search/font-size/edit-save/conflict/hot-swap/cleanup
```

Bad code can't break the page: if a hot file fails to compile or validate, the previous version keeps running and only a console warning appears. Diagnostic endpoint: `GET /dsh-sp/health` reports loader and both business versions.

To add custom endpoints: just add a same-named key to `handlers` in `hot-host.cjs` — routing is a forwarding prefix, the loader never changes.

## Privacy & boundaries

- Reads/writes only files you open, inside your local DSH process. No external network calls.
- Endpoint access control: requests carrying Origin must be same-origin; POST must be `application/json` (cross-origin blind requests die at the CORS preflight).
- Pre-save backups go to `$DSH_HOME/sidebar-plus-backups/` (which defaults to `~/.dsh/sidebar-plus-backups/`; local runtime data; the latest 20 copies per file name, 500 files in total).
- Three settings live in browser localStorage: source-view font size `dsh-sidebar-plus.fontPx`, official-view zoom `dsh-sidebar-plus.officialZoom`, plain-text line numbers `dsh-sidebar-plus.plainLineNo`.

## License

MIT
