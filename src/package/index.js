import OlTable from "./table";
import OlSearch from "./formSearch";
import Dialog from "./dialog";
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
  )}${green}${bold}${underline}ol-base-components 插件加载成功！ ${checkMark}
${cyan}感谢使用我们的组件库，期待你的精彩应用！${reset}
`);
};

const DB_NAME = "SwaggerDB";
const DB_VERSION = 1;
const STORE_NAME = "swaggerDataStore";

// 打开数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 存储数据
function storeData(data) {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put(data, "swaggerData"); // 使用 'swaggerData' 作为键
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  });
}

// 获取数据
export function getData() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("swaggerData");

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

// 清除数据
function clearData() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete("swaggerData"); // 删除存储的数据
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  });
}

// 注册
const swaggerInstall = async (swaggerUrl) => {
  if (!swaggerUrl) return Promise.reject(new Error("Swagger URL is required.")); // 检查 Swagger URL

  // 尝试从 IndexedDB 获取 Swagger 数据
  const cachedData = await getData();
  if (cachedData) {
    consoleTooltip();
    return Promise.resolve(cachedData); // 返回已解析的 Promise
  } else {
    // 如果没有缓存数据，重新请求 Swagger 数据
    try {
      showLoading();
      const client = await SwaggerClient(swaggerUrl);
      const swaggerData = client.spec; // 获取 Swagger 数据
      await storeData(swaggerData); // 缓存数据到 IndexedDB
      hideLoading();
      consoleTooltip();
      return Promise.resolve(swaggerData); // 返回已解析的 Promise
    } catch (error) {
      hideLoading();
      console.error("获取 Swagger 数据失败:", error);
      return Promise.reject(error); // 返回拒绝的 Promise
    }
  }
};
// 销毁
const swaggerUnload = async function () {
  await clearData(); // 清空 IndexedDB 中的缓存数据
};

const components = [OlTable, OlSearch, Dialog];

// 自定义加载指示器
function showLoading() {
  // 创建样式
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
  loadingDiv.style.display = "flex"; // 使用 flexbox
  loadingDiv.style.flexDirection = "column"; // 设置为上下排列
  loadingDiv.style.justifyContent = "center"; // 垂直居中
  loadingDiv.style.alignItems = "center"; // 水平居中

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

const install = async function (Vue) {
  // 遍历所有组件
  components.map((item) => {
    Vue.component(`ol-${item.name}`, item);
  });
  consoleTooltip();
};

// 判断是否引入文件
export default install; //全局导入
export { OlTable, OlSearch, Dialog }; //按需导入
export { swaggerInstall, swaggerUnload };
