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
        path.join(homeDir, "AppData", "Local", "Cursor", "User", "extensions"), // Cursor 本地扩展目录
        path.join(homeDir, "AppData", "Roaming", "Code", "User", "extensions"), // VSCode 扩展目录
        path.join(
          homeDir,
          "AppData",
          "Local",
          "Programs",
          "Microsoft VS Code",
          "resources",
          "app",
          "extensions"
        ), // VSCode 系统扩展目录
      ];
    case "darwin":
      return [
        path.join(homeDir, ".vscode", "extensions"),
        path.join(homeDir, ".cursor", "extensions"),
        path.join(homeDir, "Library", "Application Support", "Cursor", "User", "extensions"),
        path.join(homeDir, "Library", "Application Support", "Code", "User", "extensions"),
      ];
    case "linux":
      return [
        path.join(homeDir, ".vscode", "extensions"),
        path.join(homeDir, ".cursor", "extensions"),
        path.join(homeDir, ".config", "Cursor", "User", "extensions"),
        path.join(homeDir, ".config", "Code", "User", "extensions"),
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

    console.log("�� 正在查找扩展目录...");
    extensionsPaths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path} ${fs.existsSync(path) ? "✅ 存在" : "❌ 不存在"}`);
    });

    let installed = false;

    for (const extensionsPath of extensionsPaths) {
      if (fs.existsSync(extensionsPath)) {
        console.log(`\n📁 使用扩展目录: ${extensionsPath}`);

        const extensionDir = path.join(extensionsPath, extensionName);

        // 删除旧的扩展目录（如果存在）
        if (fs.existsSync(extensionDir)) {
          console.log("🗑️  删除旧的扩展目录...");
          fs.rmSync(extensionDir, { recursive: true, force: true });
        }

        // 创建扩展目录
        fs.mkdirSync(extensionDir, { recursive: true });
        console.log("📁 创建扩展目录:", extensionDir);

        // 复制扩展文件
        const srcDir = path.join(__dirname, "../src/vscode");
        const files = ["extension.js"];

        files.forEach(file => {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(extensionDir, file);

          if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`✅ 复制文件: ${file}`);
          } else {
            console.log(`❌ 源文件不存在: ${srcFile}`);
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
          } else {
            console.log("❌ 源文件不存在: webview/panel.js");
          }
        } else {
          console.log("❌ webview 目录不存在:", webviewSrcDir);
        }

        // 创建 package.json
        const packageJson = {
          name: extensionName,
          displayName: "Vue 页面生成器",
          description: "从 Swagger API 生成 Vue CRUD 页面",
          version: "0.0.4",
          engines: {
            vscode: "^1.60.0",
          },
          activationEvents: ["onCommand:vue-generator.createPage", "onCommand:vue-generator.test"],
          main: "./extension.js",
          contributes: {
            commands: [
              {
                command: "vue-generator.createPage",
                title: "生成 Vue 页面",
                category: "Vue 生成器",
              },
              {
                command: "vue-generator.test",
                title: "测试 Vue 生成器",
                category: "Vue 生成器",
              },
            ],
            menus: {
              "explorer/context": [
                {
                  command: "vue-generator.createPage",
                  group: "navigation",
                  when: "resourceFolder",
                },
              ],
            },
          },
        };

        const packageJsonPath = path.join(extensionDir, "package.json");
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf8");
        console.log("✅ 创建文件: package.json");

        console.log(`\n�� VSCode/Cursor 扩展安装成功！`);
        console.log("请重启 Cursor 以激活扩展。");
        console.log("安装位置:", extensionDir);

        // 显示扩展目录内容
        console.log("\n📁 扩展目录内容:");
        const extensionFiles = fs.readdirSync(extensionDir);
        extensionFiles.forEach(file => {
          const filePath = path.join(extensionDir, file);
          const stats = fs.statSync(filePath);
          console.log(`  - ${file} ${stats.isDirectory() ? "(目录)" : "(文件)"}`);
        });

        installed = true;
        break;
      }
    }

    if (!installed) {
      console.log("\n❌ 未找到 VSCode 或 Cursor 扩展目录");
      console.log("请确保已安装 VSCode 或 Cursor 编辑器。");
    }
  } catch (error) {
    console.error("❌ 安装失败:", error.message);
    console.error("错误详情:", error.stack);
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
