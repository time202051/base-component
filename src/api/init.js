#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// 获取命令行参数
let swaggerUrl = process.argv[2];

// 提取 baseURL 的函数
// 目录结构
// ├── public
// │   ├── configBaseUrl.js
// window.global_config = {
//   // baseURL: "http://220.179.227.4:20040",
//   baseURL: "http://192.168.101.113:6005",
//   swaggerUrl: "/ctc",
// };
async function extractSwaggerUrl() {
  const configPath = path.join(process.cwd(), "public", "configBaseUrl.js");
  
  if (!fs.existsSync(configPath)) {
    console.error("\n❌ 错误: 找不到 configBaseUrl.js 文件");
    console.error(`路径: ${configPath}`);
    return null;
  }
  
  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    // 使用正则表达式提取 baseURL（排除注释行，支持缩进）
    const baseURLMatch = configContent.match(/^\s*[^\/]*baseURL:\s*["']([^"']+)["']/m);
    
    if (!baseURLMatch) {
      console.error("\n❌ 错误: 无法从 configBaseUrl.js 中提取 baseURL");
      console.error("请确保配置文件中有类似这样的配置:");
      console.error("  window.config = { baseURL: 'http://your-swagger-url' }");
      return null;
    }
    
    const baseURL = baseURLMatch[1] || "";
    if (!baseURL) {
      console.error("\n❌ 错误: baseURL 为空");
      return null;
    }
    
    return baseURL;
  } catch (err) {
    console.error("\n❌ 读取配置文件失败:", err.message);
    return null;
  }
}

// 执行 api.js 脚本
function runApiScript() {
  return new Promise((resolve, reject) => {
    console.log("📝 正在执行 swagger 脚本...");

    const apiProcess = spawn("node", [path.join(__dirname, "api.js"), swaggerUrl], {
      stdio: "inherit",
    });

    apiProcess.on("close", code => {
      if (code === 0) {
        console.log("✅ swagger脚本执行完成");
        resolve();
      } else {
        reject(new Error(`swagger 脚本执行失败，退出码: ${code}`));
      }
    });

    apiProcess.on("error", err => {
      reject(new Error(`执行 swagger 时出错: ${err.message}`));
    });
  });
}

// 执行 run.js 脚本
function runRunScript() {
  return new Promise((resolve, reject) => {
    console.log("🔧 正在执行 接口 脚本...");

    const runProcess = spawn("node", [path.join(__dirname, "run.js"), swaggerUrl], {
      stdio: "inherit",
    });

    runProcess.on("close", code => {
      if (code === 0) {
        console.log("✅ 接口脚本执行完成");
        resolve();
      } else {
        reject(new Error(`接口脚本执行失败，退出码: ${code}`));
      }
    });

    runProcess.on("error", err => {
      reject(new Error(`执行 接口 时出错: ${err.message}`));
    });
  });
}

// 执行 fetch-swagger.js 脚本
function runFetchSwaggerScript() {
  return new Promise((resolve, reject) => {
    console.log("📥 正在下载 swagger.json...");

    const fetchProcess = spawn("node", [path.join(__dirname, "../bin/fetch-swagger.js")], {
      stdio: "inherit",
    });

    fetchProcess.on("close", code => {
      if (code === 0) {
        console.log("✅ swagger.json 下载完成");
        resolve();
      } else {
        reject(new Error(`swagger.json 下载失败，退出码: ${code}`));
      }
    });

    fetchProcess.on("error", err => {
      reject(new Error(`执行 fetch-swagger 时出错: ${err.message}`));
    });
  });
}

// 主执行函数
async function main() {
  try {
    // 如果命令行没有传参，尝试从配置文件提取
    if (!swaggerUrl) {
      console.log("🔍 未指定 URL，正在从 configBaseUrl.js 自动检测...");
      const extractedUrl = await extractSwaggerUrl();
      if (extractedUrl) {
        swaggerUrl = extractedUrl;
        console.log(`✨ 自动检测到 baseURL: ${swaggerUrl}`);
      }
    }

    // 检查是否有有效的 URL
    if (!swaggerUrl) {
      console.error("\n❌ 错误: 无法获取有效的 swagger URL");
      console.error("请手动指定 URL，用法:");
      console.error("  npx ol-base-components init http://your-swagger-url");
      process.exit(1);
    }

    console.log(`\n🚀 开始初始化，URL: ${swaggerUrl}`);

    // 先执行 api.js
    await runApiScript();

    // 再执行 run.js
    await runRunScript();

    // 最后执行 fetch-swagger.js 下载 swagger.json
    await runFetchSwaggerScript();

    console.log("\n🎉 所有脚本执行完成！");
  } catch (error) {
    console.error("❌ 执行过程中出现错误:", error.message);
    process.exit(1);
  }
}

// 执行主函数
main();