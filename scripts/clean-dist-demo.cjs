// 构建后清理：public/download 只用于本地演示/开发服务器，
// 不打进 npm 产物（否则 dist/ 里会多出几十 MB 的安装包 zip）。
const fs = require("fs");
const path = require("path");

const target = path.resolve(__dirname, "..", "dist", "download");
fs.rmSync(target, { recursive: true, force: true });
console.log("[build] removed dist/download (demo-only, not published to npm)");
