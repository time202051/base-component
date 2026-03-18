<template>
  <ol-search
    :form-search-data="formSearchData"
    @onSave="onSave"
    v-bind="$attrs"
    v-on="$listeners"
    :key="key"
  />
</template>

<script>
export default {
  name: "customSearch",
  props: {
    formSearchData: {
      type: Object,
      default: () => {
        return {
          buttonData: [],
          rules: {},
          value: {},
          tableSearchSlice: 4, // 默认为展开4当出现特色情况可以自行设置
          // 循环的各种组件
          tableSearch: [],
          // 表格框架各种样式
          options: {},
          reset: false, // 是否要重置
          enableConfig: false, // 是否启用配置功能
          customs: [],
        };
      },
    },
  },
  data() {
    return {
      currentPageItem: {},
      key: 0,
    };
  },

  mounted() {
    this.init();
  },
  methods: {
    init() {
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

      this.get({
        url: `/api/app/menu-search-setting/by-menu`,
        data: {
          sysMenuId: this.currentPageItem && this.currentPageItem.id,
        },
      }).then(res => {
        if (res.code !== 200) return;
        const configList = res.result.settingJson ? JSON.parse(res.result.settingJson) : [];
        this.formSearchData.tableSearch = configList;
        this.key++;
      });
    },
    //保存
    onSave(configList) {
      this.post({
        url: `/api/app/menu-search-setting`,
        data: {
          sysMenuId: this.currentPageItem && this.currentPageItem.id,
          settingJson: JSON.stringify(configList),
        },
      }).then(res => {
        if (res.code !== 200) return;
        this.$message.success("保存成功");
      });

      console.log("保存配置数据", configList);
    },
  },
};
</script>

<style lang="scss" scoped></style>
