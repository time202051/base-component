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
const LOGIN_STATUS_KEY = "isLoggedIn"; // 存储登录状态的键

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
function getData() {
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

// 存储登录状态
function storeLoginStatus(isLoggedIn) {
  localStorage.setItem(LOGIN_STATUS_KEY, isLoggedIn);
}

// 获取登录状态
function getLoginStatus() {
  return localStorage.getItem(LOGIN_STATUS_KEY) === "true";
}

export const SwaggerHandler = async (Vue, swaggerUrl) => {
  const client = await new SwaggerClient(swaggerUrl);
  console.log("client", client);
  Vue.prototype.$swagger = { specification: client.spec };
};

const components = [OlTable, OlSearch, Dialog];

const SWAGGER_DATA_KEY = "swaggerData"; // 存储 Swagger 数据的键
let isLoggedIn = false; // 用于跟踪用户登录状态

const install = async function (
  Vue,
  options = {
    swaggerUrl: "",
    successSwaggerCallback: null,
  }
) {
  // 遍历所有组件
  components.map((item) => {
    Vue.component(`ol-${item.name}`, item);
  });

  // 检查登录状态
  const isLoggedIn = getLoginStatus();

  // 如果 $swagger 已经存在，直接返回
  if (Vue.prototype.$swagger) {
    if (
      options.successSwaggerCallback &&
      typeof options.successSwaggerCallback === "function"
    ) {
      options.successSwaggerCallback();
    }
    return; // 数据已加载，直接返回
  }

  if (options && options.swaggerUrl) {
    // 检查 IndexedDB 中是否存在 Swagger 数据
    if (isLoggedIn) {
      try {
        const cachedData = await getData();
        if (cachedData) {
          Vue.prototype.$swagger = { specification: cachedData };
          if (
            options.successSwaggerCallback &&
            typeof options.successSwaggerCallback === "function"
          ) {
            options.successSwaggerCallback();
          }
          return; // 数据已加载，直接返回
        }
      } catch (error) {
        console.error("获取缓存数据失败:", error);
      }
    }

    // 用户未登录或缓存数据不存在，重新请求 Swagger 数据
    try {
      const client = await SwaggerClient(options.swaggerUrl);
      const swaggerData = client.spec; // 获取 Swagger 数据
      await storeData(swaggerData); // 缓存数据到 IndexedDB
      Vue.prototype.$swagger = { specification: swaggerData };
      storeLoginStatus(true); // 设置用户为已登录状态
      if (
        options.successSwaggerCallback &&
        typeof options.successSwaggerCallback === "function"
      ) {
        options.successSwaggerCallback();
      }
    } catch (error) {
      console.error("获取 Swagger 数据失败:", error);
    }
  }
  consoleTooltip();
};

// 提供一个方法用于用户退出登录时调用
export const OlLogout = async function () {
  // 重置登录状态
  storeLoginStatus(false); // 清除 localStorage 中的登录状态
  await clearData(); // 清空 IndexedDB 中的缓存数据
  Vue.prototype.$swagger = null; // 清空 Swagger 数据
};

// 判断是否引入文件
export default install; //全局导入
export { OlTable, OlSearch, Dialog }; //按需导入
