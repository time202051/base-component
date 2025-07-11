import OlTable from "./table";
import OlSearch from "./formSearch";
import Dialog from "./dialog";
// import Swagger from "../utils/swagger";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
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

export const SwaggerHandler = async (Vue) => {
  const client = await new SwaggerClient(
    "http://220.179.249.140:20019/swagger/v1/swagger.json"
  );
  console.log("client", client);
  Vue.prototype.$swagger = { specification: client.spec };
};

const components = [OlTable, OlSearch, Dialog];

const install = function (
  Vue,
  options = {
    swaggerUrl: "",
  }
) {
  if (options && options.swaggerUrl) {
    // "http://220.179.249.140:20019/swagger/v1/swagger.json"
    const swaggerInstance = new Swagger(options.swaggerUrl);
    Vue.prototype.$swagger = swaggerInstance;
  }
  Vue.use(ElementUI);
  // 遍历所有组件
  components.map((item) => {
    Vue.component(`ol-${item.name}`, item);
  });

  consoleTooltip();
};

// 判断是否引入文件
export default install; //全局导入
export { OlTable, OlSearch, Dialog }; //按需导入
// export { Swagger };
