#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

// eg：node api http://220.179.249.140:20019 swagger.js

// const swaggerUrl = "http://220.179.249.140:20019/swagger/v1/swagger.json";
const swaggerUrl = process.argv[2]
  ? `${process.argv[2]}/swagger/v1/swagger.json`
  : "";
const outputPath = process.argv[3] || "src/api/swagger.js" || "swagger.js";

http
  .get(swaggerUrl, (response) => {
    let data = "";

    // 监听数据事件
    response.on("data", (chunk) => {
      data += chunk;
    });

    // 监听结束事件
    response.on("end", () => {
      const swaggerData = JSON.parse(data);
      const apiEndpoints = generateApiModules(swaggerData);

      // 输出到文件
      // const outputPath = path.join(__dirname, "swagger.js");
      fs.writeFileSync(outputPath, apiEndpoints, "utf-8");
      console.log(`API地址对象已生成并保存到 ${outputPath}`);
    });
  })
  .on("error", (err) => {
    console.error("获取swagger.json时出错:", err);
  });

// url转成键名规则
function generateKeyName(url, method) {
  // 移除前缀 "/api/app"
  const cleanedUrl = url.replace(/\/api\/app/, "");
  const arr = cleanedUrl.split("/");

  // 处理 {xxx} 转换为 ByXxx
  const processedArr = arr.map(
    (item) =>
      item
        .replace(
          /{(.*?)}/,
          (_, param) => `By${param.charAt(0).toUpperCase() + param.slice(1)}`
        ) // 处理 {xxx}
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
      const capitalizedItem =
        processedArr[i].charAt(0).toUpperCase() + processedArr[i].slice(1);
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

// 生成API模块
const generateApiModules = (swagger) => {
  const { tags, paths } = swagger;
  const apiModules = {};
  // 初始化模块对象
  tags.forEach((tag) => {
    apiModules[tag.name] = {};
  });

  // 遍历paths，将接口添加到相应的模块中
  for (const [url, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      // 获取接口的tags
      const tags = details.tags || [];
      //   const summary = details.summary.replace(/\s+/g, "");
      tags.forEach((tag) => {
        const key = generateKeyName(url, method);
        if (apiModules[tag]) {
          const summary = details.summary || "";
          apiModules[tag][key] = `${key}: "${removeCurlyBraces(
            url
          )}", //${method} ${summary}\n`;
        }
      });
    }
  }

  // 生成最终的输出字符串
  let output = "";
  for (const [moduleName, methods] of Object.entries(apiModules)) {
    const description = tags.find((e) => e.name === moduleName).description;
    output += `// ${description}\n`;
    output += `export const ${moduleName} = {\n`;
    for (const method of Object.values(methods)) {
      output += `  ${method}`;
    }
    output += `};\n\n`;
  }

  return output;
};
