<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <img
      src="../../../../assets/print.svg"
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
  },
  data() {
    return {
      templateList: [{ id: 1, templeteName: "暂无数据", disabled: true }],
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

      const data = this.printData;
      const isValidData =
        data &&
        ((Array.isArray(data) && data.length > 0) ||
          (typeof data === "object" && Object.keys(data).length > 0));

      if (!isValidData) {
        return this.$message.error("打印数据不能为空");
      }

      this.$hiprint.print({
        printData: data,
        defaultTemplate: tempItem.templeteJson ? JSON.parse(tempItem.templeteJson) : {},
      });
    },
  },
};
</script>

<style scoped>
.print-template-selector {
  display: inline-block;
}
</style>
