#!/usr/bin/env node
const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const vue2Template = require("./initTemplate");
const program = new Command();

const spinnerChars = ["|", "/", "-", "\\"];
let spinnerIndex = 0;
let dotCount = 0;
const maxDots = 3;
let spinner;

// 启动加载动画
const startSpinner = () => {
  spinner = setInterval(() => {
    const dots = ".".repeat(dotCount);
    process.stdout.write(`\r${spinnerChars[spinnerIndex]} 正在玩命加载中${dots}`);
    spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
    dotCount = (dotCount + 1) % (maxDots + 1);
  }, 300);
};

// 停止加载动画
const stopSpinner = () => {
  if (spinner) {
    clearInterval(spinner);
    process.stdout.write("\r");
  }
};

// 自定义错误处理 - 必须在使用 program.parse() 之前调用
program.exitOverride();

try {
  program
    .version("0.1.0")
    .argument("<moduleName>", "name of the module to create")
    .option("-p, --path <customPath>", "文件路径")
    .action(async (moduleName, options) => {
      try {
        console.log("🎉 欢迎使用Vue页面模板生成器！");
        console.log(` 模块名称: ${moduleName}`);
        console.log(`📂 保存路径: ${options.path || process.cwd()}`);
        console.log("请按照提示配置页面功能：\n");

        // 1. 分页接口地址（必填）
        const pageUrlAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "pageUrl",
            message: "请输入分页接口地址（必填）:",
            default: "/api/app/admission-info/paged-result",
            validate: input => {
              if (!input.trim()) {
                return "分页接口地址不能为空";
              }
              return true;
            },
          },
        ]);

        // 2. 询问是否有导出接口
        const exportAnswer = await inquirer.prompt([
          {
            type: "confirm",
            name: "hasExport",
            message: "是否有导出接口?",
            default: true,
          },
        ]);

        let exportUrl = "";
        if (exportAnswer.hasExport) {
          const exportUrlAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "exportUrl",
              message: "请输入导出接口地址:",
              default: "/api/app/admission-info/paged-result",
              validate: input => {
                if (!input.trim()) {
                  return "导出接口地址不能为空";
                }
                return true;
              },
            },
          ]);
          exportUrl = exportUrlAnswer.exportUrl;
        }

        // 3. 询问是否有新增/编辑/删除功能
        const operationsAnswer = await inquirer.prompt([
          {
            type: "checkbox",
            name: "operations",
            message: "请选择需要的功能:",
            choices: [
              { name: "新增功能", value: "add" },
              { name: "编辑功能", value: "edit" },
              { name: "删除功能", value: "delete" },
              { name: "详情功能", value: "detail" },
            ],
            default: [],
          },
        ]);

        let baseUrl = "";
        let idField = "id";
        let addUrl = "";
        let editUrl = "";
        let deleteUrl = "";
        let detailUrl = "";
        let rowId = "";

        // 如果有新增/编辑/删除/详情功能，直接使用分页接口地址
        if (operationsAnswer.operations.length > 0) {
          // baseUrl
          const baseUrlAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "baseUrl",
              message: "请输入操作接口的基础路径:",
              default: "/api/app/admission-info/admission-info",
              validate: input => {
                if (!input.trim()) {
                  return "操作接口的基础路径不能为空";
                }
                return true;
              },
            },
          ]);
          baseUrl = baseUrlAnswer.baseUrl;

          // 询问ID字段名
          const idFieldAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "idField",
              message: "请输入url后缀ID字段名:",
              default: "admissionInfoId",
              validate: input => {
                if (!input.trim()) {
                  return "url后缀ID字段名不能为空";
                }
                return true;
              },
            },
          ]);
          idField = idFieldAnswer.idField;

          // 根据选择的功能构建对应的接口地址
          if (operationsAnswer.operations.includes("add")) {
            addUrl = baseUrl;
          }
          if (operationsAnswer.operations.includes("edit")) {
            editUrl = `${baseUrl}/{${idField}}`;
          }
          if (operationsAnswer.operations.includes("delete")) {
            deleteUrl = `${baseUrl}/{${idField}}`;
          }
          if (operationsAnswer.operations.includes("detail")) {
            detailUrl = `${baseUrl}/{${idField}}`;
          }
        }

        //如果有编辑/详情/删除，询问row中的id字段名
        if (
          operationsAnswer.operations.includes("edit") ||
          operationsAnswer.operations.includes("delete") ||
          operationsAnswer.operations.includes("detail")
        ) {
          const rowIdAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "rowId",
              message: "请输入行数据中ID字段的键名（用于编辑/详情/删除操作）",
              default: "id",
              validate: input => {
                if (!input.trim()) {
                  return "ID字段的键名不能为空";
                }
                return true;
              },
            },
          ]);
          rowId = rowIdAnswer.rowId;
        }

        // 4. 询问所有接口的模块名
        const moduleAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "swaggerModule",
            message: "请输入所有接口的模块名:",
            default: "AdmissionInfo",
            validate: input => {
              if (!input.trim()) {
                return "模块名不能为空";
              }
              return true;
            },
          },
        ]);

        // 启动加载动画
        startSpinner();

        const dir = path.join(options.path || process.cwd(), moduleName);

        // 检查目录是否存在
        if (fs.existsSync(dir)) {
          stopSpinner();
          console.log(`❌ 创建失败，文件夹 ${dir} 已存在`);
          return;
        }

        // 创建目录
        fs.mkdirSync(dir, { recursive: true });

        // 合并所有配置
        const config = {
          moduleName,
          path: options.path || process.cwd(),
          pageUrl: pageUrlAnswer.pageUrl,
          hasExport: exportAnswer.hasExport,
          exportUrl: exportUrl,
          baseUrl,
          hasAdd: operationsAnswer.operations.includes("add"),
          addUrl: addUrl,
          hasEdit: operationsAnswer.operations.includes("edit"),
          editUrl: editUrl,
          hasDelete: operationsAnswer.operations.includes("delete"),
          deleteUrl: deleteUrl,
          hasDetail: operationsAnswer.operations.includes("detail"),
          detailUrl: detailUrl,
          swaggerModule: moduleAnswer.swaggerModule,
          idField: idField,
          rowId,
        };

        // 生成模板内容
        const templateContent = vue2Template(moduleName, config);

        // 保存文件
        const outputPath = path.join(dir, `index.vue`);
        fs.writeFileSync(outputPath, templateContent);

        // 停止加载动画
        stopSpinner();

        // 输出成功信息
        console.log(`✅ 模板已生成并保存到 ${outputPath}`);
      } catch (error) {
        stopSpinner();
        console.error("❌ 发生错误：", error.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
} catch (err) {
  // 捕获 commander 的错误
  if (err.code === "commander.missingArgument") {
    console.log("❌ 错误：缺少必需的文件名称");
    console.log("📖 使用方法：");
    console.log("  npx add <文件名> -p <路径>");
    console.log(" 示例：");
    console.log("  npx add demo -p src/view");
    process.exit(1);
  } else {
    // 处理其他错误
    stopSpinner();
    console.error("❌ 发生错误：", err.message);
    process.exit(1);
  }
}
