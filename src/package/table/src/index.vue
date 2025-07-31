<template>
  <div class="table_list_fix">
    <!-- 扩展性内容 -->
    <slot name="content_context" />
    <template v-if="
        btnlist.length ||
        tableData.options.headTool ||
        tableData.options.refreshBtn ||
        tableData.options.downloadBtn
      ">
      <div
        v-if="showBtnBox"
        class="btnbox"
      >
        <!-- 左侧按钮 -->
        <div>
          <el-button
            v-for="(btn, index) in btnlist"
            :key="index"
            size="small"
            :type="btn.types ? btn.types : 'primary'"
            @click="btn.method"
          >
            <i
              v-if="btn.icon"
              :class="btn.icon"
            />
            {{ btn.title }}
          </el-button>
        </div>
        <!-- 右侧工具按钮 -->
        <div class="toolbox">
          <el-dropdown
            v-if="tableData.options.headTool"
            class="avatar-container right-menu-item hover-effect"
            trigger="click"
          >
            <div class="avatar-wrapper">
              <div class="layui-table-tool-self">
                <i class="el-icon-s-operation" />
              </div>
            </div>
            <el-dropdown-menu
              slot="dropdown"
              style="padding: 5px"
            >
              <el-checkbox-group v-model="checkedTableColumns">
                <el-checkbox
                  v-for="column in checkedTableList"
                  :key="column.prop"
                  class="checkbox"
                  :label="column.prop"
                >{{ column.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-dropdown-menu>
          </el-dropdown>
          <div
            v-if="tableData.options.refreshBtn"
            class="avatar-container right-menu-item hover-effect el-dropdown"
            @click="refreshTable"
          >
            <div class="avatar-wrapper">
              <div class="layui-table-tool-self">
                <i class="el-icon-refresh" />
              </div>
            </div>
          </div>
          <div
            v-if="tableData.options.downloadBtn"
            class="avatar-container right-menu-item hover-effect el-dropdown"
            @click="printTable"
          >
            <div class="avatar-wrapper">
              <div class="layui-table-tool-self">
                <i class="el-icon-printer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!--  表格  -->
    <div
      class="tablebox"
      :key="tableData.columns.length"
    >
      <el-table
        :ref="tableRef"
        v-loading="tableData.loading"
        border
        v-bind="tableData.options"
        :data="tableData.rows"
        style="width: 100%"
        height="100%"
        :default-sort="tableData.sort"
        v-on="tableEvents"
        @selection-change="SelectionChange"
        @select="select"
        @select-all="selectAll"
        @row-click="rowClick"
      >

        <el-table-column
          v-if="tableData.options && tableData.options.index"
          width="60"
          align="center"
          type="index"
          :index="computeTableIndex"
          label="序号"
        />
        <el-table-column
          v-if="tableData.options && tableData.options.selection"
          width="60"
          align="center"
          type="selection"
          label=""
        />
        <!-- 新增插槽，允许父组件自定义表头 -->
        <template v-if="tableData.options && tableData.options.useSlotHeader">
          <slot
            name="table-columns"
            :columns="bindTableColumns"
          >
            <template v-for="(item, index) in bindTableColumns">
              <my-table-column
                :column="item"
                :key="index"
              />
            </template>
          </slot>
        </template>
        <!-- 防止之前逻辑出现纰漏，故保留之前逻辑再扩展自定义插槽方式渲染 -->
        <template v-else>
          <template v-for="(item, index) in bindTableColumns">
            <el-table-column
              :key="index"
              :label="item.label"
              :prop="item.prop"
              :min-width="item.minWidth || '150px'"
              :show-overflow-tooltip="item.overHidden || true"
              :type="item.type || 'normal'"
              v-bind="{
              align: 'center',
              width: item.width,
              fixed: item.fixed || false,
              sortable: item.sortable || false,
              ...item.attrs,
            }"
            >
              <template v-slot:header>
                <el-tooltip
                  :content="`${item.label} ${item.prop}`"
                  placement="top"
                >
                  <span>{{ item.label }}</span>
                </el-tooltip>
              </template>
              <template
                v-if="item.render"
                v-slot="scope"
              >
                <render-dom :render="() => item.render(scope.row)" />
              </template>
              <template
                v-else-if="item.renderSlot"
                v-slot="scope"
              >
                <slot
                  :row="scope.row"
                  :name="item.prop"
                />
              </template>
            </el-table-column>
          </template>
        </template>

        <el-table-column
          v-if="tableData.operates && tableData.operates.length > 0"
          label="操作"
          align="center"
          v-bind="tableData.operatesAttrs"
        >
          <template slot-scope="scope">
            <div class="operate-group">
              <template v-for="(btn, key) in tableData.operates">
                <span
                  v-if="
                    !btn.isShow ||
                    (btn.isShow && btn.isShow(scope.row, scope.$index))
                  "
                  :key="key"
                >
                  <el-button
                    :style="btn.style || ''"
                    :size="btn.size || 'small'"
                    :type="btn.type || `text`"
                    :icon="btn.icon"
                    :plain="btn.plain"
                    :disabled="
                      btn.disabled && btn.disabled(scope.row, scope.$index)
                    "
                    @click.stop="btn.method(scope.row, scope.$index)"
                  >{{ btn.label
                    }}{{
                      tableData.operates.length >= 2 ? "&nbsp;&nbsp;" : ""
                    }}</el-button>
                </span>
              </template>
            </div>
          </template>·
        </el-table-column>
        <div
          slot="empty"
          class="empty"
        >
          <img
            v-if="tableData.rows.length == 0"
            :src="nodata"
          />
        </div>
      </el-table>
    </div>
    <!-- 分页 -->
    <div class="pagebox">
      <el-row>
        <el-col :span="24">
          <el-pagination
            v-if="paginations.pagetionShow && paginations.total > 0"
            :current-page.sync="paginations.page"
            :page-sizes="paginations.page_sizes || pageSizes"
            :page-size="paginations.limit"
            layout="total, sizes, prev, pager, next, jumper,slot"
            :total="paginations.total"
            @size-change="handleSizeChange"
            @current-change="handleindexChange"
          >
            <div
              v-if="paginations.refresh"
              :key="1"
              class="avatar-container right-menu-item hover-effect el-dropdown"
              style="margin-left: 10px"
              @click="refreshTableBTN"
            >
              <div class="avatar-wrapper">
                <div class="layui-table-tool-self">
                  <i class="el-icon-refresh" />
                </div>
              </div>
            </div>
          </el-pagination>
        </el-col>
      </el-row>
    </div>
    <printTemplate
      v-show="false"
      class="printTemplate"
      :print-list-obj="printListObj"
    />
  </div>
</template>
<script>
import printTemplate from "./printTable.vue";
import nodata from "./nodata.jpg";
import { getData } from '../../index.js'
export default {
  name: "table",
  components: {
    printTemplate,
    // 函数式组件注册
    renderDom: {
      functional: true,
      props: {
        render: Function,
      },
      render(createElement, renDom) {
        return <div>{renDom.props.render()}</div>;
      },
    },
    myTableColumn: {
      functional: true,
      props: {
        column: { type: Object, required: true }
      },
      render(h, ctx) {
        const col = ctx.props.column;

        // 多级表头处理
        if (col.children && col.children.length) {
          return h(
            'el-table-column',
            {
              props: {
                label: col.label,
                ...col.attrs
              }
            },
            col.children.map((child, idx) =>
              h(ctx.parent.$options.components.myTableColumn, {
                props: { column: child },
                key: idx
              })
            )
          );
        }

        // 单列表头处理
        return h(
          'el-table-column',
          {
            props: {
              label: col.label,
              prop: col.prop,
              minWidth: col.minWidth || '150px',
              showOverflowTooltip: col.overHidden || true,
              type: col.type || 'normal',
              align: 'center',
              width: col.width,
              fixed: col.fixed || false,
              sortable: col.sortable || false,
              ...col.attrs
            }
          },
          [
            // 表头插槽 - 添加 el-tooltip
            h('template', { slot: 'header' }, [
              h('el-tooltip', {
                props: {
                  content: `${col.label} ${col.prop}`,
                  placement: 'top'
                }
              }, [
                h('span', col.label)
              ])
            ]),
            // 内容插槽 - 支持自定义渲染
            col.render ? h('template', { slot: 'default' }, {
              render: (scope) => h(ctx.parent.$options.components.renderDom, {
                props: { render: () => col.render(scope.row) }
              })
            }) : null,
            // 插槽渲染
            col.renderSlot ? h('template', { slot: 'default' }, {
              render: (scope) => ctx.parent.$scopedSlots[col.prop] ?
                ctx.parent.$scopedSlots[col.prop](scope) : null
            }) : null
          ].filter(Boolean)
        );
      }
    }
  },
  model: {
    prop: "multipleSelection",
    event: "SelectionChange",
  },
  props: {
    url: {
      type: String,
      default: "",
    }, // 接口地址
    printListObj: {
      type: Object,
      default: () => {
        return {
          title: "",
          tableHeader: "",
          tableData: "",
        };
      },
    }, // 打印参数
    btnlist: Array,
    outTable: {
      type: Object,
      default: () => {
        return {
          tableProp: {},
        };
      },
    },
    // exportBut: {
    //   type: Array,
    //   default: [],
    // },
    // 表格传的形式
    tableData: {
      type: Object,
      default: () => {
        return {
          loading: false,
          options: {
            selection: null, // 多选框
            index: null, // 序号
            headTool: true, // 开启头部工具栏
            refreshBtn: true, // 开启表格头部刷新按钮
            downloadBtn: true, // 开启表格头部下载按钮
            useSlotHeader: false, // 使用插槽自定义表头
          }, // 序号和复选框
          rows: [], // 表数据
          columns: [], // 表头
          operates: [], // 表格里面的操作按钮
          // tableHeightDiff: 300,
          operatesAttrs: {},
        };
      },
    },
    tableDataShow: {
      type: Boolean,
      default: true,
    },
    pageSizes: {
      type: Array,
      default: () => {
        return [20, 30, 40, 60, 100, 200];
      },
    },
    paginations: {
      // 显示复选框，
      type: Object,
      default: () => {
        return {
          page: 1, // 当前位于那页面
          total: 0, // 总数
          limit: 30, // 一页显示多少条
          pagetionShow: true,
        };
      },
    },
    emptyImg: {
      // 显示复选框，
      type: Boolean,
      default: false,
    },
    tableEvents: Object,
    showBtnBox: {
      type: Boolean,
      default: true,
    },
  },
  created() {
    // 通过swagger完善columns
    this.init()
  },
  data() {
    return {
      nodata,
      tableRef: this.tableData.tableRef || "tableRef", // ref
      toggleRowFlage: this.tableData.toggleRowFlage || false, // 点击行高亮select标识
      // screenWidth: 0,
      // tableHeight:
      //   document.documentElement.clientHeight - this.tableData.tableHeightDiff,
      pagetionShow: this.paginations.pagetionShow || true,
      twinPage: 1,
    };
  },
  computed: {
    bindTableColumns() {
      return this.tableData.columns.filter((column) =>
        Object.keys(column).includes("show") ? column.show : true
      );
    },

    checkedTableList: {
      get() {
        // 返回选中的列名
        return this.tableData.columns.filter(
          (item) => item.type != "selection"
        );
      },
    },
    /* 这里使用了getter和setter，这样写的好处不用自己手动监听复选框的选中事件 */
    checkedTableColumns: {
      get() {
        // 返回选中的列名
        return this.bindTableColumns.map((column) => column.prop);
      },
      set(checked) {
        // 设置表格列的显示与隐藏
        this.tableData.columns.forEach((column) => {
          // 如果选中，则设置列显示
          if (checked.includes(column.prop)) {
            this.$set(column, "show", true);
          } else {
            // 如果未选中，则设置列隐藏
            this.$set(column, "show", false);
          }
        });
        this.$nextTick(() => {
          this.$refs.tableRef.doLayout()
        })
      },
    },
  },
  methods: {
    // init() {
    //   // 从 IndexedDB 中获取 Swagger 数据
    //   getData().then((swaggerData) => {
    //     const swaggerColumns = swaggerData.paths[this.url].get.responses["200"].content['application/json'].schema.properties.items.items.properties;

    //     Object.keys(swaggerColumns).forEach(key => {
    //       const item = swaggerColumns[key];
    //       let tempItem = this.tableData.columns.find((e) => e.prop == key);
    //       if (tempItem) {
    //         tempItem = { ...item, ...tempItem };
    //       } else if (item.description) {
    //         this.tableData.columns.push({
    //           prop: key,
    //           label: item.description,
    //           show: true,
    //           sortable: false,
    //           attrs: {}
    //         });
    //       }
    //     });
    //     console.log(`\x1b[36m\x1b[4mol插件-表格`, this.tableData.columns)
    //   }).catch((error) => {
    //     console.error("获取 Swagger 数据失败:", error);
    //   });
    // },
    // 支持多级表头 useSlotHeader: true，且支持排序，通过columns中的顺序实现
    //  columns: [
    //       {
    //         label: '一级表头',
    //         children: [{ prop: 'bindStateEnum', label: '112' }, { prop: 'tagNumber' }]
    //       },
    //       {
    //         prop: "remark",
    //         label: "备注123",
    //       },
    //     ],
    init() {
      // 从 IndexedDB 中获取 Swagger 数据
      getData().then((swaggerData) => {
        const swaggerColumns = swaggerData.paths[this.url].get.responses["200"].content['application/json'].schema.properties.items.items.properties;

        // 递归映射函数
        const mapSwaggerToColumns = (columns) => {
          columns.forEach(column => {
            if (column.children && column.children.length) {
              mapSwaggerToColumns(column.children);
            } else {
              if (column.prop && swaggerColumns[column.prop]) {
                const swaggerItem = swaggerColumns[column.prop];
                Object.assign(column, {
                  label: swaggerItem.description,
                  show: true,
                  sortable: false,
                  ...column
                });
              }
            }
          });
        };

        mapSwaggerToColumns(this.tableData.columns);

        Object.keys(swaggerColumns).forEach(key => {
          const item = swaggerColumns[key];
          const existingColumn = this.findColumnByProp(this.tableData.columns, key);
          if (!existingColumn && item.description) {
            this.tableData.columns.push({
              prop: key,
              label: item.description,
              show: true,
              sortable: false,
              attrs: {},
              ...item
            });
          }
        });

        console.log(`\x1b[36m\x1b[4mol插件-表格`, this.tableData.columns)
      }).catch((error) => {
        console.error("获取 Swagger 数据失败:", error);
      });
    },
    // 递归查找列配置的辅助方法
    findColumnByProp(columns, prop) {
      for (const column of columns) {
        if (column.children && column.children.length) {
          const found = this.findColumnByProp(column.children, prop);
          if (found) return found;
        } else if (column.prop === prop) {
          return column;
        }
      }
      return null;
    },
    // 多级表头转换
    multilevelHeader() {

    },
    radioChange() {
      this.$emit("radioChange", this.twinPage);
    },
    // 刷新表格
    refreshTable() {
      const view = this.$router.history.current;
      this.$store.dispatch("tagsView/delCachedView", view).then(() => {
        const { fullPath } = view;
        this.$nextTick(() => {
          this.$router.replace({
            path: "/redirect" + fullPath,
          });
        });
      });
      this.$emit("refreshTable");
    },
    printTable() {
      console.log("printTable");
      if (this.tableData.rows.length <= 0) return;
      this.printListObj.title = this.$router.history.current.name;
      this.printListObj.tableHeader = this.tableData.columns;
      this.printListObj.tableData = this.tableData.rows;
      console.log(this.printListObj);
      setTimeout(() => {
        $(".printTemplate").show();
        $(".printTemplate").jqprint();
        $(".printTemplate").hide();
      }, 50);
      this.$emit("printTable");
    },
    selectAll(val) {
      this.$emit("selectAll", val);
    },
    select(val, row) {
      this.$emit("selectTab", val, row);
    },
    refreshTableBTN() {
      this.$emit("refreshTableBTN");
    },
    rowClick(row, column) {
      if (column.label === "操作") return; // 操作列不处罚行点击事件
      this.$emit("rowClick", row);
      if (
        this.tableData.columns.every((item) => {
          return item.label !== "是否只出样件";
        })
      ) {
        // 为true时 点击行高亮select
        this.$refs.tableRef.toggleRowSelection(row);
      }
    },
    computeTableIndex(index) {
      return (this.paginations.page - 1) * this.paginations.limit + index + 1;
    },
    // 挑选的数据
    SelectionChange(val) {
      this.multipleSelection = val;
      this.$emit("SelectionChange", val);
    },
    // 分页选择
    handleSizeChange(val) {
      this.paginations.limit = val;
      this.$emit("handleSizeChange", val);
    },
    handleindexChange(val) {
      this.paginations.page = val;
      this.$emit("handleindexChange", val);
    },
  },
};
</script>
<style lang="scss" scoped>
.table_list_fix {
  overflow: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  gap: 10px;

  ::v-deep .el-table {
    td {
      padding: 0px;

      div {
        line-height: 28px;
        font-size: 12px;
      }
    }

    th {
      padding: 0px;
      background: #f5f7fa;
      div {
        line-height: 28px;
        color: #909399;
        font-size: 12px;
      }
    }
  }

  .btn-operates {
    margin: 10px 0px 10px 15px;

    ::v-deep a {
      color: #fff;
      text-decoration: none;
      display: inline-block;
      margin: 0px 5px;
      ::v-deep .el-button {
        width: 100%;
        padding: 7px;
        font-size: 13px;
      }
    }
  }
}

.table-header {
  padding-top: 10px;

  .table-header_button {
    text-align: right;
    float: right;
    margin-bottom: 12px;
    line-height: 40px;
  }
}

.newjump {
  text-decoration: none;
  color: dodgerblue;
}

.tablebox {
  box-sizing: border-box;
  flex: 1;
  overflow: auto;
}

::v-deep .el-table__body tr.current-row > td {
  background-color: rgb(24, 144, 255) !important;
  color: #fff;
}

::v-deep .redrow {
  background: #fde6e6 !important;
}

.btnbox {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .upload-demo {
    display: -webkit-inline-box;
    margin-left: 10px;
  }

  .el-form-item {
    margin-bottom: 0px;
  }
}

.layui-table-tool-self {
  display: block;
  width: 26px;
  height: 26px;
  padding: 5px;
  line-height: 16px;
  text-align: center;
  color: #333;
  border: 1px solid #ccc;
  cursor: pointer;
}

.checkbox {
  display: block;
}
// 操作列按钮布局
.operate-group {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.toolbox {
  display: flex;
  gap: 10px;
}
</style>
