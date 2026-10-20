本目录的 agent-local.zip 是「本地数据库查询服务」安装包，供 <ol-agent-chat/> 组件
在用户电脑未安装服务时提示下载。

用途
- 开发/演示：Vite / vue-cli 开发服务器会把 public/ 映射到站点根目录，
  所以 /download/agent-local.zip 可直接下载（组件里 downloadUrl 默认就配这个）。
- 生产：把 agent-local.zip 部署到后台管理站点的静态目录，
  并让组件配置 agentChat.downloadUrl 指向它。

注意
- 本目录属于 public/，构建时会被拷进 dist/；已在 package.json 的 build 脚本里
  加了 scripts/clean-dist-demo.cjs，构建后会自动删除 dist/download，避免 npm 包过大。
- 因此 npm 发布的包里不包含此 zip，需要单独托管。

如何更新
1. 在 agent-local 目录执行：npm run release
2. 把生成的 release/agent-local.zip 覆盖到本目录。
