import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";
import OldCom from "@/package/table/index";

import Aaa from "@/package/index.js";
Vue.use(Aaa);
Vue.config.productionTip = false;
Vue.use(ElementUI);
Vue.use(OldCom);
new Vue({
  render: (h) => h(App),
}).$mount("#app");
