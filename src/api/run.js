#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

// eg：node api http://220.179.249.140:20019 swagger.js

const swaggerUrl = process.argv[2] ? `${process.argv[2]}/swagger/v1/swagger.json` : "";
const outputPath = process.argv[3] || "src/api/swagger.js";

const defaultRemark = `/**
 * ⚠️  警告：此文件由脚本自动生成，请勿手动编辑！
 * ��  swagger更新后请重新运行生成脚本
 * 服务地址：${process.argv[2]}
*/\n\n`;
// * 📅  生成时间: ${new Date().toLocaleString()}
const spinnerChars = ["|", "/", "-", "\\"];
let spinnerIndex = 0;
let dotCount = 0;
const maxDots = 3;

const lyrics = [
  "下个礼拜你有空吗",
  "下个礼拜你有空吗",
  "下个礼拜我们还在这里等着你",
  "别说你太忙",
  "别说你没空",
  "有我们陪你一起放轻松",
];

let currentLyricIndex = 0;
let lyricChangeTime = Date.now();

const spinner = setInterval(() => {
  const dots = ".".repeat(dotCount);
  const spinnerChar = spinnerChars[spinnerIndex];

  if (Date.now() - lyricChangeTime > 2000) {
    currentLyricIndex = (currentLyricIndex + 1) % lyrics.length;
    lyricChangeTime = Date.now();
  }

  const currentLyric = lyrics[currentLyricIndex];
  const rhythm = ["♪", "♫", "♬"][Math.floor(Date.now() / 500) % 3];

  // 一行显示，用空格清除之前的内容
  const displayText = `${rhythm} ${currentLyric} ${spinnerChar} 正在玩命加载中${dots}`;
  process.stdout.write(`\r${displayText}${" ".repeat(50)}`);

  spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
  dotCount = (dotCount + 1) % (maxDots + 1);
}, 300);
// 设置文件为只读权限
function setFileReadOnly(filePath) {
  try {
    const stats = fs.statSync(filePath);
    // 设置只读权限 (444: 所有者、组、其他用户都只有读权限)
    fs.chmodSync(filePath, 0o444);
  } catch (error) {
    console.warn(`⚠️ 设置文件权限失败: ${filePath}`, error.message);
  }
}

http
  .get(swaggerUrl, response => {
    let data = "";

    // 监听数据事件
    response.on("data", chunk => {
      data += chunk;
    });

    // 监听结束事件
    response.on("end", () => {
      const swaggerData = JSON.parse(data);
      const apiEndpoints = generateApiModules(swaggerData);

      // 输出到文件
      // const outputPath = path.join(__dirname, "swagger.js");
      fs.writeFileSync(outputPath, apiEndpoints, "utf-8");
      clearInterval(spinner);
      process.stdout.write("\r");
      console.log(`API地址对象已生成并保存到 ${outputPath}（只读）`);
      // 设置文件为只读
      setFileReadOnly(outputPath);
    });
  })
  .on("error", err => {
    clearInterval(spinner);
    process.stdout.write("\r");
    console.error("获取swagger.json时出错:", err);
  });

// url转成键名规则
function generateKeyName(url, method) {
  // 移除前缀 "/api/app"
  const cleanedUrl = url.replace(/\/api\/app/, "");
  const arr = cleanedUrl.split("/");

  // 处理 {xxx} 转换为 ByXxx
  const processedArr = arr.map(
    item =>
      item
        .replace(/{(.*?)}/, (_, param) => `By${param.charAt(0).toUpperCase() + param.slice(1)}`) // 处理 {xxx}
        .replace(/[-_]/g, "") // 去除 - 和 _
  );

  // 删除第一个空项
  if (processedArr[0] === "") {
    processedArr.shift();
  }

  // 去重和拼接相邻相同的项
  const resultArr = [];
  for (let i = 0; i < processedArr.length; i++) {
    if (i === 0 || processedArr[i] !== processedArr[i - 1]) {
      // 将每项首字母大写
      const capitalizedItem = processedArr[i].charAt(0).toUpperCase() + processedArr[i].slice(1);
      resultArr.push(capitalizedItem);
    }
  }
  const key = resultArr.join("");
  return `${method.toLowerCase()}${key}`;
}

//去掉url后面 {}
function removeCurlyBraces(url) {
  // 使用正则表达式去掉 URL 中的 {xxx} 部分
  return url.replace(/\/?{[^}]*}/g, "").replace(/\/+$/, ""); // 去掉 {xxx} 和结尾的斜杠
}

// 清理summary中的换行符，确保注释在一行显示
function cleanSummary(summary) {
  if (!summary) return "";
  return summary
    .replace(/\r\n/g, " ") // 替换Windows换行符
    .replace(/\n/g, " ") // 替换Unix换行符
    .replace(/\r/g, " ") // 替换Mac换行符
    .replace(/\s+/g, " ") // 将多个连续空格替换为单个空格
    .trim(); // 去除首尾空格
}
// 生成API模块
const generateApiModules = swagger => {
  console.log(2222, swagger);

  const { tags, paths } = swagger;
  const apiModules = {};
  // 初始化模块对象
  tags.forEach(tag => {
    apiModules[tag.name] = {};
  });

  // 遍历paths，将接口添加到相应的模块中
  for (const [url, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      // 获取接口的tags
      const tags = details.tags || [];
      tags.forEach(tag => {
        const key = generateKeyName(url, method);
        if (apiModules[tag]) {
          const summary = cleanSummary(details.summary || "");
          apiModules[tag][key] = `${key}: "${removeCurlyBraces(url)}", //${method} ${summary}\n`;
          // 不去出带花括号的，键名加上特殊字段
          if (url.includes("{")) {
            apiModules[tag][
              `${key}CompleteUrl`
            ] = `${key}CompleteUrl: "${url}", //${method} ${summary}\n`;
          }
        }
      });
    }
  }

  // 生成最终的输出字符串
  let output = defaultRemark;
  for (const [moduleName, methods] of Object.entries(apiModules)) {
    const description = tags.find(e => e.name === moduleName).description;
    output += `// ${description}\n`;
    output += `export const ${moduleName} = {\n`;
    for (const method of Object.values(methods)) {
      output += `  ${method}`;
    }
    output += `};\n\n`;
  }
  // return output.replace(/\r\n/g, "\n").replace(/\r/g, "\n"); // 统一换行符为 \n
  return output;
};
