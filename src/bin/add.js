#!/usr/bin/env node
const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const vue2Template = require("./initTemplate");
const program = new Command();

const spinnerChars = ["|", "/", "-", "\\"];
let spinnerIndex = 0;
let dotCount = 0;
const maxDots = 3;
const spinner = setInterval(() => {
  const dots = ".".repeat(dotCount);
  process.stdout.write(`\r${spinnerChars[spinnerIndex]} 正在玩命加载中${dots}`);
  spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
  dotCount = (dotCount + 1) % (maxDots + 1);
}, 300);

// 自定义错误处理 - 必须在使用 program.parse() 之前调用
program.exitOverride();

try {
  program
    .version("0.1.0")
    .argument("<moduleName>", "name of the module to create")
    .option("-p, --path <customPath>", "文件路径")
    .option(
      "-u, --url <pageUrl>",
      "分页接口URL (可选)",
      "/api/app/business-report/stock-bIPaged-result"
    )
    .option(
      "-e, --export <exportUrl>",
      "分页接口导出URL (可选)",
      "/api/app/business-report/export-stock-bI"
    )
    .option(
      "-m, --swaggerModule <swaggerModule>",
      "swagger.js模块名称 (可选)",
      "BusinessReport"
    )
    .action((moduleName, options) => {
      console.log(111, options);

      const dir = path.join(options.path || process.cwd(), moduleName);
      // 启动加载动画
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`创建文件夹: ${dir}`);

        const templateContent = vue2Template(moduleName, options);
        fs.writeFileSync(path.join(dir, `index.vue`), templateContent);
      } else {
        console.log(`创建失败，文件夹 ${dir} 已存在`);
      }
      if (options.debug) {
        console.log("调试信息:", options);
      }
      clearInterval(spinner);
      process.stdout.write("\r");
    });
  program.parse(process.argv);
} catch (err) {
  // 捕获 commander 的错误
  if (err.code === "commander.missingArgument") {
    console.log("❌ 错误：缺少必需的文件名称");
    console.log("📖 使用方法：");
    console.log("  npx add <文件名> -p <路径>");
    console.log("�� 示例：");
    console.log("  npx add demo -p src/view");
    process.exit(1);
  } else {
    // 处理其他错误
    // console.error("❌ 发生错误：", err.message);
    process.exit(1);
  }
}
// program.parse(process.argv);
