const vscode = require("vscode");
const { GeneratorPanel } = require("./webview/panel");

function activate(context) {
  console.log("Vue Page Generator is now active!");

  // 注册右键菜单命令
  const disposable = vscode.commands.registerCommand("vue-generator.createPage", uri => {
    GeneratorPanel.createOrShow(context.extensionUri, uri);
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
