# 融合功能验收映射

范围固定为 UPSTREAM.md 中的两个源码提交。下表描述源码实现与隔离验证，不把尚未进行的真机验证计为通过。

| 功能组 | 实现位置 | 验证依据 |
| --- | --- | --- |
| Weilanx JSON、未知字段、操作、结构、范围、手绘、对齐 | src/core、webview/src | 原 core/cli 测试完整保留 |
| Markdown 双向编辑、保留格式、高级格式扩展 | src/fusion/markdown.ts、src/obsidian/view.ts | fusion-format、obsidian-host；包括外部重排、重叠外框、多条平行关联线 |
| Markdown 标题/列表层级与顺序 | src/fusion/markdown.ts | 原生 Markdown 去掉扩展注释后仍保留拖拽后的顺序；同级类型转换回归 |
| XMind XML/JSON、多工作表、转换 | vendor/gogoga/src/xmind.ts、xmind-view.ts | 上游 xmind、fusion-format、obsidian-xmind 竞态测试 |
| 代码块、笔记嵌入、分支/块嵌入、Canvas | vendor/gogoga/src/main.ts、embed.ts；wmind-embed.ts | 上游 codeblock；插件注册/清理与陈旧块拒绝写入测试 |
| 分屏联动、跟随活动笔记、模板、双链、图标、文件菜单 | vendor/gogoga/src/main.ts、融合 view 门面 | 上游解析/模板；主插件生命周期；主画布双链补全与笔记选择浏览器测试 |
| 七套增量主题与四档自定义主题 | src/core/theme.ts、原生主题编辑器 | fusion-theme；自定义样式优先级、深色推算、同层宽度、间距与折线 |
| 富文本、公式、图片、音视频、iframe | rich.ts、RichTopic.tsx | rich；安全 token、媒体参数；浏览器图片预览 |
| PDF++ 原文选区与区域裁图 | clipboard.ts、宿主 renderPdfCrop | clipboard、上游 pdf；实际 PDF++ 裁图仍需用户环境验收 |
| 备注弹窗、附件、卡片、折叠与尺寸 | note-modal.ts、主画布、文件 state.json | note-modal、lifetime；浏览器图片粘贴与卡片调整 |
| 聚焦、隐藏、仅删除节点、按标点拆分、范围手柄、宽度 | fusion-ops.ts、Canvas.tsx | fusion-ops；隐藏/聚焦/侧栏浏览器回归 |
| 背诵、高亮、答案分支、选择题 | projectView、主画布与富内容渲染 | 投影不改源文件；浏览器选项/解析遮挡与揭晓；源代码侧栏在背诵时收起 |
| 标记与任务 | 原标记系统、emoji-markers.ts、主画布 | 原 core 测试、自定义组互斥、emoji 分组 |
| 锁定与只读折叠 | view projection、宿主文件状态 | 只读不能编辑/撤销；折叠只改变显示的浏览器测试 |
| PNG/SVG/Markdown、复制图片 | export.ts、宿主导出 | 字体资源测试、浏览器真实 PNG 和内嵌图片 SVG |
| 触屏、工具栏、鼠标设置 | Canvas.tsx、主画布、settings | 类型检查、隔离桌面交互；实际触屏与安卓待验 |
| 外部修改、异步结果、卸载和恢复 | SnapshotWriter、scopeHost、插件生命周期 | 并发自回声、延迟保存、冲突副本、切换后拒绝附件、注册清理测试 |

完整文件编辑统一使用主画布。代码块和 XMind 只读预览使用保留的专用渲染器；其样式控制和主画布不完全相同。不存在必须另装两个上游插件才能工作的依赖。
