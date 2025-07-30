#!/usr/bin/env node
// 就是执行api.js和run.js脚本 npx init http://xxxx
const { spawn } = require("child_process");
const path = require("path");

// 获取命令行参数并设置默认值
const swaggerUrl = process.argv[2];

// 执行 api.js 脚本
function runApiScript() {
  return new Promise((resolve, reject) => {
    console.log("📝 正在执行 swagger 脚本...");

    const apiProcess = spawn(
      "node",
      [path.join(__dirname, "api.js"), swaggerUrl],
      {
        stdio: "inherit",
      }
    );

    apiProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ swagger脚本执行完成\n");
        resolve();
      } else {
        reject(new Error(`swagger 脚本执行失败，退出码: ${code}`));
      }
    });

    apiProcess.on("error", (err) => {
      reject(new Error(`执行 swagger 时出错: ${err.message}`));
    });
  });
}

// 执行 run.js 脚本
function runRunScript() {
  return new Promise((resolve, reject) => {
    console.log("🔧 正在执行 接口 脚本...");

    const runProcess = spawn(
      "node",
      [path.join(__dirname, "run.js"), swaggerUrl],
      {
        stdio: "inherit",
      }
    );

    runProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ 接口 脚本执行完成\n");
        resolve();
      } else {
        reject(new Error(`接口 脚本执行失败，退出码: ${code}`));
      }
    });

    runProcess.on("error", (err) => {
      reject(new Error(`执行 接口 时出错: ${err.message}`));
    });
  });
}

// 主执行函数
async function main() {
  try {
    // 先执行 api.js
    await runApiScript();

    // 再执行 run.js
    await runRunScript();

    console.log("🎉 所有脚本执行完成！");
  } catch (error) {
    console.error("❌ 执行过程中出现错误:", error.message);
    process.exit(1);
  }
}

// 执行主函数
main();
