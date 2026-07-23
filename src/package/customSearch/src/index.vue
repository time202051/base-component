<template>
  <ol-search
    :key="key"
    :form-search-data="formSearchData"
    isCustomSearch
    v-bind="$attrs"
    :menuId="effectiveMenuId"
    @onSave="onSave"
    :method="finalMethod"
    v-on="$listeners"
    ref="customSearchRef"
    :byMenuData="byMenuData"
    dragable
    @resetAllConfig="resetAllConfig"
    @switchToAdminDefaultMode="switchMode('adminDefault')"
    @switchToNormalMode="switchMode('normal')"
    :adminDefaultConditions="adminDefaultConditions"
    :isDefaultFilterAdmin="isDefaultFilterAdmin"
    :searchMode="searchMode"
  />
</template>

<script>
import { convertSettingJson } from "../../formSearch/src/utils/index.js";
import { parseForcedFilter } from "./forcedFilter";
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
      byMenuData: {},
      searchMode: "normal", // 'normal' | 'adminDefault'
      adminDefaultConditions: [], // admin 配置的默认条件（非 admin 查询合并用）
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
    // 从全局配置读取当前用户是否可以管理默认查询条件（支持函数和布尔值）
    isDefaultFilterAdmin() {
      var val = this.$olBaseConfig && this.$olBaseConfig.isDefaultFilterAdmin;
      if (typeof val === "function") return val();
      return !!val;
    },
    // 根据当前模式返回有效的 menuId（B 模式加后缀）
    effectiveMenuId() {
      var base =
        this.$attrs.menuId ||
        this.$route.query.menuId ||
        (this.currentPageItem && this.currentPageItem.id) ||
        "";
      if (this.searchMode === "adminDefault" && base) {
        return base + "_admin_default_search";
      }
      return base;
    },
  },
  methods: {
    // 模式切换：A 模式（normal）↔ B 模式（adminDefault）
    switchMode(mode) {
      if (this.searchMode === mode) return;
      this.searchMode = mode;
      // 重置 formSearchData 数据，避免旧数据污染新模式
      this.formSearchData.tableSearch = [];
      this.formSearchData.value = {};
      this.byMenuData = {};
      this.key++;
      this.$nextTick(() => {
        this.init();
      });
    },
    async init() {
      var handleMenu = function (arr, _this) {
        for (var i = 0; i < arr.length; i++) {
          var item = arr[i];
          if (item.path === _this.$route.path) {
            return item;
          }
          if (item.child && item.child.length > 0 && item.type !== 1) {
            var found = handleMenu(item.child, _this);
            if (found) return found;
          }
        }
        return null;
      };
      var wms = JSON.parse(localStorage.getItem("wms"));
      var SET_MENUS = null;
      if (wms) SET_MENUS = wms.SET_MENUS;
      var menus = SET_MENUS;
      this.currentPageItem = handleMenu(menus, this);

      var targetMenuId = this.effectiveMenuId;
      if (!targetMenuId) return;

      var res = await this.get({
        url: "/api/app/menu-search-setting/by-menu",
        data: { sysMenuId: targetMenuId },
      });

      if (res.code !== 200) return;
      this.byMenuData = res.result || {};
      var configList = res.result.settingJson ? JSON.parse(res.result.settingJson) : [];
      convertSettingJson(res.result, { configList });

      // 合并搜索字段配置：formSearchData.tableSearch + frontSearchData 优先，接口返回的补充
      var localTableSearch = (this.formSearchData.tableSearch || []).slice().concat(
        this.frontSearchData.map(function (item) {
          return Object.assign({}, item, { isFrontAppend: true });
        })
      );
      var tableSearchMap = new Map();
      localTableSearch.forEach(function (item) {
        if (item.value) tableSearchMap.set(item.value, item);
      });
      configList.forEach(function (item) {
        if (item.value && !tableSearchMap.has(item.value)) {
          tableSearchMap.set(item.value, item);
        }
      });
      var mergedTableSearch = Array.from(tableSearchMap.values());

      // ===== 处理 admin 默认条件 =====
      var adminDefaultCompareMap = {};
      if (this.searchMode === "adminDefault" && res.result && res.result.adminDefaultFilterJson) {
        // B 模式：解析并准备回显已保存的 admin 默认条件
        var adminParsed = parseForcedFilter(res.result);
        this.adminDefaultConditions = adminParsed.filterConditions;
        adminDefaultCompareMap = adminParsed.compareMap;
      }

      if (!this.isDefaultFilterAdmin && res.result && res.result.adminDefaultFilterJson) {
        // 非 admin：从主响应获取 admin 默认条件，并过滤字段
        var nonAdminParsed = parseForcedFilter(res.result);
        this.adminDefaultConditions = nonAdminParsed.filterConditions;
        if (this.adminDefaultConditions.length > 0) {
          var adminKeys = new Set();
          this.adminDefaultConditions.forEach(function (c) {
            adminKeys.add(c.key);
          });
          mergedTableSearch = mergedTableSearch.filter(function (item) {
            return !adminKeys.has(item.value);
          });
        }
      }
      // ===== admin 默认条件处理结束 =====

      this.$set(this.formSearchData, "tableSearch", mergedTableSearch);

      // 合并默认搜索值：formSearchData.value / frontDefaultValue 优先级最高，接口默认值不覆盖
      var hasDefaultFilter = false;
      var defaultValue = Object.assign({}, this.formSearchData.value || {}, this.frontDefaultValue);

      // 解析并回显默认搜索条件
      if (res.result && res.result.defaultFilterJson) {
        try {
          var defaultParsed = JSON.parse(res.result.defaultFilterJson);
          var defaultFilters = defaultParsed.filterConditions;
          var compareMap = defaultParsed.compareMap;
          if (defaultFilters) {
            this.$set(this.formSearchData, "filterConditions", defaultFilters);
            defaultFilters.forEach(function (item) {
              if (item.values && item.values.length > 0) {
                if (!(item.key in defaultValue)) {
                  defaultValue[item.key] = item.values.length === 1 ? item.values[0] : item.values;
                }
              }
            });
          }
          if (compareMap) this.$refs.customSearchRef.compareMap = compareMap;
        } catch (e) {
          console.error("defaultFilterJson 解析失败:", e);
        }
      }

      // B 模式：回显 admin 默认条件的值到表单（同 defaultFilterJson 的 echo 逻辑）
      if (this.searchMode === "adminDefault" && this.adminDefaultConditions.length > 0) {
        this.adminDefaultConditions.forEach(function (item) {
          if (item.values && item.values.length > 0) {
            if (!(item.key in defaultValue)) {
              defaultValue[item.key] = item.values.length === 1 ? item.values[0] : item.values;
            }
          }
        });
        // 恢复比较运算符映射
        if (Object.keys(adminDefaultCompareMap).length > 0) {
          var existingCompareMap = this.$refs.customSearchRef.compareMap || {};
          this.$refs.customSearchRef.compareMap = Object.assign(
            existingCompareMap,
            adminDefaultCompareMap
          );
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
    },
    //保存
    onSave(_ref) {
      var configList = _ref.configList;
      var callback = _ref.callback;
      var targetMenuId = this.effectiveMenuId;
      this.post({
        url: "/api/app/menu-search-setting",
        data: {
          sysMenuId: targetMenuId,
          settingJson: JSON.stringify(configList),
        },
      }).then(res => {
        if (res.code !== 200) return;
        this.$message.success("保存成功");
        if (callback)
          callback(() => {
            this.init();
          });
        console.log("保存配置数据", configList);
      });
    },
    resetAllConfig() {
      this.$confirm(
        "此操作将清空该页面所有已保存的搜索配置（包括搜索条件、组合查询等），且不可恢复！",
        "重置确认",
        {
          confirmButtonText: "确定重置",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(() => {
          var targetMenuId = this.effectiveMenuId;
          this.put({
            url: "/api/app/menu-search-setting",
            data: {
              sysMenuId: targetMenuId,
              isAllClear: true,
            },
          }).then(res => {
            if (res.code !== 200) return;
            this.key++;
            this.formSearchData.tableSearch = [];
            this.formSearchData.options = [];
            this.$message.success("所有配置已重置");
            this.init();
          });
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="scss" scoped></style>
