const vscode = require("vscode");
const { GeneratorPanel } = require("./webview/panel");

function activate(context) {
  console.log("🎉 Vue 页面生成器扩展已激活！");

  // 显示通知确认扩展已激活
  vscode.window.showInformationMessage("Vue 页面生成器扩展已激活！");

  // 注册右键菜单命令
  const disposable = vscode.commands.registerCommand("vue-generator.createPage", uri => {
    console.log("命令被调用，URI:", uri);
    vscode.window.showInformationMessage("生成 Vue 页面命令被调用！");
    GeneratorPanel.createOrShow(context.extensionUri, uri);
  });

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
