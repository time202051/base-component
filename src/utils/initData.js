import { getData } from "../package/index.js";
// java数据类型转成js数据类型
const javaTypeToJsType = javaType => {
  switch (javaType) {
    case "integer":
      return "number";
    case "array":
      return "Array";
    case "object":
      return "Object";
    default:
      return javaType;
  }
};

const javaTypeToformType = javaType => {
  switch (javaType) {
    case "integer":
      return "number";
    case "boolean":
      return "switch";
    case "string":
      return "input";
    default:
      return javaType;
  }
};

export const initForm = options => {
  const { url, form } = options;
  getData().then(swaggerData => {
    const entity = swaggerData.paths[url].post;
    // 添加title
    // if (!form.title) form.title = entity.summary;
    const schema = entity.requestBody.content["application/json"].schema;
    const properties = schema.properties;
    // 生成model
    // 1.循环model，将properties中prop相同的匹配，属性合并，model权限大，properties权限小，且保持响应式
    form.model.forEach(item => {
      const property = properties[item.prop];
      if (property) {
        Object.assign(item, {
          prop: item.prop,
          label: property.description,
          type: javaTypeToformType(property.type),
          hidden: false,
          listeners: () => {},
          props: {},
          ...item,
        });
      }
    });
    //  2.将properties都push到model中（只提取swagger中有的type和description）
    Object.keys(properties).forEach(key => {
      const property = properties[key];
      if (!form.model.find(item => item.prop == key) && property.description) {
        // 删除对象的某些属性
        const temp = {
          prop: key,
          label: property.description,
          type: javaTypeToformType(property.type),
          hidden: false,
          listeners: () => {},
          props: {},
        };
        form.model.push(temp);
      }
    });

    // 校验规则
    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach(item => {
        if (!Object.keys(form.rules).includes(item)) {
          form.rules[item] = [
            {
              required: true,
              message: `${properties[item].description}不能为空`,
            },
          ];
        }
      });
    }
  });
};
