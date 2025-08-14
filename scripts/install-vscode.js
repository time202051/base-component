#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const os = require("os");

// 检测 VSCode/Cursor 扩展目录
function getVSCodeExtensionsPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case "win32":
      return [
        path.join(homeDir, ".vscode", "extensions"),
        path.join(homeDir, ".cursor", "extensions"), // Cursor 扩展目录
        path.join(homeDir, "AppData", "Roaming", "Cursor", "User", "extensions"), // Cursor 另一个可能的位置
      ];
    case "darwin":
      return [
        path.join(homeDir, ".vscode", "extensions"),
        path.join(homeDir, ".cursor", "extensions"),
        path.join(homeDir, "Library", "Application Support", "Cursor", "User", "extensions"),
      ];
    case "linux":
      return [
        path.join(homeDir, ".vscode", "extensions"),
        path.join(homeDir, ".cursor", "extensions"),
        path.join(homeDir, ".config", "Cursor", "User", "extensions"),
      ];
    default:
      throw new Error("Unsupported platform");
  }
}

// 安装 VSCode/Cursor 扩展
function installVSCodeExtension() {
  try {
    const extensionsPaths = getVSCodeExtensionsPath();
    const extensionName = "vue-page-generator";

    let installed = false;

    for (const extensionsPath of extensionsPaths) {
      if (fs.existsSync(extensionsPath)) {
        const extensionDir = path.join(extensionsPath, extensionName);

        // 创建扩展目录
        if (!fs.existsSync(extensionDir)) {
          fs.mkdirSync(extensionDir, { recursive: true });
        }

        // 复制扩展文件
        const srcDir = path.join(__dirname, "../src/vscode");
        const files = ["extension.js"];

        files.forEach(file => {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(extensionDir, file);

          if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`✅ 复制文件: ${file}`);
          }
        });

        // 复制 webview 目录
        const webviewSrcDir = path.join(srcDir, "webview");
        const webviewDestDir = path.join(extensionDir, "webview");

        if (fs.existsSync(webviewSrcDir)) {
          if (!fs.existsSync(webviewDestDir)) {
            fs.mkdirSync(webviewDestDir, { recursive: true });
          }

          const panelFile = path.join(webviewSrcDir, "panel.js");
          const panelDestFile = path.join(webviewDestDir, "panel.js");

          if (fs.existsSync(panelFile)) {
            fs.copyFileSync(panelFile, panelDestFile);
            console.log("✅ 复制文件: webview/panel.js");
          }
        }

        // 创建 package.json
        const packageJson = {
          name: extensionName,
          displayName: "Vue Page Generator",
          description: "Generate Vue CRUD pages from Swagger API",
          version: "0.0.1",
          engines: {
            vscode: "^1.60.0",
          },
          activationEvents: ["onCommand:vue-generator.createPage"],
          main: "./extension.js",
          contributes: {
            commands: [
              {
                command: "vue-generator.createPage",
                title: "Generate Vue Page",
                category: "Vue Generator",
              },
            ],
            menus: {
              "explorer/context": [
                {
                  command: "vue-generator.createPage",
                  group: "navigation",
                  when: "resourceExtname == .vue || resourceExtname == .js || resourceExtname == .ts || resourceExtname == .jsx || resourceExtname == .tsx",
                },
              ],
            },
          },
        };

        const packageJsonPath = path.join(extensionDir, "package.json");
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log("✅ 创建文件: package.json");

        console.log(`\n�� VSCode/Cursor 扩展安装成功！`);
        console.log("请重启 Cursor 以激活扩展。");
        console.log("安装位置:", extensionDir);

        installed = true;
        break;
      }
    }

    if (!installed) {
      console.log("❌ 未找到 VSCode 或 Cursor 扩展目录");
      console.log("尝试的路径:");
      extensionsPaths.forEach(path => {
        console.log("  -", path);
      });
    }
  } catch (error) {
    console.error("❌ 安装失败:", error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  installVSCodeExtension();
}

module.exports = {
  installVSCodeExtension,
};
