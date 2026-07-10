<template>
  <ol-search
    :key="key"
    :form-search-data="formSearchData"
    isCustomSearch
    v-bind="$attrs"
    @onSave="onSave"
    :method="finalMethod"
    v-on="$listeners"
    ref="customSearchRef"
    :byMenuData="byMenuData"
    dragable
    @resetAllConfig="resetAllConfig"
  />
</template>

<script>
export default {
  name: "customSearch",
  props: {
    // menuId: {
    //   type: String,
    //   default: "",
    // },
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
    // 请求方式 post get
    method: {
      type: String,
    },
    // 前端写死的搜索字段配置，会与接口返回的配置合并（同名字段前端优先）
    frontSearchData: {
      type: Array,
      default: () => [],
    },
    // 前端写死的默认搜索值，优先级高于接口返回的默认值
    frontDefaultValue: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      currentPageItem: {},
      key: 0,
      byMenuData: null,
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },
  computed: {
    // 优先级：props > 全局配置 > 默认值
    finalMethod() {
      return this.method || (this.$olBaseConfig && this.$olBaseConfig.method) || "get";
    },
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

      const targetMenuId =
        this.$attrs.menuId ||
        this.$route.query.menuId ||
        (this.currentPageItem && this.currentPageItem.id);

      this.get({
        url: `/api/app/menu-search-setting/by-menu`,
        data: {
          sysMenuId: targetMenuId,
        },
      }).then(async res => {
        if (res.code !== 200) return;
        this.byMenuData = res.result;
        const configList = res.result.settingJson ? JSON.parse(res.result.settingJson) : [];
        // 合并搜索字段配置：formSearchData.tableSearch + frontSearchData 优先，接口返回的补充
        // 前端追加的搜索条件标记为 isFrontAppend，不参与配置弹框编辑
        const localTableSearch = [
          ...(this.formSearchData.tableSearch || []),
          ...this.frontSearchData.map(item => ({ ...item, isFrontAppend: true })),
        ];
        const tableSearchMap = new Map();
        localTableSearch.forEach(item => {
          if (item.value) tableSearchMap.set(item.value, item);
        });
        configList.forEach(item => {
          if (item.value && !tableSearchMap.has(item.value)) {
            tableSearchMap.set(item.value, item);
          }
        });
        const mergedTableSearch = Array.from(tableSearchMap.values());
        this.$set(this.formSearchData, "tableSearch", mergedTableSearch);

        // 合并默认搜索值：formSearchData.value / frontDefaultValue 优先级最高，接口默认值不覆盖
        let hasDefaultFilter = false;
        const defaultValue = { ...(this.formSearchData.value || {}), ...this.frontDefaultValue };

        // 解析并回显默认搜索条件
        if (res.result.defaultFilterJson) {
          try {
            const { filterConditions: defaultFilters, compareMap } = JSON.parse(
              res.result.defaultFilterJson
            );
            if (defaultFilters) {
              this.$set(this.formSearchData, "filterConditions", defaultFilters);
              defaultFilters.forEach(item => {
                if (item.values && item.values.length > 0) {
                  // 接口默认值不覆盖前端写死的默认值
                  if (!(item.key in defaultValue)) {
                    defaultValue[item.key] =
                      item.values.length === 1 ? item.values[0] : item.values;
                  }
                }
              });
            }

            if (compareMap) this.$refs.customSearchRef.compareMap = compareMap;
          } catch (e) {
            console.error("defaultFilterJson 解析失败:", e);
          }
        }

        this.$set(this.formSearchData, "value", defaultValue);
        hasDefaultFilter = Object.keys(defaultValue).length > 0;

        await this.$refs.customSearchRef.init();

        // 如果有默认搜索条件，自动触发一次查询
        if (hasDefaultFilter) {
          this.$nextTick(() => {
            this.$refs.customSearchRef.handleSearch("formSearch");
          });
        }

        // this.$nextTick(() => {
        //   this.key++;
        // });
      });
    },
    //保存
    onSave(configList) {
      const targetMenuId =
        this.$attrs.menuId ||
        this.$route.query.menuId ||
        (this.currentPageItem && this.currentPageItem.id);
      let defaultFilter = {};
      // configList.forEach(item => {
      // });
      this.post({
        url: `/api/app/menu-search-setting`,
        data: {
          sysMenuId: targetMenuId,
          settingJson: JSON.stringify(configList),
        },
      }).then(res => {
        if (res.code !== 200) return;
        this.$message.success("保存成功");
        this.init();
        console.log("保存配置数据", configList);
      });
    },
    resetAllConfig() {
      this.key++;
      this.formSearchData.tableSearch = [];
      this.formSearchData.options = [];
      this.init();
    },
  },
};
</script>

<style lang="scss" scoped></style>
