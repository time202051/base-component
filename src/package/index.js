import OlTable, { OlDropdownPrint } from "./table";
import OlSearch from "./formSearch";
import OlCustomSearch from "./customSearch";
import Dialog from "./dialog";
import OlForm from "./form";
import OlNumberRange from "./numberRange";
import OlPrintModel from "./printModel";
import OlCrud from "./crud";
import OlExportExcel from "./exportExcel";

import OlPrint, { Hiprint } from "./print";
import { getFilterConditions } from "./customSearch/src/forcedFilter";

import InputHistory from "./inputHistory";

import SwaggerClient from "swagger-client";

const consoleTooltip = () => {
  // 定义颜色和样式
  const reset = "\x1b[0m"; // 重置样式
  const green = "\x1b[32m"; // 绿色
  const cyan = "\x1b[36m"; // 青色
  const bold = "\x1b[1m"; // 粗体
  const underline = "\x1b[4m"; // 下划线

  // 定义图案
  const star = "⭐";
  const checkMark = "✔️";

  // 输出成功提示
  console.log(`
${cyan}${bold}${star.repeat(
    3
  )}${green}${bold}${underline}ol-base-components 组件库加载成功！ ${checkMark}
${cyan}感谢您的使用，期待您的精彩应用！${reset}
`);

  // 常用组件速查表（无索引、无引号）
  const componentList = [
    ["ol-crud", "核心组件：表格 + 搜索 + 分页一体化"],
    ["ol-table", "基础表格 + 打印"],
    ["ol-search", "搜索表单"],
    ["ol-form", "动态表单"],
    ["ol-print", "打印功能（含 hiprint）"],
    ["ol-print-model", "打印模板"],
    ["ol-export-excel", "Excel 导出"],
    ["ol-number-range", "数字范围输入"],
    ["ol-customSearch", "自定义搜索配置"],
    ["ol-dropdown-print", "表格下拉打印"],
  ];
  const nameWidth = componentList.reduce((w, [name]) => Math.max(w, name.length), 0) + 2;
  console.log(
    `📦 常用组件速查表：\n` +
      componentList.map(([name, desc]) => `  ${name.padEnd(nameWidth)}${desc}`).join("\n")
  );
};
const consoleSwagger = () => {
  // 定义颜色和样式
  const reset = "\x1b[0m"; // 重置样式
  const green = "\x1b[32m"; // 绿色
  const cyan = "\x1b[36m"; // 青色
  const bold = "\x1b[1m"; // 粗体
  const underline = "\x1b[4m"; // 下划线

  // 定义图案
  const star = "⭐";
  const checkMark = "✔️";

  // 输出成功提示
  console.log(`
${cyan}${bold}${star.repeat(
    3
  )}${green}${bold}${underline}ol-base-components swagger服务加载成功！ ${checkMark}
`);
};

const DB_NAME = "SwaggerDB";
const DB_VERSION = 1;
const STORE_NAME = "swaggerDataStore";

// 打开数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME);
    };

    request.onsuccess = event => {
      resolve(event.target.result);
    };

    request.onerror = event => {
      reject(event.target.error);
    };
  });
}

// 存储数据
function storeData(data) {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, "swaggerData"); // 使用 'swaggerData' 作为键
      transaction.oncomplete = () => resolve();
      transaction.onerror = event => reject(event.target.error);
    });
  });
}

// 获取数据
export function getData() {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("swaggerData");

      request.onsuccess = event => {
        resolve(event.target.result);
      };

      request.onerror = event => {
        reject(event.target.error);
      };
    });
  });
}

// 清除数据
function clearData() {
  return openDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete("swaggerData"); // 删除存储的数据
      transaction.oncomplete = () => resolve();
      transaction.onerror = event => reject(event.target.error);
    });
  });
}

// 注册
const swaggerInstall = async swaggerUrl => {
  if (!swaggerUrl) return Promise.reject(new Error("Swagger URL is required.")); // 检查 Swagger URL

  // IndexedDB 获取 Swagger 数据
  const cachedData = await getData();
  if (cachedData) {
    consoleSwagger();
    return Promise.resolve(cachedData);
  } else {
    // 如果没有缓存数据，重新请求 Swagger 数据
    try {
      showLoading();
      const client = await SwaggerClient(swaggerUrl);
      const swaggerData = client.spec;
      await storeData(swaggerData);
      hideLoading();
      consoleSwagger();
      return Promise.resolve(swaggerData);
    } catch (error) {
      hideLoading();
      console.error("获取 Swagger 数据失败:", error);
      return Promise.reject(error);
    }
  }
};
// 销毁
const swaggerUnload = async function () {
  await clearData(); // 清空 IndexedDB 中的缓存数据
};

// 自定义加载指示器
function showLoading() {
  const style = document.createElement("style");
  style.innerHTML = `
     @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    #loading-spinner {
      width: 50px; /* 调整大小 */
      height: 50px; /* 调整大小 */
      border: 8px solid rgba(255, 255, 255, 0.3);
      border-top: 8px solid #a8c8e0; /* 与背景色协调的颜色 */
      border-radius: 50%;
      animation: spin 1s linear infinite; /* 添加旋转动画 */
      margin-bottom: 10px; /* 图标和文本之间的间距 */
    }
    #loading {
      background: linear-gradient(135deg, #a8c8e0, #f0f4f8); /* 更柔和的渐变背景 */
      color: #333; /* 文本颜色 */
      z-index:9999999;
    }
   `;
  document.head.appendChild(style);

  // 创建加载指示器
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loading";
  loadingDiv.style.position = "fixed";
  loadingDiv.style.top = "0";
  loadingDiv.style.left = "0";
  loadingDiv.style.width = "100%";
  loadingDiv.style.height = "100%";
  loadingDiv.style.display = "flex";
  loadingDiv.style.flexDirection = "column";
  loadingDiv.style.justifyContent = "center";
  loadingDiv.style.alignItems = "center";

  // 创建旋转的加载图标
  const spinner = document.createElement("div");
  spinner.id = "loading-spinner";
  loadingDiv.appendChild(spinner);

  // 添加文本
  const loadingText = document.createElement("div");
  loadingText.innerText = "初始化数据中，请耐心等待...";
  loadingDiv.appendChild(loadingText);

  document.body.appendChild(loadingDiv);
}

function hideLoading() {
  const loadingDiv = document.getElementById("loading");
  if (loadingDiv) {
    document.body.removeChild(loadingDiv);
  }
}

const components = [
  OlTable,
  OlDropdownPrint,
  OlSearch,
  OlCustomSearch,
  Dialog,
  OlForm,
  OlNumberRange,
  OlPrint,
  OlPrintModel,
  OlCrud,
  OlExportExcel,
];
const install = async function (Vue, options) {
  // 设置全局数据
  components.map(item => {
    Vue.component(`ol-${item.name}`, item);
  });
  Vue.use(InputHistory, options);
  Vue.prototype.$olBaseConfig = options || {};
  Vue.prototype.$getFilterConditions = getFilterConditions;
  consoleTooltip();
};

export default install;
export {
  OlTable,
  OlDropdownPrint,
  OlSearch,
  OlCustomSearch,
  Dialog,
  OlForm,
  OlNumberRange,
  OlPrint,
  OlPrintModel,
  OlCrud,
  OlExportExcel,
};
export { swaggerInstall, swaggerUnload, Hiprint };
export { InputHistory };
// export { getFilterConditions };
