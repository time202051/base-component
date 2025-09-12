告别手写CRUD！命令行方式通过swagger实现一键生成页面
> 还在为重复的增删改查页面而烦恼？还在手动联调接口和组件？今天给大家分享一个革命性的Vue组件库，通过命令行方式实现快速页面生成，让你的开发效率提升10倍！

## 💡 项目背景

作为一名前端开发者，你是否经常遇到这样的场景：

- 接到新需求，又要写一套完整的CRUD页面
- 重复编写表格、表单、搜索框等基础组件
- 手动联调接口，调试各种数据格式问题
- ⏰ 一个简单的管理页面要花半天时间

如果你也有这些困扰，那么今天分享的这个项目绝对能让你眼前一亮！

## 🌟 项目介绍

**ol-base-components** 是一个基于 Element-UI 的企业级开发框架，最大的特色是**交互式命令行方式自动生成完整页面**，无需手动联调，几秒完成页面。

## 快速开始

### 安装

#### 方式一：npm 安装（推荐）
```bash
# 安装组件库
npm install ol-base-components

# 安装依赖
npm install swagger-client@3.0.1
```
### 基本使用

#### 安装
```javascript
// main.js
import Vue from "vue";
import App from "./App.vue";
import OlBaseComponents from "ol-base-components"; // 导入组件库

// 使用组件库
Vue.use(OlBaseComponents);

// 安装，可以在登录后调用
import { swaggerInstall } from "ol-base-components";
swaggerInstall("http://192.168.xxx.xxx:20019/swagger/v1/swagger.json").then(() => {
  // 成功获取swagger数据后加载页面，这里可以写登录接口成功后执行的逻辑
});

// 卸载
import { swaggerUnload } from "ol-base-components";
swaggerUnload();
```

### 生成页面

#### 1. 生成API接口
```bash
# 基本用法
npx init http://192.168.xxx.xxx:20019

# 自定义输出路径
npx api http://192.168.xxx.xxx:20019 src/api/swagger.js
```

#### 2. 生成页面组件
```bash
# 基本用法
npx add userManagement -p src/view

# 完整参数
npx add userManagement -p src/view \
  -u /api/user/paged-result \
  -e /api/user/export \
  -m User
```

## 核心亮点：命令行快速生成

### 1. 一键生成API接口

```bash
# 从Swagger自动生成API接口
npx init http://192.168.xxx.xxx:20019
```

这个命令会：
- 自动获取Swagger文档
- 自动生成完整的API接口文件
- 包含详细的JSDoc注释
- 自动处理接口参数和返回值


![run.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/8acc65eed01247588bb81775897209c1~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=rR9UsX5SyxXhGOl2RvfFhYdh%2Fhs%3D)

![api.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/882511142db942c3951f75467db492f6~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=Jb2y66QqYKVuw6FLCLIKvcVko%2BY%3D)
### 2. 交互式页面生成

```bash
# 交互式生成完整CRUD页面
npx add userManagement -p src/view
```

运行后会弹出交互式配置：
- 📋 选择需要的功能（新增、编辑、删除、详情）
- 配置接口地址
- ⚙️ 设置字段映射
- 自动生成完整的Vue组件

#### 效果如下
![effectPicture.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/da3a7b5b10784e8aa365695010c8a3f9~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=pzKlXLC7rAA9kmSkUIcE4x6SvWo%3D)


![init.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/a52f1a66540d43aeabe5d67b2f5b135c~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=ggypHhBD0HsuejMBlrznimoQ6Vk%3D)



## 🛠️ 技术实现

### 核心架构

项目采用模块化设计，主要包含：

1. **组件库**：基于Element-UI二次封装
2. **命令行工具**：Node.js脚本自动生成代码
3. **Swagger集成**：自动解析API文档
4. **模板引擎**：动态生成Vue组件代码

## 搭配vscode插件  vue-page-generator
为[ol-base-components](https://github.com/time202051/base-component)写的一个 VSCode 插件。取代之前命令行方式，通过可视化的交互方式更加简单方便的自动生成 CRUD 页面模板。

### 安装
在 VSCode 扩展商店中搜索"vue-page-generator"并安装

### 使用方法
1. 在 VSCode 文件资源管理器中右键选择一个文件夹
2. 选择 "生成 CRUD 页面" 菜单项
3. 在弹出的配置面板中填写相关信息
4. 点击 "🚀 生成页面" 按钮


### 步骤效果图
![generator0.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/10e05b492b294a638d89d440d082c2df~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=uFgUAHfEA0Ut9zjcfZobbBEBwjM%3D)

![generator1.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/3e70349e19464390a291272e810abd0c~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=GWuC1pjZlEmb8N0SnA%2Fx1HCnB%2BQ%3D)

![generator2.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/2483f171137e4ea88e6a822dc5a82e51~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=%2BdKxpOHGP2g5nifHaBb1qe%2BJyU8%3D)

![generator3.png](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/2ad9ffc9acd444798c1768521a2050bc~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAg6IWw6Ze055uY56qB5Ye655qE57qi5Yip:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzIwNjYzODA5NzkzNDQ4NyJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1757470144&x-orig-sign=wq8FUrnsMZUjcAQpctbzKGuFWZw%3D)

## 🎯 总结

ol-base-components 通过创新的命令行生成方式和交互式方式，彻底改变了传统的前端开发模式：

- ✅ **告别重复劳动**：不再手写CRUD页面
- ✅ **提升开发效率**：从小时级到分钟级
- ✅ **降低维护成本**：标准化代码结构
- ✅ **减少联调时间**：自动处理接口对接

如果你也想体验这种革命性的开发方式，不妨试试这个项目。相信它会让你重新认识前端开发的效率边界！

---
### 如需了解更多可以查阅官网

**官网**：[https://time202051.github.io/baseCom.github.io/](https://time202051.github.io/baseCom.github.io/)