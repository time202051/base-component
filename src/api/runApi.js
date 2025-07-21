const http = require("http");
const fs = require("fs");
const path = require("path");
const SwaggerClient = require("swagger-client");

const swaggerUrl = "http://220.179.249.140:20019/swagger/v1/swagger.json";

SwaggerClient(swaggerUrl)
  .then((client) => {
    const swaggerData = client.spec; // 获取 Swagger 数据

    // 你可以在这里调用 generateApiModules 函数来处理 swaggerData
    const apiEndpoints = generateApiModules(swaggerData);
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
        const key = generateKeyName(url, method);
        if (Object.keys(apiModules).includes(tag)) {
          // 生成 JSDoc 注释
          let functionDoc = ``;
          functionDoc += `/**\n`;
          functionDoc += ` * ${details.summary || "无描述"}\n`;

          let pathParameters = [];
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
              functionDoc += ` * @param {Object} params - 请求参数\n`;

              Object.keys(properties).forEach((key) => {
                // 是否必填
                const isRequired =
                  schema.required &&
                  Array.isArray(schema.required) &&
                  schema.required.includes(key);

                const temp = isRequired ? `params.${key}` : `[params.${key}]`;
                functionDoc += ` * @param {${javaTypeToJsType(
                  properties[key].type
                )}} ${temp} - ${properties[key].description || ""}\n`;
              });
            } else if (type === "array") {
              // 公司swagger一定是接收id数组的
              functionDoc += ` * @param {Array<string>} params - 数组类型的入参\n`;
            }
          }

          //parameters此参数
          if (Object.keys(details).includes("parameters")) {
            functionDoc += ` * @param {Object} params - 请求参数\n`;
            // 添加参数到 JSDoc
            parameters.length > 1 && console.log(5555, parameters, url);

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
          }

          functionDoc += `*/\n`;
          // 接口入参
          let functionParams = "";
          pathParameters.unshift("params");
          // 函数
          functionDoc += `export const ${generateKeyName(
            url,
            method
          )} = (${pathParameters.join(", ")}) => {\n`;

          functionDoc += ` return this.${MethodEnum[method]}({\n`;
          functionDoc += `  url: \`${url.replace(/{/g, "${")}\`,\n`;
          functionDoc += `  data: params,\n`;
          functionDoc += ` });\n`;
          functionDoc += `};\n\n`;
          apiModules[tag] += functionDoc;
        }
      });
    }
  }
  //   创建文件夹
  const modulesDir = path.join(__dirname, "./modules");
  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir);
    console.log(`创建了文件夹: ${modulesDir}`);
  }

  Object.keys(apiModules).forEach((fileName) => {
    const outputPath = path.join(modulesDir, `${fileName}.js`);
    fs.writeFileSync(outputPath, apiModules[fileName], "utf-8");
    console.log(`API地址对象已生成并保存到 ${outputPath}`);
  });
};
