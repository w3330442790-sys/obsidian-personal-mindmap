# 融合 Mindmap

面向个人使用的 Obsidian 思维导图插件，基于 Weilanx Mind Map 0.2.0 与 gogoga Mind Map 0.34.0 的 MIT 源码。`.wmind` 完整格式和整篇 Markdown 脑图使用同一个主画布。版本和原作者声明见 [UPSTREAM.md](UPSTREAM.md)。

## 安装

需要 Obsidian 1.8.7 或更新版本。

1. 解压 `personal-mindmap-0.1.0.zip`，得到 `personal-mindmap` 文件夹。
2. 将文件夹放入你的笔记库 `.obsidian/plugins/` 中，最终应有 `.obsidian/plugins/personal-mindmap/main.js`、`manifest.json`、`styles.css`。
3. 重启 Obsidian，或重新加载第三方插件列表，在「设置 → 第三方插件」启用 **融合 Mindmap**。
4. 若已安装两个原版插件，先停用它们，避免争抢 `.wmind`、`.xmind` 文件和 `mindmap` 代码块的处理器。原插件目录和数据无需删除。

本次交付只生成安装包，没有修改或启用任何真实笔记库中的插件。源码开发依赖不需要复制进笔记库。

## 两种文件怎么选

| 文件 | 适合用途 |
| --- | --- |
| `.wmind` | 完整图形排版、手绘、复杂样式、多外框/概括、关系控制点，以及 AI 直接编辑 JSON |
| `.md` | 笔记与导图双向编辑、双链、标题与列表、分屏写作，以及常规同步与检索 |
| `.xmind` | 只读查看并切换工作表；可将当前工作表转换为 Markdown 或 `.wmind` |

命令面板搜索「融合 Mindmap」可新建 Markdown 脑图，或选择「新建完整格式脑图 (.wmind)」。给 Markdown 笔记的 YAML 加 `mindmap: true`，以后默认以脑图打开。视图右上角可切回 Markdown 或分屏对照。

```markdown
---
mindmap: true
mindmap-theme: snow
mindmap-structure: mindmap
---
# 学习计划

## 本周目标
- 阅读
- 练习

## 复习
- 重点 ==需要记住的内容==
- 🙈 答案
```

Markdown 主画布编辑时会保留未改动的原文格式，并添加 `wmind-fusion:v1` HTML 注释，用于保留 Markdown 本身不能表达的高级图形信息。请保留这条注释。遇到外部编辑无法安全匹配的元数据会提示，并保留恢复信息。

## 主要功能

- 保留 Weilanx 的六套主题、四种结构、分支独立结构、标准/手绘画法、格式面板、对齐、填充、标记、标签、备注、链接、关联线、概括、外框、自由主题、查找替换和图形导出。
- 增加七套主题、自定义主题编辑器、自定义表情标记、间距字号、工具栏位置、鼠标行为、触屏手势、大纲侧栏、聚焦、隐藏节点、保留子节点删除、按标点拆分、节点/图片/概括宽度和范围调整。
- 支持行内 Markdown、公式、图片、备注预览与展开卡片、附件粘贴、双链补全、笔记选择与新建、悬停预览、标签搜索，以及 PDF++ 选区和区域图片。
- 背诵模式遮挡 `==高亮==` 与 🙈 答案分支；选择题在揭晓前隐藏正确勾选和解析，揭晓后显示正确选项。该模式不改写答案内容。
- 支持 Markdown 分屏联动、跟随活动笔记、模板、原位可编辑代码块、笔记/分支/块嵌入与 Canvas 卡片。
- 保留原 CLI 与 `.wmind` JSON 格式；保存时检查磁盘快照，冲突不会覆盖外部内容，并自动保存本地恢复副本。

## 笔记里嵌入脑图

使用 `mindmap` 或 `gogoga-mindmap` 围栏。块内写标题/列表即可，阅读模式和实时预览都可渲染，点铅笔进入编辑。若其他插件也处理 `mindmap`，可在设置中关闭通用围栏处理，使用专属的 `gogoga-mindmap`。

````markdown
```mindmap
# 项目
## 计划
- 需求
- 实现
## 验证
- 自动测试
- 实际使用
```
````

已有文件可用 `![[脑图笔记]]`、`![[脑图笔记#章节]]`、`![[脑图笔记#^块ID]]`、`![[图.wmind]]`、`![[图.xmind]]` 嵌入。嵌入预览与完整文件编辑的工具栏有区别。

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 子节点 / 同级 / 父节点 | Tab / Enter / Shift+Tab |
| 编辑 | F2、空格、双击或直接输入 |
| 节点内换行 | Shift+Enter |
| 删除 / 撤销 / 重做 | Delete / Ctrl+Z / Ctrl+Shift+Z |
| 查找 / 替换 | Ctrl+F / Ctrl+H |
| 适应画布 | Ctrl+0 |
| 链接笔记 | Ctrl+K |

macOS 将 Ctrl 换成 Cmd（替换也可使用 Cmd+Option+F）。命令面板提供更多可绑定操作；「完整格式 · …」命令支持 `.wmind` 和 Markdown 主画布。

## 导出和兼容边界

PNG 为 2 倍分辨率，SVG 会内嵌可读取的图片和 MathJax 字体。资源不可读取时会明确提示，不会静默给出缺图文件。播放中的视频、音频、网页 iframe 不作为静态图像导出；请将其换为截图或链接后再导出。

XMind 8 XML 和新格式 JSON 均可读取；上游不支持的评论、部分概要附属主题等会按实际导入结果提示。PDF 区域裁图需要 PDF++；未安装时保留跳回 PDF 的链接。

桌面与移动端构建使用相同的浏览器代码，不依赖运行时 Node。已进行的验证见 [ACCEPTANCE.md](ACCEPTANCE.md)；安卓实机和真实笔记库尚未验证。

## 开发

```powershell
npm ci
npm test
npm run test:upstream
npm run typecheck
npm run test:ui
npm run package:local
```

`test:ui` 使用隔离浏览器和内存样例，不读取真实库。默认使用 Windows Chrome，可通过 `BROWSER_PATH` 指定其他 Chromium。产物目录为 `dist/personal-mindmap/`，ZIP 在 `artifacts/`。
