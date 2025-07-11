import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";

import olCom, { Swagger, SwaggerHandler } from "@/package/index.js";

Vue.use(olCom);
SwaggerHandler(Vue)
// Vue.config.productionTip = false;
Vue.use(ElementUI);

setTimeout(() => {
  new Vue({
    render: (h) => h(App),
  }).$mount("#app");
}, 20000);
