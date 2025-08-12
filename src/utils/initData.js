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

// 弹框接口数据来源判断 优先级：新增接口>编辑接口>详情接口
const getDialogSwaggerData = (url, swaggerData) => {
  try {
    // 新增 post
    const entity = swaggerData.paths[url].post;
    const schema = entity.requestBody.content["application/json"].schema;
    const properties = schema.properties;

    return [schema, properties];
  } catch (err) {
    try {
      //编辑 put
      const entity = swaggerData.paths[url].put;
      const schema = entity.requestBody.content["application/json"].schema;
      const properties = schema.properties;
      return [schema, properties];
    } catch (err) {
      // 详情 get
      const entity = swaggerData.paths[url].get;
      const schema = entity.responses[200].content["application/json"].schema;
      const properties = schema.properties;
      return [schema, properties];
    }
  }
};

export const initForm = options => {
  const { url, form } = options;
  getData().then(swaggerData => {
    // swagger数据可以来源于，新增接口/编辑接口/详情接口（优先级：新增接口>编辑接口>详情接口）
    const [schema, properties] = getDialogSwaggerData(url, swaggerData);
    if (!schema || !properties) return console.log(`\x1b[36m\x1b[4mol插件-弹框数据异常`);
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
