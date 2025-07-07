import OlTable from "./table";
import OlSearch from "./formSearch";
import Dialog from "./dialog";

const components = [OlTable, OlSearch, Dialog];

const install = function (Vue) {
  // 遍历所有组件
  components.map((item) => {
    Vue.component(`ol-${item.name}`, item);
  });
};
// 判断是否引入文件
export default {
  install,
  ...components,
};
