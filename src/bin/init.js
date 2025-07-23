const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const vue2Template = require("./initTemplate");
const program = new Command();

program
  .version("0.1.0")
  .argument("<moduleName>", "name of the module to create")
  .option("-p, --path <customPath>", "custom path to create the module")
  .action((moduleName, options) => {
    const dir = path.join(options.path || process.cwd(), moduleName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      console.log(`创建文件夹: ${dir}`);
      const templateContent = vue2Template(moduleName);
      fs.writeFileSync(path.join(dir, `${moduleName}.vue`), templateContent);
      console.log(`创建文件: ${moduleName}.vue`);
    } else {
      console.log(`创建失败，文件夹 ${dir} 已存在`);
    }
    if (options.debug) {
      console.log("调试信息:", options);
    }
  });

program.parse(process.argv);
