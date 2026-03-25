<template>
  <el-dropdown @command="handleCommand" trigger="click">
    <i class="el-icon-printer" />
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
        this.templateList = res.result?.items || [
          { id: 1, templeteName: "暂无数据", disabled: true },
        ];
      } catch (error) {
        console.error("加载模板列表失败:", error);
      }
    },
    handleCommand(command) {
      if (!Array.isArray(this.templateList)) return;
      const tempItem = this.templateList.find(item => item.id === command);
      this.$hiprint.print({
        printData: this.tableData?.printData || {},
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
