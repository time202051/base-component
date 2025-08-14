const fs = require("fs");
const path = require("path");

// 复制扩展文件到输出目录
function buildVSCodeExtension() {
  const srcDir = path.join(__dirname, "../src/vscode");
  const outDir = path.join(__dirname, "../dist/vscode-extension");

  // 创建输出目录
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 复制文件
  fs.copyFileSync(path.join(srcDir, "extension.js"), path.join(outDir, "extension.js"));

  // 复制 webview 目录
  const webviewSrcDir = path.join(srcDir, "webview");
  const webviewOutDir = path.join(outDir, "webview");

  if (!fs.existsSync(webviewOutDir)) {
    fs.mkdirSync(webviewOutDir, { recursive: true });
  }

  fs.copyFileSync(path.join(webviewSrcDir, "panel.js"), path.join(webviewOutDir, "panel.js"));

  console.log("VSCode extension built successfully!");
}

buildVSCodeExtension();
