#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const SwaggerClient = require("swagger-client");

// eg：node api http://220.179.249.140:20019 ./modules

// const swaggerUrl = "http://220.179.249.140:20019/swagger/v1/swagger.json";
const swaggerUrl = process.argv[2]
  ? `${process.argv[2]}/swagger/v1/swagger.json`
  : "";
const modulesDir = process.argv[3] ? process.argv[3] : "src/api/modules";
// process.argv[3] || "src/api/modules" || path.join(__dirname, "./modules");

SwaggerClient(swaggerUrl)
  .then((client) => {
    const swaggerData = client.spec; // 获取 Swagger 数据

    const apiModules = generateApiModules(swaggerData);
    //   创建文件夹
    // const modulesDir = path.join(__dirname, "./modules");
    if (!fs.existsSync(modulesDir)) {
      fs.mkdirSync(modulesDir);
      console.log(`创建了文件夹: ${modulesDir}`);
    }

    Object.keys(apiModules).forEach((fileName) => {
      const outputPath = path.join(modulesDir, `${fileName}.js`);
      fs.writeFileSync(outputPath, apiModules[fileName], "utf-8");
      console.log(`API接口已生成并保存到 ${outputPath}`);
    });
  })
  .catch((err) => {
    console.error("获取 Swagger 数据时出错:", err);
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
  return `${method}${key}`;
}

// java数据类型转成js数据类型
const javaTypeToJsType = (javaType) => {
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
const getPathParameters = (parameters) => {
  if (!parameters && !Array.isArray(parameters)) return [];
  return parameters
    .filter((param) => param.in === "path") // 过滤出路径参数
    .map((param) => param.name); // 提取name属性
};

const MethodEnum = {
  get: "get",
  post: "post",
  put: "put",
  delete: "del",
};
const generateApiModules = (swagger) => {
  const { tags, paths } = swagger;
  const apiModules = {};
  // 初始化模块对象
  tags.forEach((tag) => {
    apiModules[
      tag.name
    ] = `import { get, post, put, del } from "@/api/request/sendRuest"\n`;
  });

  for (const [url, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const tags = details.tags || [];
      const parameters = details.parameters || [];
      const requestBody = details.requestBody || {};
      tags.forEach((tag) => {
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
            parameters.forEach((param) => {
              const paramType = param.schema
                ? javaTypeToJsType(param.schema.type)
                : "any";
              const paramName = param.name;
              const temp = param.required
                ? `params.${paramName}`
                : `[params.${paramName}]`;
              functionDoc += ` * @param {${paramType}} ${temp} - ${
                param.description || ""
              }\n`;
            });
            pathParameters = getPathParameters(parameters);
            // 是否有query参数
            hasQuery = parameters.some((e) => e.in === "query");
          }

          //   如果有requestBody
          if (
            Object.keys(requestBody).length > 0 &&
            requestBody.content &&
            requestBody.content["text/json"] &&
            requestBody.content["text/json"].schema
          ) {
            const schema = requestBody.content["text/json"].schema;
            const { type, properties } = schema;
            //目前只有这两种入参结构
            if (type === "object") {
              functionDoc += ` * @param {Object} body - 请求参数\n`;

              Object.keys(properties).forEach((key) => {
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
              if (Object.keys(properties).length > 1) hasBody = true;
            } else if (type === "array") {
              // 公司入参是数组的swagger一定是接收id数组的
              functionDoc += ` * @param {Array<string>} body - 数组类型的入参\n`;
              hasBody = true;
            }
          }

          functionDoc += `*/\n`;
          // 接口入参
          let functionParams = [];
          if (hasQuery) functionParams.push("params");
          if (hasBody) functionParams.push("body");
          functionParams = functionParams.concat(pathParameters).join(", ");
          // 函数
          functionDoc += `export const ${generateKeyName(
            url,
            method
          )} = (${functionParams}) => {\n`;

          functionDoc += ` return ${MethodEnum[method]}({\n`;
          functionDoc += `  url: \`${url.replace(/{/g, "${")}\`,\n`;
          if (hasQuery) functionDoc += `  params,\n`;
          if (hasBody) functionDoc += `  data: body,\n`;
          functionDoc += ` });\n`;
          functionDoc += `};\n\n`;
          apiModules[tag] += functionDoc;
        }
      });
    }
  }

  return apiModules;
};
