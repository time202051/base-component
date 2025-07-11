<template>
  <div id="app">
    <!-- <MyTable
      :paginations="paginations"
      :empty-img="tableData.emptyImg"
      :btnlist="[]"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
    ></MyTable> -->
    <!-- url="/api/app/admission-info/paged-result" -->

    <div>table组件案例</div>
    <ol-table
      :paginations="paginations"
      :empty-img="tableData.emptyImg"
      :btnlist="[]"
      url="/api/app/admission-info/paged-result"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
    ></ol-table>
    <el-button @click="handlePrint">接口</el-button>
  </div>
</template>

<script>
import MyTable from "@/package/table/src/index.vue";
export default {
  name: "App",
  components: {
    MyTable,
  },
  data() {
    return {
      multipleSelection: [],
      tableData: {
        loading: false,
        emptyImg: true,
        options: {
          selection: true, // 多选框
          index: false, // 序号EmployeeInfoCode
          headTool: true, // 开启头部工具栏
          refreshBtn: true, // 开启表格头部刷新按钮
          downloadBtn: true, // 开启表格头部下载按钮
        }, // 序号和复选框
        rows: [], // 表数据
        columns: [
          // {
          //   label: "",
          //   minWidth: "",
          //   type: "selection",
          //   show: true,
          // },
          {
            prop: "remark",
            label: "备注123",
          },
          {
            prop: "qualityEnumDesc123",
            label: "状态1111112222222",
          },
          // {
          //   prop: "stockTypeDesc",
          //   label: "类型",
          // },
          // {
          //   prop: "productCode",
          //   label: "零件编码",
          //   minWidth: "200",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "productName",
          //   label: "零件名称",
          //   minWidth: "180",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "productBatch",
          //   label: "批次",
          //   minWidth: "",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "receivingTime",
          //   label: "收货日期",
          //   minWidth: "160",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "expireTime",
          //   label: "到期时间",
          // },
          // {
          //   prop: "projectCode",
          //   label: "项目号",
          // },
          // {
          //   prop: "boxCode",
          //   label: "箱卡号",
          // },
          // {
          //   prop: "region",
          //   label: "区域",
          // },
          // {
          //   prop: "area",
          //   label: "库区",
          // },
          // {
          //   prop: "carBodyTagNumber",
          //   label: "标签号",
          // },
          // {
          //   prop: "cargoLocationCode",
          //   label: "库位编码",
          //   minWidth: "",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "containerCode",
          //   label: "容器编码",
          //   minWidth: "",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "totalQty",
          //   label: "库存数量",
          //   minWidth: "120",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "usableQty",
          //   label: "可用数量",
          //   minWidth: "120",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "lockQty",
          //   label: "占用数量",
          //   minWidth: "120",
          //   sortable: false,
          //   show: true,
          // },
          // {
          //   prop: "stockoutBillNo",
          //   label: "出库单号",
          // },
          // {
          //   prop: "loadPercent",
          //   label: "容器承载百分比",
          // },
          // {
          //   prop: "alv",
          //   label: "客户件号",
          // },
        ], // 表头
        operates: [], // 表格里面的操作按钮
        tableHeightDiff: 300,
      },
      paginations: {
        page: 1, // 当前位于那页面
        total: 10, // 总数
        limit: 30, // 一页显示多少条
        pagetionShow: true,
      },
    };
  },
  methods: {
    SelectionChange(row) {
      this.multipleSelection = row;
    },
    handleSearch(from) {
      var self = this;
      self.formSearchData.value = { ...from };
      self.paginations.page = 1;
      this.getTable();
    },
    handleReset() { },
    handleSizeChange(val) {
      this.paginations.page = 1;
      this.paginations.limit = val;
      this.getTable();
    },
    handleindexChange(val) {
      this.paginations.page = val;
      this.getTable();
    },
    async handlePrint() {
      // console.log(this);
      // const aaa = this.$api.getApi("Stock.get_api_app_stock_stock_pages")
      // console.log(6666, aaa);
    }
  },
};
</script>

<style>
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
} */
</style>
