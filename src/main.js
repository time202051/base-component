import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";
import OlCom, { swaggerInstall } from "@/package/index.js";
Vue.use(ElementUI);

Vue.use(OlCom);
swaggerInstall("http://220.179.249.140:20019/swagger/v1/swagger.json").then(
  () => {}
);
new Vue({
  render: (h) => h(App),
}).$mount("#app");
