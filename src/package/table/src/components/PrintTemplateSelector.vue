<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <img
      src="../../../../assets/icon/printModel.svg"
      alt="print"
      style="width: 14px; height: 14px; cursor: pointer"
    />
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        v-for="(item, index) in templateList"
        :key="index"
        :command="item.id"
        :disabled="item.disabled"
      >
        {{ item.templeteName || "-" }}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  name: "dropdown-print",
  props: {
    menuId: {
      type: String,
      default: "",
    },
    printData: {
      type: [Object, Array],
      default: () => {},
    },
    // 自定义获取打印数据函数，没传递就是默认接口获取数据。return的数据就是打印数据
    onPrintData: {
      type: Function,
      default: null,
    },
    multipleSelection: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      templateList: [{ id: 1, templeteName: "暂无数据", disabled: true }],
      // templateList: [
      //   {
      //     id: 1,
      //     templeteName: "自定义模式",
      //     remark: "",
      //     templeteJson:
      //       '{"panels":[{"index":0,"name":1,"paperType":"A4","height":297,"width":210,"paperHeader":0,"paperFooter":841.8897637795277,"printElements":[{"options":{"left":67.5,"top":165,"height":36,"width":550,"fields":[],"field":"table","qid":"table","columns":[[{"width":137.5,"title":"名称","field":"name","checked":true,"columnId":"name","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"性别","field":"gender","checked":true,"columnId":"gender","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"数量","field":"count","checked":true,"columnId":"count","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"金额","field":"amount","checked":true,"columnId":"amount","fixed":false,"rowspan":1,"colspan":1,"align":"center"}]]},"printElementType":{"title":"表格","type":"table","editable":true,"columnDisplayEditable":true,"columnDisplayIndexEditable":true,"columnTitleEditable":true,"columnResizable":true,"columnAlignEditable":true,"isEnableEditField":true,"isEnableContextMenu":true,"isEnableInsertRow":true,"isEnableDeleteRow":true,"isEnableInsertColumn":true,"isEnableDeleteColumn":true,"isEnableMergeCell":true}},{"options":{"left":127.5,"top":301.5,"height":9.75,"width":120,"field":"name","testData":"内容","title":"文本","qid":"name"},"printElementType":{"title":"文本","type":"text"}}],"paperNumberContinue":true,"watermarkOptions":{},"panelLayoutOptions":{}}]}',
      //     sourceUrl: "api/app/aaa",
      //   },
      //   {
      //     id: 2,
      //     templeteName: "sourceUrl模式",
      //     remark: "",
      //     templeteJson:
      //       '{"panels":[{"index":0,"name":1,"paperType":"A4","height":297,"width":210,"paperHeader":0,"paperFooter":841.8897637795277,"printElements":[{"options":{"left":67.5,"top":229.5,"height":36,"width":550,"fields":[],"field":"table","qid":"table","columns":[[{"width":137.5,"title":"名称","field":"name","checked":true,"columnId":"name","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"性别","field":"gender","checked":true,"columnId":"gender","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"数量","field":"count","checked":true,"columnId":"count","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"金额","field":"amount","checked":true,"columnId":"amount","fixed":false,"rowspan":1,"colspan":1,"align":"center"}]]},"printElementType":{"title":"表格","type":"table","editable":true,"columnDisplayEditable":true,"columnDisplayIndexEditable":true,"columnTitleEditable":true,"columnResizable":true,"columnAlignEditable":true,"isEnableEditField":true,"isEnableContextMenu":true,"isEnableInsertRow":true,"isEnableDeleteRow":true,"isEnableInsertColumn":true,"isEnableDeleteColumn":true,"isEnableMergeCell":true}},{"options":{"left":247.5,"top":304.5,"height":9.75,"width":120,"field":"name","testData":"内容","title":"文本","qid":"name"},"printElementType":{"title":"文本","type":"text"}},{"options":{"left":79.5,"top":313.5,"height":32,"width":120,"field":"qrcode","testData":"XS888888888","fontSize":12,"lineHeight":18,"textType":"qrcode","title":"二维码","qid":"qrcode"},"printElementType":{"title":"二维码","type":"text"}}],"paperNumberContinue":true,"watermarkOptions":{},"panelLayoutOptions":{}}]}',
      //     sourceUrl: "api/app/bbb",
      //   },
      //   {
      //     id: 3,
      //     templeteName: "默认模式",
      //     remark: "",
      //     templeteJson:
      //       '{"panels":[{"index":0,"name":1,"paperType":"A4","height":297,"width":210,"paperHeader":0,"paperFooter":841.8897637795277,"printElements":[{"options":{"left":67.5,"top":229.5,"height":36,"width":550,"fields":[],"field":"table","qid":"table","columns":[[{"width":137.5,"title":"名称","field":"name","checked":true,"columnId":"name","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"性别","field":"gender","checked":true,"columnId":"gender","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"数量","field":"count","checked":true,"columnId":"count","fixed":false,"rowspan":1,"colspan":1,"align":"center"},{"width":137.5,"title":"金额","field":"amount","checked":true,"columnId":"amount","fixed":false,"rowspan":1,"colspan":1,"align":"center"}]]},"printElementType":{"title":"表格","type":"table","editable":true,"columnDisplayEditable":true,"columnDisplayIndexEditable":true,"columnTitleEditable":true,"columnResizable":true,"columnAlignEditable":true,"isEnableEditField":true,"isEnableContextMenu":true,"isEnableInsertRow":true,"isEnableDeleteRow":true,"isEnableInsertColumn":true,"isEnableDeleteColumn":true,"isEnableMergeCell":true}},{"options":{"left":247.5,"top":304.5,"height":9.75,"width":120,"field":"name","testData":"内容","title":"文本","qid":"name"},"printElementType":{"title":"文本","type":"text"}},{"options":{"left":79.5,"top":313.5,"height":32,"width":120,"field":"qrcode","testData":"XS888888888","fontSize":12,"lineHeight":18,"textType":"qrcode","title":"二维码","qid":"qrcode"},"printElementType":{"title":"二维码","type":"text"}}],"paperNumberContinue":true,"watermarkOptions":{},"panelLayoutOptions":{}}]}',
      //     sourceUrl: "",
      //   },
      // ],
    };
  },
  created() {
    this.getPrintTemplateList();
  },
  methods: {
    async getPrintTemplateList() {
      const handleMenu = (arr, _this) => {
        for (const item of arr) {
          if (item.path === _this.$route.path) {
            return item;
          }
          if (item.child && item.child.length > 0 && item.type !== 1) {
            const found = handleMenu(item.child, _this);
            if (found) return found;
          }
        }
        return null;
      };
      let wms = JSON.parse(localStorage.getItem("wms"));
      let SET_MENUS = null;
      if (wms) SET_MENUS = wms.SET_MENUS;
      const menus = SET_MENUS;
      this.currentPageItem = handleMenu(menus, this);

      const targetMenuId = this.menuId || (this.currentPageItem && this.currentPageItem.id);

      try {
        const res = await this.get({
          url: "/api/app/print-templete/page-list",
          data: {
            MenuId: targetMenuId,
            page: 1,
            MaxResultCount: 1000,
          },
        });
        if (Array.isArray(res.result?.items) && res.result.items.length > 0) {
          this.templateList = res.result.items;
        } else {
          this.templateList = [{ id: 1, templeteName: "暂无数据", disabled: true }];
        }
      } catch (error) {
        console.error("加载模板列表失败:", error);
      }
    },
    handleCommand(command) {
      if (!Array.isArray(this.templateList)) return;
      const tempItem = this.templateList.find(item => item.id === command);
      if (!tempItem) return this.$message.error("未找到打印模板");

      const options = {
        printData: this.printData || {},
        defaultTemplate: tempItem.templeteJson ? JSON.parse(tempItem.templeteJson) : {},
      };

      // 自定义打印 > 默认接口打印 >  printData数据打印
      if (this.onPrintData) {
        // 自定义数据 - 类似 Element UI before-close 机制
        let isCustomHandled = false;
        // 定义 done 函数
        const done = data => {
          isCustomHandled = true;
          if (data) {
            options.printData = data;
            this.$hiprint.print(options);
          } else {
            this.$message.error("打印数据不能为空");
          }
        };

        // 调用自定义回调，传入模板信息和 done 函数
        this.onPrintData(tempItem, done);

        // 如果自定义回调没有调用 done，则走默认逻辑
        if (!isCustomHandled) {
          if (tempItem.sourceUrl) {
            this.printByApi(options, tempItem);
          } else {
            // 没有自定义回调，走默认逻辑
            options.printData = this.printData || {};
            this.$hiprint.print(options);
          }
        }
      } else if (tempItem.sourceUrl) {
        this.printByApi(options, tempItem);
      } else {
        this.printDefault(options);
      }
    },
    printByApi(options, tempItem) {
      // 默认接口数据
      options.printData = this.getPrintDataByApi(tempItem);
      const isValidData =
        options.printData &&
        ((Array.isArray(options.printData) && options.printData.length > 0) ||
          (typeof options.printData === "object" && Object.keys(options.printData).length > 0));

      if (!isValidData) {
        return this.$message.error("打印数据不能为空");
      }
      this.$hiprint.print(options);
    },
    printDefault(options) {
      // 默认接口数据
      options.printData = this.printData || {};
      this.$hiprint.print(options);
    },
    // 默认接口获取数据
    async getPrintDataByApi(tempItem) {
      try {
        let ids = [];
        if (this.multipleSelection && this.multipleSelection.length > 0) {
          ids = this.multipleSelection.reduce((acc, item) => {
            acc.push(item.id);
            return acc;
          }, []);
        }
        const res = await this.get({
          url: `${tempItem.sourceUrl}`,
          data: {
            ids: ids,
          },
        });
        if (res.code !== 200) return {};
        if (Array.isArray(res.result) && res.result.length > 0) return res.result;
        return {};
      } catch (error) {
        console.error(`获取打印数据失败: ${tempItem.sourceUrl}`, error);
      }
    },
  },
};
</script>

<style scoped>
.print-template-selector {
  display: inline-block;
}
</style>
