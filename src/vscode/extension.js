const vscode = require("vscode");
const { GeneratorPanel } = require("./webview/panel");

function activate(context) {
  console.log("🎉 Vue 页面生成器扩展已激活！");

  // 显示通知确认扩展已激活
  vscode.window.showInformationMessage("Vue 页面生成器扩展已激活！");

  // 注册右键菜单命令 （registerCommand就是注册命令，第一个参数是名称，第二个就是具体逻辑）
  const disposable = vscode.commands.registerCommand("vue-generator.createPage", uri => {
    console.log("命令被调用，URI:", uri);
    vscode.window.showInformationMessage("生成 Vue 页面命令被调用！"); //右下角会弹出的信息
    GeneratorPanel.createOrShow(context.extensionUri, uri);
  });

  //subscriptions是vscode的所有命令的一个注册列表
  context.subscriptions.push(disposable);

  // 注册一个测试命令
  const testDisposable = vscode.commands.registerCommand("vue-generator.test", () => {
    vscode.window.showInformationMessage("Vue 页面生成器测试命令工作正常！");
  });

  context.subscriptions.push(testDisposable);
}

function deactivate() {
  console.log("Vue 页面生成器扩展已停用");
}

module.exports = {
  activate,
  deactivate,
};
