// index.js
import SwaggerClient from "swagger-client";
// 创建一个新的列数组
class Swagger {
  constructor(swaggerUrl, options = {}) {
    this.swaggerUrl = swaggerUrl;
    this.options = options;
    // this.apis = {};
    this.specification = {}; // swagger规范
    this.init();
  }

  async init() {
    const client = await SwaggerClient({
      url: this.swaggerUrl,
    });
    this.specification = client.spec;
  }
}

export default Swagger;
