import OlTable from "./table";

const components = [OlTable];

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
