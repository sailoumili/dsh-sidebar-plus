# dsh-sidebar-plus

English | [中文](README.md)

Five additions to the DSH sidebar file preview:

1. A "Source" view for `.md` / `.markdown`, with Markdown source tinting and line numbers.
2. Edit and save: for Markdown files, "Edit" switches to the "Source" view; for all other text formats, editing takes place directly in the current view.
3. Search and font-size controls in every view.
4. A line-number toggle in the official "plain text" view, which can be switched on or off at any time.
5. A toolbar on the official comparison view (the side-by-side page for a turn's changes): search either or both sides, scale both sides together, edit the right side only.

**Binary formats are not handled**: Office files (doc / docx / ppt / pptx), spreadsheets (xls / xlsx), PDFs and images (png / jpg, …) are displayed by the official viewers; the plugin injects no toolbar, offers no editing and does not intercept Ctrl+F. Their content is not text, and opening then saving them as text would corrupt the original file. The scope follows the `binaryExtensions` declared in the official registry, so audio/video, archives, executables and fonts are covered the same way. Text formats such as `.md` / `.markdown`, json / yaml / txt / log / csv / svg are unaffected.

**Supported DSH versions: `0.1.7-rc.2` and later (tested on `0.1.7-rc.2`, `0.2.0-rc.1`, `0.2.0-rc.2`). The plugin declares no version constraint, so neither DSH nor the plugin market will block installation on version grounds.**

## Features

**① Source view** (`.md` / `.markdown` only)
Select "Source" from the "open with" menu at the top right. The view shows line numbers on the left and tints Markdown syntax in source style. The official Markdown preview is untouched and can be switched back to at any time.

**② Edit and save** (all text formats)
- `.md` / `.markdown`: click "Edit" to switch to the "Source" view.
- other text formats (json / yaml / txt / log, etc.): click "Edit" to edit directly in the current view.
- binary formats (Office / spreadsheets / PDF / images): no editing is offered.
- Save: press **Ctrl+S** or click "Save". Exit: press **Esc** or click "Exit".
- If the file has been modified elsewhere, you are asked to choose "Save anyway" or "Reload latest".
- The previous version is backed up automatically before overwriting, so accidental changes can be reverted.
- A single file can be up to 32 MB to save; larger files are refused with a clear message, nothing is written and the original is untouched.

**③ Line-number toggle** (official "plain text" view)
Click "行号" in the toolbar to show or hide line numbers; off by default.

**④ Search and font size** (all views)
- Search: press **Ctrl+F**; **↓** or Enter for the next match, **↑** for the previous one, **Aa** to match case, **Esc** to close.
- Font size: click **A−** / **A+**, or hold **Ctrl** and scroll; click the number in the middle to reset.

**⑤ Comparison view** (the official "changes in this turn" side-by-side page)
The toolbar sits below the official header:

- **Search**: **Ctrl+F**. Both sides by default; the **`两侧` / `左` / `右`** buttons scope it to one side, and **↓ / ↑** move only within that scope. **Aa** matches case, **Esc** closes.
- **Font size**: **A−** / **A+**, or **Ctrl**+wheel; both sides scale together, and the middle number restores the official size.
- **Edit right side** (right side only):
  - The left side is the turn-start snapshot and stays read-only; the right side is the current file on disk.
  - Position: click a comparison row (the left column also works — it maps to the same row on the right), then click "编辑右侧". Inside the editor, type a line number into `行 [ ] 跳` and press Enter.
  - In unified or wrapped mode, the view first switches to side-by-side, unwrapped.
  - **Ctrl+S** saves, **Esc** exits; if the file changed elsewhere, choose "Save anyway" or "Reload latest", and the previous version is backed up automatically.
  - The comparison is the turn's snapshot and does not update when the file is saved.
- One-sided comparisons (additions or deletions only) have no columns; the editor then fills the whole comparison area.

## Known issues

- **PDF / Office previews fail (official side)**: the pdf.js 6.3.289 bundled with DSH `0.1.7-rc.2` calls the relatively new browser function `Map.prototype.getOrInsertComputed`; on engines that do not provide it, PDF and Office previews (documents are converted to PDF first) fail with `this[#methodPromises].getOrInsertComputed is not a function`. Checked against `0.2.0-rc.1`: unchanged. This is unrelated to the plugin and **does not affect the plugin's own features**: the `.md` source view and search / font size / edit-and-save for json / yaml / txt / csv etc. keep working.
- **Is this the cause?** Open the DSH page, press **F12**, and run `typeof Map.prototype.getOrInsertComputed` in the console. `undefined` means the engine lacks the function, i.e. the official-side issue above — please include your browser name and version when reporting. `function` means something else is going on; report it with the diagnostic output below.
- Toolbar labels are Chinese-only; official views follow the DSH language.

## Changelog

- **0.4.2**: Pane ownership now comes from the official slot registry; position and appearance are unchanged. The plugin registers one hook that displays nothing — one in the document header slot, one in the review file-actions slot — and takes the pane and the absolute file path from official props instead of inferring them from the DOM. While a hook is live the observer watches the right-sidebar container rather than the whole document; without one it falls back to scanning the document. Binary detection now follows `binaryExtensions` declared in the official `documentPreviews` registry, with the plugin's built-in suffix list kept only as a fallback. **This release changes the browser loader, so restart DSH once after upgrading.**
- **0.4.1**: Office files, spreadsheets, PDFs and images are no longer handled. Since DSH 0.1.7 those viewers share the plain-text view's outer markers, and the previous version therefore classified them as text: clicking "Edit" in such a view either failed or overwrote the file as plain text. The decision is now made by file suffix, and matching files are left alone entirely. Also fixed: the toolbar attaches only to the currently visible pane (switching tabs no longer attaches it to a hidden one); the line-number toggle keys off the official `data-textpreview-plain` marker; the comparison view no longer offers "Edit right side" for binary files; and whole-file byte delivery no longer leaves the source view blank.
- **0.4.0**: support for the official comparison view (see ⑤); states the supported DSH version.
- **0.3.8**: fixed the read path behind "Edit / Save" (now `workspaceFiles.readBytes`); the toolbar now mounts immediately.

## Install

Published on npm as `dsh-sidebar-plus`. From the DSH terminal:

```
dsh plugin --profile web add dsh-sidebar-plus
```

Restart DSH once after install. Later day-to-day changes to the hot files (`hot-*.cjs`) apply live within ~2 seconds — no restart, no page refresh. Only changes to the loaders themselves need a restart.

## Uninstall and rollback

- Disable or remove the plugin, then restart DSH: the official previews come back untouched — the plugin modifies no official file and leaves no residue in the page.
- To recover content after a wrong save: every overwrite is preceded by a full copy of the previous file in `~/.dsh/sidebar-plus-backups/`, kept per file name (latest 20).

## Architecture (hot-pluggable)

```
lib/index.js     host loader: registers /dsh-sp routes + guards, hot-reloads hot-host.cjs
lib/client.js    browser loader: registers the renderer, the body shell and two invisible hooks (document header, review file actions) with the official preview, pulls hot-client.cjs source and hot-swaps it
hot-host.cjs     host business: stat / save / backup / conflict — edit this, live in ~2s, no restart
hot-client.cjs   browser business: components / copy / styles / extension list — edit this, live in ~2s, no refresh
scripts/test.mjs       offline self-test: loaders + host IO sandbox + business pure functions
scripts/test-dom.mjs   jsdom + React18 render test: lines/search/font-size/edit-save/conflict/hot-swap/instant-mount/comparison view/cleanup
```

`scripts/` lives in the source repository only and is **not part of the npm package** (it is absent from the `files` allowlist in `package.json`); run the self-tests from a source checkout.

A broken hot file cannot break the page: if it fails to compile or validate, the previous version keeps running and only a console warning appears.

### Custom endpoints

Add a same-named key to `handlers` in `hot-host.cjs`; routing is a forwarding prefix, so the loader never changes.

## Privacy & boundaries

- Reads and writes only files the user opens, inside the local DSH process. **No external network calls.**
- Endpoint access control: requests carrying Origin must be same-origin; the save endpoint accepts POST with `application/json` only (cross-origin blind requests die at the CORS preflight).
- Pre-save backups go to `$DSH_HOME/sidebar-plus-backups/` (default `~/.dsh/sidebar-plus-backups/`; local runtime data; latest 20 copies per file name, 500 in total). A backup is a **full copy of the file**; if that directory is covered by a sync tool of your own, those copies travel with it — the plugin never sends data anywhere itself.
- The `/dsh-sp/*` guard only blocks cross-origin web pages; a local process without an Origin header can also call `/dsh-sp/save` (absolute path + regular file only), i.e. a "back up, then overwrite any local file" primitive on par with other local CLI tools, granting no remote capability.
- Settings live in browser localStorage: source-view font size `dsh-sidebar-plus.fontPx`, official-view zoom `dsh-sidebar-plus.officialZoom`, plain-text line numbers `dsh-sidebar-plus.plainLineNo`, comparison-view zoom `dsh-sidebar-plus.reviewZoom`, comparison-view search scope `dsh-sidebar-plus.reviewFindSide`.
- The timing probe keeps timestamps in process memory only — nothing is written to disk or sent anywhere.

## Feedback

Please file issues at <https://github.com/sailoumili/dsh-sidebar-plus/issues>. For a bug report, include the output of these two read-only endpoints — they say directly which path is live:

```
http://127.0.0.1:<DSH port>/dsh-sp/health
http://127.0.0.1:<DSH port>/dsh-sp/marks
```

Open them in the same browser as the DSH page (adjust the port to your own). `health` reports the three versions; `marks` reports whether the hooks attached, the observer scope, and which source the binary decision came from. Both read process memory only — nothing is written to disk or sent anywhere.

## License

MIT
