#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const SwaggerClient = require("swagger-client");

// eg：node api http://220.179.249.140:20019 ./modules

const swaggerUrl = process.argv[2] ? `${process.argv[2]}/swagger/v1/swagger.json` : "";
const modulesDir = process.argv[3] ? process.argv[3] : "src/api/modules";

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
    // 获取当前文件权限
    const stats = fs.statSync(filePath);
    // 设置只读权限 (444: 所有者、组、其他用户都只有读权限)
    fs.chmodSync(filePath, 0o444);
  } catch (error) {
    console.warn(`⚠️ 设置文件权限失败: ${filePath}`, error.message);
  }
}

SwaggerClient(swaggerUrl)
  .then(client => {
    const swaggerData = client.spec; // 获取 Swagger 数据

    const apiModules = generateApiModules(swaggerData);
    //   创建文件夹
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir);
      console.log(`创建了文件夹: ${modulesDir}`);
    }

    Object.keys(apiModules).forEach(fileName => {
      const outputPath = path.join(modulesDir, `${fileName}.js`);
      // 如果文件已存在，先删除（包括只读文件）
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      fs.writeFileSync(outputPath, apiModules[fileName], "utf-8");
      setFileReadOnly(outputPath);
      console.log(`API接口已生成并保存到 ${outputPath}（只读）`);
    });

    // 生成index.js入口文件
    createIndexFile(apiModules);
  })
  .catch(err => {
    console.error("获取 Swagger 数据时出错:", err);
  })
  .finally(() => {
    clearInterval(spinner);
    process.stdout.write("\r");
  });

function createIndexFile(apiModules) {
  let str = defaultRemark;
  Object.keys(apiModules).forEach(fileName => {
    str += `export * from "./${fileName}";\n`;
  });
  const outputPath = path.join(modulesDir, `index.js`);
  // 如果文件已存在，先删除（包括只读文件）
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  fs.writeFileSync(outputPath, str, "utf-8");
  // 设置 index.js 也为只读
  setFileReadOnly(outputPath);
  console.log(`API接口已生成并保存到 ${outputPath}（只读）`);
}

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
  return `${method}${key}`;
}

// java数据类型转成js数据类型
const javaTypeToJsType = javaType => {
  switch (javaType) {
    case "integer":
      return "number";
    case "array":
      return "Array";
    case "object":
      return "Object";
    default:
      return javaType;
  }
};

// 根据parameters参数返回path对应的接口参数，path参数都是必填的
const getPathParameters = parameters => {
  if (!parameters && !Array.isArray(parameters)) return [];
  return parameters
    .filter(param => param.in === "path") // 过滤出路径参数
    .map(param => param.name); // 提取name属性
};

const MethodEnum = {
  get: "get",
  post: "post",
  put: "put",
  // delete: "del",
  delete: "delete",
};
const generateApiModules = swagger => {
  const { tags, paths } = swagger;
  const apiModules = {};
  // 初始化模块对象
  tags.forEach(tag => {
    apiModules[tag.name] = `${defaultRemark}import { api } from "@/api/request/sendRuest"\n`;
  });

  for (const [url, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const tags = details.tags || [];
      const parameters = details.parameters || [];
      const requestBody = details.requestBody || {};
      tags.forEach(tag => {
        if (Object.keys(apiModules).includes(tag)) {
          // 生成 JSDoc 注释
          let functionDoc = ``;
          functionDoc += `/**\n`;
          functionDoc += ` * ${details.summary || "无描述"}\n`;

          let pathParameters = [];
          let hasQuery = false;
          let hasBody = false;
          //parameters此参数
          if (Object.keys(details).includes("parameters")) {
            functionDoc += ` * @param {Object} params - 请求参数\n`;
            parameters.forEach(param => {
              const paramType = param.schema ? javaTypeToJsType(param.schema.type) : "any";
              const paramName = param.name;
              const temp = param.required ? `params.${paramName}` : `[params.${paramName}]`;
              functionDoc += ` * @param {${paramType}} ${temp} - ${param.description || ""}\n`;
            });
            pathParameters = getPathParameters(parameters);
            // 是否有query参数
            hasQuery = parameters.some(e => e.in === "query");
          }

          //   如果有requestBody
          if (Object.keys(requestBody).length > 0 && requestBody.content) {
            // 兼容常见 json contentType
            const content = requestBody.content;
            const jsonCT =
              content["application/json"] ||
              content["application/*+json"] ||
              content["text/json"] ||
              content["*/*"];
            const schema = jsonCT && jsonCT.schema;

            if (schema) {
              const { type, properties } = schema;
              // 目前只有这两种入参结构
              if (type === "object") {
                functionDoc += ` * @param {Object} body - 请求参数\n`;

                if (properties && typeof properties === "object") {
                  Object.keys(properties).forEach(key => {
                    // 是否必填
                    const isRequired =
                      schema.required &&
                      Array.isArray(schema.required) &&
                      schema.required.includes(key);

                    const temp = isRequired ? `body.${key}` : `[body.${key}]`;
                    functionDoc += ` * @param {${javaTypeToJsType(
                      properties[key].type
                    )}} ${temp} - ${properties[key].description || ""}\n`;
                  });
                  if (Object.keys(properties).length > 0) hasBody = true;
                } else {
                  // 无 properties（可能是 $ref 或标量），仍然认为有 body
                  hasBody = true;
                }
              } else if (type === "array") {
                // 公司入参是数组的swagger一定是接收id数组的
                functionDoc += ` * @param {Array<string>} body - 数组类型的入参\n`;
                hasBody = true;
              } else {
                // 其他类型（string/number/boolean 或 $ref 未解析）
                hasBody = true;
              }
            }
          }

          functionDoc += `*/\n`;
          // 接口入参
          let functionParams = [];
          if (hasQuery) functionParams.push("params");
          if (hasBody) functionParams.push("body");
          // Object.assign(functionParams, pathParameters);
          functionParams = [...pathParameters, ...functionParams];
          functionParams.push("options = {}");
          // 函数
          functionDoc += `export const ${generateKeyName(url, method)} = (${functionParams.join(
            ", "
          )}) => {\n`;

          functionDoc += ` return api({\n`;
          functionDoc += `  url: \`${url.replace(/{/g, "${")}\`,\n`;
          functionDoc += `  method: "${MethodEnum[method]}",\n`;
          if (hasQuery) functionDoc += `  params,\n`;
          if (hasBody) functionDoc += `  data: body,\n`;
          functionDoc += `  ...options\n`;
          functionDoc += ` });\n`;
          functionDoc += `};\n\n`;
          apiModules[tag] += functionDoc;
        }
      });
    }
  }

  return apiModules;
};
