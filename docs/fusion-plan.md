# Unified Mindmap Implementation Plan

> Execute in the current session using subagent-driven-development for isolated modules; review specification and quality before integration.

**Goal:** Preserve Weilanx's complete Obsidian editor and integrate gogoga's additional capabilities in a new personal plugin.

**Architecture:** Keep the Weilanx JSON model and React editor as the compatibility core. Vendor gogoga with attribution for Markdown, XMind, embedding and Obsidian services; add shared format adapters so the primary editor can open Markdown without flattening its structure. Add rich rendering and study operations to the primary editor, rather than claiming two separately bundled editors are the completed fusion.

**Tech Stack:** TypeScript, React, esbuild, Obsidian API, node:test, upstream gogoga parsers and tests.

## 1. Isolated baseline and upstream inventory

- [ ] Clone local Weilanx snapshot to personal-mindmap, feature branch, remove upstream push remote.
- [ ] Vendor gogoga under vendor/gogoga with LICENSE, src, scripts/tests, examples and styles.
- [ ] Preserve upstream licenses and document versions/commits; use personal-mindmap ID.
- [ ] Install dependencies, run `npm test`, `npm run typecheck`, upstream gogoga tests and build before modifications; record existing failures separately.

## 2. Format adapters and persistence (test first)

Files: src/fusion/markdown.ts, src/fusion/xmind.ts, test/fusion.test.ts.

- [ ] Test Markdown parsing into primary model including notes, ranges, relations, floating topics and node metadata. Test text edit retains unrelated frontmatter and original formatting using `preserveFormat`.
- [ ] Implement bidirectional node mapping retaining original gogoga node ids/source metadata in optional JSON fields; sync edits into cloned gogoga model, serialize and preserve original formatting.
- [ ] Test unsupported primary styles are detected on plain Markdown conversion, and reversible primary data is retained in an explicit portable extension.
- [ ] Test XMind ZIP parsing for both supported content formats and multiple sheets with original gogoga regression fixtures.
- [ ] Add queued snapshot-checked writes and conflict notice; test external edit never overwritten.

## 3. Shared editor capabilities (test first)

Files: webview/src/RichTopic.tsx, rich.ts, TopicNode.tsx, measure.ts, Canvas.tsx, App.tsx, src/core/fusion-ops.ts.

- [ ] Rich Markdown/math/image renderer and matching layout measurements. Preserve original SVG text rendering and hand drawing for plain topics.
- [ ] Test study masking and reveal, answer descendants, task questions; view state must never modify source.
- [ ] Test branch focus/hidden nodes, node-only deletion, punctuation split, callouts and width; connect toolbar/context menu and host commands.
- [ ] Add note cards and image attachment integration; use host rendering for Obsidian resources and previews.
- [ ] Add touch pan/pinch/long press, per-file viewport state and lock.

## 4. Obsidian integration

Files: src/obsidian/main.ts, view.ts, src/fusion/plugin.ts, settings.ts, embed.ts.

- [ ] Unify commands and settings under one plugin lifecycle; namespace styles and view types to avoid existing plugin collisions.
- [ ] Register .wmind and .md primary views; integrate Markdown redirect, switch/line navigation, side-by-side sync, follow note, templates, note picker, file menus.
- [ ] Integrate XMind read-only multi-sheet view and conversions; retain unsupported-content notices.
- [ ] Integrate code block read/Live Preview rendering/editing, note and branch embeds and Canvas cards. Code block writes must match original source snapshot.
- [ ] Merge custom themes/markers, toolbar controls, file state and PDF++ adapters with primary view.

## 5. Verification and delivery

- [ ] Run upstream suites, new adapter/operation tests, all TypeScript projects and production builds.
- [ ] Browser harness on isolated fixtures: edit/save/reopen, Markdown preservation, code block writes, exports, study, Chinese IME, split and multi-window teardown.
- [ ] Review feature matrix against both source snapshots, report every missing capability honestly and continue until requirements satisfied.
- [ ] Package main.js, manifest.json, styles.css plus licenses, Chinese README and acceptance report; output ZIP. Do not install in real vault or publish remotely without verifying intended destination/authorization.
