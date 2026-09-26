# dsh-sidebar-plus

English | [中文](README.md)

Five additions to the DSH sidebar file preview:

1. A "Source" view for `.md` / `.markdown`, with Markdown source tinting and line numbers.
2. Edit and save: for Markdown files, "Edit" switches to the "Source" view; for all other formats, editing takes place directly in the current view.
3. Search and font-size controls in every view.
4. A line-number toggle in the official "plain text" view, which can be switched on or off at any time.
5. The same toolbar on the official comparison view (the side-by-side page showing what a turn changed): search one side or both, font size for both sides at once, and editing the right side only.

Images, PDFs and HTML are not handled.

Note: the plugin's own toolbar labels are Chinese-only for now (`编辑` / `搜索` / `行号`, …); the official views themselves follow your DSH language.

**Supported DSH version: `0.1.7-rc.2`.** The plugin is built and verified against that version's plugin interfaces; the comparison view is a `ui-deliverables` surface that DSH 0.1.7 introduced.

## Features

**① Source view** (`.md` / `.markdown` only)
Select "Source" from the "open with" menu at the top right. The view shows line numbers on the left and tints Markdown syntax in source style. The official Markdown preview is untouched and can be switched back to at any time.

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

**⑤ Comparison view** (the official "changes in this turn" side-by-side page)
On the right sidebar's comparison page the plugin adds a toolbar row under the official header:

- **Search**: press **Ctrl+F**. Both sides are searched by default; the **`两侧` / `左` / `右`** buttons in the search row narrow it to one side, and then **↓ / ↑** walk only that side's matches instead of dragging you through the other side's. **Aa** matches case, **Esc** closes.
- **Font size**: **A−** / **A+**, or hold **Ctrl** and scroll — **both sides scale together**; click the number in the middle to return to the official size.
- **Edit right side** (right side only):
  - The left side is the turn-start snapshot and stays **read-only**; the right side is the current file on disk.
  - To edit a particular line, first **click that line** in the comparison (clicking the left column works too — it is mapped to the same row on the right), then click "编辑右侧": the caret lands on that line. Inside the editor you can also type a line number into `行 [ ] 跳` and press Enter.
  - If the official view is currently unified or wrapped, the plugin first switches it to side-by-side, unwrapped, then opens the editor.
  - Save: **Ctrl+S** or "Save". Exit: **Esc** or "Exit". If the file changed elsewhere you are asked to choose "Save anyway" or "Reload latest"; the previous version is backed up automatically.
  - The comparison is the **turn's historical snapshot**; saving the file does not update it (the status line says so after saving).
- Comparison pages that only add or only delete lines have no columns at all in the official view; the editor then fills the whole comparison area and everything still works.

## Changelog

- **0.4.0**: support for the official comparison view (item ⑤ above: one-side/both-side search, both sides scaling together, right-side-only editing, click-a-line positioning and line jump); README now states the supported DSH version.
- **0.3.8**: fixed the read path behind "Edit / Save" (now uses `workspaceFiles.readBytes`) and made the toolbar appear without the old ~2 s wait.

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
scripts/test-dom.mjs   jsdom + React18 render test: lines/search/font-size/edit-save/conflict/hot-swap/instant-mount/comparison view/cleanup
```

### Startup speed

The toolbar appears on the same frame as the official preview, thanks to three things:

1. While the business code has not arrived, the loader retries every **120 ms** instead of waiting out the 2 s steady poll, pulls once more the moment services become ready, and does a direct pull on the first round to skip one extra `/rev` round-trip;
2. The toolbar no longer polls the DOM every 0.4 s; a MutationObserver drives it with a **16 ms (one frame)** throttle;
3. A 1.2 s fallback poll remains in case the observer is unavailable, so the feature never silently disappears.

Diagnostics: `GET /dsh-sp/marks` returns page-side timestamps (`loader-applied` / `services-registered` / `business-ready` / `official-pane-seen` / `toolbar-inserted`) used to measure each stage; the data stays in process memory only — never written to disk, never sent anywhere.

Bad code can't break the page: if a hot file fails to compile or validate, the previous version keeps running and only a console warning appears. Diagnostic endpoint: `GET /dsh-sp/health` reports loader and both business versions.

To add custom endpoints: just add a same-named key to `handlers` in `hot-host.cjs` — routing is a forwarding prefix, the loader never changes.

## Privacy & boundaries

- Reads/writes only files you open, inside your local DSH process. **No external network calls.**
- Endpoint access control: requests carrying Origin must be same-origin; POST must be `application/json` (cross-origin blind requests die at the CORS preflight).
- Pre-save backups go to `$DSH_HOME/sidebar-plus-backups/` (which defaults to `~/.dsh/sidebar-plus-backups/`; local runtime data; the latest 20 copies per file name, 500 files in total). A backup is a **full copy of the file** and stays in that directory: if that directory happens to be inside a sync/backup tool of your own, those copies travel with it — the plugin itself never syncs anything out.
- The `/dsh-sp/*` guard only stops cross-origin web pages: a local process without an Origin header can also call `/dsh-sp/save` (it validates only "absolute path + regular file"), so it amounts to a "back up, then overwrite any local file" write primitive — the same capability other local CLI tools already have; no remote capability is granted.
- Settings live in browser localStorage: source-view font size `dsh-sidebar-plus.fontPx`, official-view zoom `dsh-sidebar-plus.officialZoom`, plain-text line numbers `dsh-sidebar-plus.plainLineNo`, comparison-view zoom `dsh-sidebar-plus.reviewZoom`, comparison-view search scope `dsh-sidebar-plus.reviewFindSide`.
- The timing probe keeps timestamps in process memory only — nothing is written to disk or sent anywhere.

## License

MIT
