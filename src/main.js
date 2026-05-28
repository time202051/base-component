import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";
import OlCom, { swaggerInstall, Hiprint } from "@/package/index.js";
Vue.use(ElementUI);
Vue.use(Hiprint);

Vue.use(OlCom, { method: "post", smartPrintBtn: true });
swaggerInstall("http://220.179.249.140:20025/swagger/v1/swagger.json").then(() => {});
new Vue({
  render: h => h(App),
}).$mount("#app");
