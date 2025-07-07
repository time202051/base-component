import OlTable from "./table";

const components = [OlTable];

const install = function (Vue) {
  // 判断是否安装
  if (install.installed) {
    return;
  }
  // 遍历所有组件
  components.map((item) => {
    Vue.component(item.name, item);
  });
};
// 判断是否引入文件
if (typeof window !== "undefined" && window.Vue) {
  install(window.Vue);
}
export default {
  install,
  ...components,
};
