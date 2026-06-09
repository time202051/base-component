---
name: 组件库本地发布
description: |
  组件库 ol-base-components 开发工作流。在 D:\ljp-github\base-component 项目中修改代码后，
  自动执行 `npm run build` 构建项目，然后 `yalc push` 推送到本地 yalc 仓库，让测试项目能
  通过 `yalc update` 立即同步最新代码。当用户要求在 base-component、ol-base-components、
  ol-curd 或任何 ol- 开头的组件中修改、新增、修复代码时，必须使用此技能。每次 Claude 在
  该项目中编辑文件后，无需等待用户提醒，自动执行构建和推送。
---

# Yalc Publish - 组件库本地发布

## 项目信息

| 项目 | 路径 | 包名 |
|------|------|------|
| 组件库 | `D:\ljp-github\base-component` | `ol-base-components` |

- **构建命令**: `npm run build`（vite build，输出到 `dist/`）
- **发布命令**: `yalc push`（推送到 yalc 本地仓库）

## 工作流程

当 Claude 在组件库项目中**修改了文件**后，自动执行以下步骤：

### 1. 先完成代码修改
按用户要求完成所有编辑、新增、删除操作。

### 2. 构建项目
```bash
cd D:\ljp-github\base-component && npm run build
```
- ✅ 构建成功 → 继续第 3 步
- ❌ 构建失败 → 向用户报告错误，**停止**，不执行 yalc push

### 3. 推送到 yalc
```bash
cd D:\ljp-github\base-component && yalc push
```
- 更新 yalc 本地仓库
- 报告推送结果：包名、版本号

### 4. 告知用户
总结操作结果，提醒用户在测试项目中执行 `yalc update` 拉取最新代码。

## 关键规则

- **只有 Claude 修改了文件才构建** — 如果只是回答问题或查看代码，跳过构建
- **先构建再推送** — 绝不跳过构建步骤
- **构建失败即停止** — 不要推送有问题的代码
- **固定路径** — 始终使用 `D:\ljp-github\base-component`，不依赖当前工作目录
