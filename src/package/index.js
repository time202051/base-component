import OlTable from "./table";
import OlSearch from "./formSearch";
import Dialog from "./dialog";

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

const components = [OlTable, OlSearch, Dialog];

const install = function (Vue) {
  // 遍历所有组件
  components.map((item) => {
    Vue.component(`ol-${item.name}`, item);
  });
  consoleTooltip();
};

// 判断是否引入文件
export default {
  install,
  ...components,
};
