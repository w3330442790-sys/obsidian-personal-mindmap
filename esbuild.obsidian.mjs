// Obsidian 插件打包:main.js(插件 + React 画布)、styles.css(主题映射 + 加作用域的共享样式)、manifest.json
// 用法:node esbuild.obsidian.mjs [--watch] [--out <dir>]
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const outDir = args.includes("--out") ? args[args.indexOf("--out") + 1] : "dist/personal-mindmap";
fs.mkdirSync(outDir, { recursive: true });

/** 把共享样式包进 `body .wm-root { ... }`:共享样式里的 .wm-root 就是包裹层本身 */
function scopedCss() {
  const shared = fs.readFileSync("webview/src/style.css", "utf8").replace(/\.wm-root/g, "&");
  return `${fs.readFileSync("src/obsidian/theme.css", "utf8")}\nbody .wm-root {\n${shared}\n}\n`;
}

async function buildCss() {
  // esbuild 把 CSS 嵌套展开成普通选择器,兼容较老的手机 WebView
  const res = await esbuild.transform(scopedCss(), { loader: "css", target: ["chrome100", "safari15"] });
  fs.writeFileSync(path.join(outDir, "styles.css"), "/* Fusion Mindmap; upstream Weilanx + gogoga (MIT) */\n" + res.code + '\n' + fs.readFileSync('vendor/gogoga/styles.css','utf8'));
}

function copyManifest() {
  fs.copyFileSync("manifest.json", path.join(outDir, "manifest.json"));
  fs.copyFileSync("LICENSE", path.join(outDir, "LICENSE-Weilanx.txt"));
  fs.copyFileSync("vendor/gogoga/LICENSE", path.join(outDir, "LICENSE-gogoga.txt"));
  fs.copyFileSync("webview/public/LICENSE-OFL.txt", path.join(outDir, "LICENSE-fonts-OFL.txt"));
}

function licenseBanner(){
  const notices=['Fusion Mindmap: upstream software, runtime dependency and bundled font licenses',...['LICENSE','vendor/gogoga/LICENSE','webview/public/LICENSE-OFL.txt'].map(file=>fs.readFileSync(file,'utf8'))];
  const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
  for(const [directory,entry]of Object.entries(lock.packages)){
    if(!directory||entry.dev||!directory.startsWith('node_modules/')||!fs.existsSync(directory))continue;
    for(const name of fs.readdirSync(directory).filter(file=>/^(licen[cs]e|copying)(\.|$)/i.test(file))){const file=path.join(directory,name);if(fs.statSync(file).isFile())notices.push(directory.replace(/^node_modules\//,''),fs.readFileSync(file,'utf8'));}
  }
  return '/*!\n'+notices.join('\n\n').replace(/\*\//g,'* /')+'\n*/';
}
const ctx = await esbuild.context({
  banner: { js: licenseBanner() },
  entryPoints: ["src/obsidian/main.ts"],
  bundle: true,
  outfile: path.join(outDir, "main.js"),
  format: "cjs",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  define: { "process.env.NODE_ENV": JSON.stringify(watch ? "development" : "production") },
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  logLevel: "info",
  // 手绘字体以 data URL 内联进 main.js
  loader: { ".css": "empty", ".woff2": "dataurl" },
});

if (watch) {
  await buildCss();
  copyManifest();
  await ctx.watch();
  fs.watch("webview/src/style.css", () => buildCss().catch(console.error));
  fs.watch("src/obsidian/theme.css", () => buildCss().catch(console.error));
} else {
  await ctx.rebuild();
  await ctx.dispose();
  await buildCss();
  copyManifest();
}
