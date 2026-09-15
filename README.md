# dsh-sidebar-plus

[English](README.en.md) | 中文

给 DSH 侧边栏的文件预览新增四项功能：

1. `.md` / `.markdown` 格式新增「源编辑」视图，支持 Markdown 源码着色与行号显示。
2. 新增编辑与保存功能：Markdown 格式文件可通过「编辑」跳转至「源编辑」视图进行编辑，其余格式在当前视图中直接编辑。
3. 所有视图新增「搜索」与「字号调节」功能。
4. 官方「纯文本」视图新增行号显示功能，可随时开启或关闭。

图片、PDF、HTML 格式不予接管。

## 功能

**① 源编辑视图**（仅适用于 `.md` / `.markdown`）
在右上角「打开方式」中选择「源编辑」。该视图左侧显示行号，Markdown 语法按源码着色。

**② 编辑保存**（适用于所有文字格式）
- `.md` / `.markdown` 格式：点击「编辑」，跳转至「源编辑」视图进行编辑。
- 其余格式（json / yaml / txt / log 等）：点击「编辑」，在当前视图中直接编辑。
- 保存：按 **Ctrl+S** 或点击「保存」；退出：按 **Esc** 或点击「退出编辑」。
- 若该文件已在别处被修改，将提示选择「强制保存」或「重载最新」。
- 覆盖前自动备份旧版本，误改后可恢复。

**③ 行号开关**（官方「纯文本」视图）
在工具栏中点击「行号」，可显示或隐藏行号，默认为关闭状态。

**④ 搜索与字号调节**（适用于所有视图）
- 搜索：按 **Ctrl+F**；**↓** 或 Enter 定位下一处，**↑** 定位上一处，**Aa** 区分大小写，**Esc** 关闭。
- 字号：点击 **A−** / **A+**，或按住 **Ctrl** 滚动滚轮调节字号；点击中间的数字可复位。

## 安装

```
dsh plugin --profile web add <包名或路径>
```

装完**重启 DSH 一次**加载。之后日常的功能改动（改 `hot-*.cjs`）自动热生效，无需再重启；只有改加载器本身才需要重启。

## 架构（热插拔）

```
lib/index.js     宿主加载器：注册 /dsh-sp 路由 + 守卫，监视 hot-host.cjs 热装载
lib/client.js    浏览器加载器：向官方预览注册渲染器与文档插槽空壳，拉 hot-client.cjs 源码热替换
hot-host.cjs     宿主业务：stat / save / 备份 / 冲突 —— 改这个，约 2 秒生效，不重启
hot-client.cjs   浏览器业务：组件 / 文案 / 样式 / 接管扩展名名单 —— 改这个，约 2 秒生效，不刷新页面
scripts/test.mjs       离线自测：加载器 + 宿主读写 + 业务纯函数
scripts/test-dom.mjs   jsdom + React18 真渲染：行号/搜索/字号/编辑保存/冲突/热装载/回收
```

坏代码自动兜底：热件编译或校验失败时保留现版、只 warn，页面不崩。诊断口 `GET /dsh-sp/health` 返回加载器与两端业务当前版本。

业务加自定义端点：往 `hot-host.cjs` 的 `handlers` 里加同名 key 即可，路由是转发式的，加载器不用动。

## 隐私与边界

- 只在本地 DSH 进程内读写你主动打开的文件；无任何外部网络。
- 端点访问控制：带 Origin 的请求必须同源，POST 必须 `application/json`（跨源网页盲发被 CORS 预检挡死）。
- 保存前备份目录为 `$DSH_HOME/sidebar-plus-backups/`（默认即 `~/.dsh/sidebar-plus-backups/`，本机运行数据；每个文件名留最近 20 份，总量上限 500 份）。
- 三项设置存浏览器 localStorage：源编辑字号 `dsh-sidebar-plus.fontPx`、官方视图缩放 `dsh-sidebar-plus.officialZoom`、纯文本行号开关 `dsh-sidebar-plus.plainLineNo`。

## License

MIT
