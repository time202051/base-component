<template>
  <div id="app">
    <ol-print-model />
    <ol-customSearch
      :form-search-data="formSearchData"
      @handleSearch="handleSearch"
      :dragable="false"
      @onSave="save"
      dragable
    ></ol-customSearch>
    =========
    <!-- <div>table组件案例</div> -->
    <!-- url="/api/app/stock-in/stock-in-pages" -->
    <!-- <ol-search
      :form-search-data="formSearchData"
      @handleSearch="handleSearch"
      @handleReset="handleReset"
      @onSave="saveHandler"
    /> -->
    <button @click="aaa">123</button>
    <!-- url="/api/app/bind-record/bind-record-detail-pages" -->
    <ol-table
      :paginations="paginations"
      :empty-img="tableData.emptyImg"
      :btnlist="[]"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
      :onPrintData="onPrintData"
    >
      <template slot="ceshi" slot-scope="scope">
        <span>333433{{ scope.row.ceshi }}</span>
      </template>
      <template slot="toolbox-before" slot-scope="scope">
        <el-button type="primary" size="mini" @click="handlePrint1(scope)">打印</el-button>
      </template>
    </ol-table>
    <!-- <el-button @click="handlePrint">接口</el-button>
    <el-button @click="onAdd">新建</el-button>
    <el-button @click="onEdit">编辑</el-button> -->

    <!-- <el-dialog :title="`${this.form.title}`" :visible.sync="dialogVisible" width="80%">
      <ol-form
        v-if="dialogVisible"
        url="/api/app/admission-info/admission-info"
        :form="form"
        @onCancel="dialogVisible = false"
        @onSubmit="onSubmit"
      />
    </el-dialog> -->
    <!-- <ol-print /> -->
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      quantity: 0,
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
          // smartPrintBtn: false,
        }, // 序号和复选框
        rows: [
          {
            bindStateEnum: "11",
            creationTime: "22",
            ceshi: "hhh",
          },
        ], // 表数据
        columns: [
          {
            label: "测试",
            prop: "ceshi",
            renderSlot: true,
          },
          {
            prop: "unit",
            show: false,
          },
          {
            label: "一级表头",
            beforeProp: "qty", // 位置
            show: true,
            children: [
              {
                label: "二级表头",
                children: [
                  {
                    prop: "creationTime",
                  },
                  {
                    prop: "orginalBillNo",
                  },
                ],
              },
              {
                prop: "roadWayCode",
              },
              {
                prop: "batch",
              },
            ],
          },
          {
            label: "一级表头-1",
            beforeProp: "containerType", // 位置
            children: [
              {
                prop: "regionCode",
              },
              {
                prop: "taskNo",
              },
            ],
          },
        ],
        operates: [], // 表格里面的操作按钮
        tableHeightDiff: 300,
        printData: {
          name: "默认数据",
          table: [{ name: "默认数据1" }],
        },
      },
      paginations: {
        page: 1, // 当前位于那页面
        total: 10, // 总数
        limit: 30, // 一页显示多少条
        pagetionShow: true,
      },

      formSearchData: {
        enableConfig: true,
        reset: true, // 重置
        expendShow: true, // 展开
        tableSearchSlice: 5,
        value: {
          // DocNo: null, // 对应输入框的value字段
          // QualityCheckStateType: null,
          // QualityCheckState: null,
          // timer: [],
          // range: [10, 200],
        },
        tableSearch1: [
          {
            label: "数字区间",
            value: "range",
            inputType: "numberRange",
            originalFields: {
              begin: "begin123",
              end: "end123",
            },
            listeners: {
              change: e => {
                const {
                  val: [start, end],
                } = e;
                this.formSearchData.value.rang1 = start;
                this.formSearchData.value.rang2 = end;
                console.log(this.formSearchData, e);
              },
            },
          },
          // {
          //   label: "标签号",
          //   value: "carBodyTagNumber",
          //   inputType: "text"
          // },
          // {
          //   label: "车架号",
          //   value: "frameNumber",
          //   inputType: "text"
          //   // value: "QualityCheckStateType",
          //   // inputType: "select",
          //   // children: this.SET_enumsSelect({
          //   //   keyword: "qualityCheckTypeEnum",
          //   // }),
          // },
          // {
          //   label: "项目号",
          //   value: "projectCode",
          //   inputType: "text"
          // },
          // {
          //   label: "状态描述",
          //   value: "statusDescription",
          //   inputType: "select",
          //   // 0整车/1白车身/2碰撞加固车身/3爆破切割车身/4侧面切割下车身
          //   children: [
          //     {
          //       key: 0,
          //       value: "整车"
          //     },
          //     {
          //       key: 1,
          //       value: "白车身"
          //     },
          //     {
          //       key: 2,
          //       value: "碰撞加固车身"
          //     },
          //     {
          //       key: 3,
          //       value: "爆破切割车身"
          //     },
          //     {
          //       key: 4,
          //       value: "侧面切割下车身"
          //     }
          //   ]
          // },
          // {
          //   label: "实验状态",
          //   value: "experimentStatus",
          //   inputType: "select",
          //   // 0实验前 1实验中 2实验后
          //   children: [
          //     {
          //       key: 0,
          //       value: "实验前"
          //     },
          //     {
          //       key: 1,
          //       value: "实验中"
          //     },
          //     {
          //       key: 2,
          //       value: "实验后"
          //     }
          //   ]
          // },
          // {
          //   label: "状态",
          //   value: "tagStatus",
          //   inputType: "select",
          //   children: []
          // },
          // {
          //   label: "车身类型",
          //   value: "bodyWorkType",
          //   inputType: "select",
          //   children: []
          // },
          // {
          //   label: "项目名称",
          //   value: "projectName",
          //   inputType: "text"
          // },
          // {
          //   label: "入场日期",
          //   inputType: "picker",
          //   value: "admissionDate",
          //   props: {
          //     valueFormat: "yyyy-MM-dd",
          //     format: "yyyy/MM/dd"
          //   }
          // },
          // {
          //   label: "打印次数",
          //   value: "tagPrintNumber",
          //   inputType: "number"
          // },
          // {
          //   label: "创建时间",
          //   value: "createdTime",
          //   inputType: "picker",
          //   props: {
          //     type: "datetimerange",
          //     startPlaceholder: "开始时间",
          //     endPlaceholder: "结束时间",
          //     placeholder: "选择时间范围",
          //     valueFormat: "yyyy-MM-dd HH:mm:ss",
          //     format: "yyyy/MM/dd HH:mm:ss"
          //   }
          // },
          // {
          //   label: "虚拟项目",
          //   value: "tempProject",
          //   inputType: "text"
          // }
        ],
        tableSearch: [],
        customs: [
          {
            name: "库位编码",
            keyType: 1,
            key: "WarehouseLocationCode",
            enumName: null,
            custom: false,
          },
          {
            name: "使用状态",
            keyType: 3,
            key: "UsageStatus",
            enumName: "usageStatusEnum",
            custom: false,
          },
          {
            name: "是否启用",
            keyType: 1,
            key: "Enabled",
            enumName: null,
            custom: false,
          },
          {
            name: "创建时间",
            keyType: 4,
            key: "CreationTime",
            enumName: null,
            custom: false,
          },
          {
            name: "备注",
            keyType: 1,
            key: "Remark",
            enumName: null,
            custom: false,
          },
        ],
      },

      form: {
        type: 0, // 0详情，1新增, 2编辑
        title: "",
        // 默认值
        defaultValue: {},
        value: {},
        model: [
          // {
          //   prop: "warehouseCode",
          // },
          {
            label: "数量范围",
            type: "numberRange",
            prop: "range",
          },
          {
            label: "项目名称",
            type: "input",
            prop: "projectName",
          },
          {
            label: "项目状态",
            type: "select",
            prop: "projectStatus",
            child: [
              {
                value: "正常",
                key: 0,
              },
              {
                value: "保密一级",
                key: 1,
              },
              {
                value: "保密二级",
                key: 2,
              },
            ],
          },
        ],
        rules: {
          // employeePhoneNumber: [
          //   {
          //     required: true,
          //     message: "手机号不能为空",
          //     trigger: "blur",
          //   },
          //   {
          //     pattern: /^1[3-9]\d{9}$/,
          //     message: "请输入有效的手机号",
          //     trigger: "blur",
          //   },
          // ],
          projectCode: [
            {
              required: true,
              message: "项目号不能为空",
              trigger: "blur",
            },
          ],
          projectName: [
            {
              required: true,
              message: "项目名称不能为空",
              trigger: "blur",
            },
          ],
          projectStatus: [
            {
              required: true,
              message: "项目状态不能为空",
              trigger: "blur",
            },
          ],
          // productCode: [
          //   {
          //     required: true,
          //     message: "ALV零件号不能为空",
          //     trigger: "blur",
          //   },
          // ],
          productName: [
            {
              required: true,
              message: "零件名称不能为空",
              trigger: "blur",
            },
          ],
          qty: [
            {
              required: true,
              message: "收货数量不能为空",
              trigger: "blur",
            },
          ],
          receivedBatch: [
            {
              required: true,
              message: "收货批次不能为空",
              trigger: "blur",
            },
          ],
          employeeInfoId: [
            {
              required: true,
              message: "接收人不能为空",
              trigger: "blur",
            },
          ],
          // storageLocation: [
          //   {
          //     required: true,
          //     message: "外仓编码不能为空",
          //     trigger: "blur"
          //   }
          // ]
        },
        attrs: {
          labelWidth: "100px",
        },
      },
      dialogVisible: false,
    };
  },
  // onMounted() {

  // },
  mounted() {
    // const el = document.getElementById("ellipsis-container");
    // this.truncateMiddleByWidth(el)
  },
  methods: {
    SelectionChange(row) {
      this.multipleSelection = row;
    },
    handleSearch(from, item) {
      console.log(1112223, item);

      this.formSearchData.value = { ...from };
      this.paginations.page = 1;
      this.getTable();
    },
    handleReset() {},
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
      const newColumns = JSON.parse(JSON.stringify(this.tableData.columns));
      const temp = newColumns.find(e => e.label == "多级表头");
      // temp.children[0].label = "3333";
      // temp.children[0].show = false
      this.$set(temp.children[0], "show", false);
      this.tableData.columns = newColumns;
      // this.$set(temp.children[0], 'show', false)
      // temp.children.push({
      //   prop: 'containerType',
      //   label: '容器类型',
      //   show: true
      // })
      // this.tableData.columns.push({
      //   prop: 'aaaa',
      //   label: 'aaaa',
      //   show: true
      // })
    },
    // ================
    getTable() {
      console.log("getTable参数", this.formSearchData.value);
    },
    truncateMiddleByWidth(el) {
      let text = el.textContent;
      if (el.scrollWidth <= el.clientWidth) return;
      const suffix = text.slice(-3);
      let left = 0;
      let right = text.length - 3;
      let result = "";
      while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        const temp = text.slice(0, mid) + "..." + suffix;
        el.textContent = temp;
        if (el.scrollWidth <= el.clientWidth) {
          result = temp;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      el.textContent = result;
    },
    onAdd() {
      this.form.type = 1;
      this.dialogVisible = true;
    },
    onEdit() {
      this.form.type = 2;
      this.dialogVisible = true;
    },
    async onSubmit(form) {
      const { type } = this.form;
      if (type === 1) {
        // putAdmissioninfoByAdmissionId
        // 新增
        this.post({
          url: StockIn.addStockIn,
          data: this.form.value,
          isLoading: true,
        }).then(res => {
          this.$message({ type: "success", message: "操作成功!" });
          this.dialogVisible = false;
          this.init();
        });
      } else if (type === 2) {
        // 编辑
        this.put({
          url: `${StockIn.editStockIn}/${this.form.value.id}`,
          data: this.form.value,
          isLoading: true,
        }).then(res => {
          this.init();
          this.dialogVisible = false;
          this.message({ type: "success", message: "操作成功!" });
        });
      }
    },
    aaa() {
      const printEnpty = this.$hiprint({
        grid: true,
        printData: {
          name: "CcSimple",
          barcode: "33321323",
          table: [
            { id: "1", name: "王小可123", gender: "男", count: "120", amount: "9089元" },
            { id: "2", name: "梦之遥", gender: "女", count: "20", amount: "89元" },
          ],
          table1: [
            { id: "1", name: "王小可11", gender: "男", count: "120", amount: "9089元" },
            { id: "2", name: "梦之遥", gender: "女", count: "20", amount: "89元" },
          ],
        },
        onPrintData: data => {
          return data;
        },
        defaultTemplate: {
          panels: [
            {
              index: 0,
              name: 1,
              paperType: "A4",
              height: 297,
              width: 210,
              paperHeader: 0,
              paperFooter: 841.8897637795277,
              printElements: [
                {
                  options: {
                    left: 117,
                    top: 94.5,
                    height: 9.75,
                    width: 120,
                    field: "name",
                    testData: "内容",
                    title: "文本",
                    qid: "name",
                  },
                  printElementType: {
                    title: "文本",
                    type: "text",
                  },
                },
                {
                  options: {
                    left: 160.5,
                    top: 174,
                    height: 36,
                    width: 550,
                    fields: [],
                    field: "table",
                    qid: "table",
                    columns: [
                      [
                        {
                          width: 137.5,
                          title: "名称",
                          field: "name",
                          checked: true,
                          columnId: "name",
                          fixed: false,
                          rowspan: 1,
                          colspan: 1,
                          align: "center",
                        },
                        {
                          width: 137.5,
                          title: "性别",
                          field: "gender",
                          checked: true,
                          columnId: "gender",
                          fixed: false,
                          rowspan: 1,
                          colspan: 1,
                          align: "center",
                        },
                        {
                          width: 137.5,
                          title: "数量",
                          field: "count",
                          checked: true,
                          columnId: "count",
                          fixed: false,
                          rowspan: 1,
                          colspan: 1,
                          align: "center",
                        },
                        {
                          width: 137.5,
                          title: "金额",
                          field: "amount",
                          checked: true,
                          columnId: "amount",
                          fixed: false,
                          rowspan: 1,
                          colspan: 1,
                          align: "center",
                        },
                      ],
                    ],
                  },
                  printElementType: {
                    title: "表格",
                    type: "table",
                    editable: true,
                    columnDisplayEditable: true,
                    columnDisplayIndexEditable: true,
                    columnTitleEditable: true,
                    columnResizable: true,
                    columnAlignEditable: true,
                    isEnableEditField: true,
                    isEnableContextMenu: true,
                    isEnableInsertRow: true,
                    isEnableDeleteRow: true,
                    isEnableInsertColumn: true,
                    isEnableDeleteColumn: true,
                    isEnableMergeCell: true,
                  },
                },
              ],
              paperNumberContinue: true,
              watermarkOptions: {},
              panelLayoutOptions: {},
            },
          ],
        },
        onSubmit: data => {
          // console.log(6666, data);
        },
      });

      // this.$hiprint.print({
      //   printData: {
      //     name: "CcSimple",
      //     barcode: "33321323",
      //     table: [
      //       { id: "1", name: "王小可123", gender: "男", count: "120", amount: "9089元" },
      //       { id: "2", name: "梦之遥", gender: "女", count: "20", amount: "89元" },
      //     ],
      //     table1: [
      //       { id: "1", name: "王小可11", gender: "男", count: "120", amount: "9089元" },
      //       { id: "2", name: "梦之遥", gender: "女", count: "20", amount: "89元" },
      //     ],
      //   },
      //   onPrintData: data => {
      //     return data;
      //   },
      //   defaultTemplate: {
      //     panels: [
      //       {
      //         index: 0,
      //         name: 1,
      //         paperType: "A4",
      //         height: 297,
      //         width: 210,
      //         paperHeader: 0,
      //         paperFooter: 841.8897637795277,
      //         printElements: [
      //           {
      //             options: {
      //               left: 117,
      //               top: 94.5,
      //               height: 9.75,
      //               width: 120,
      //               field: "name",
      //               testData: "内容",
      //               title: "文本",
      //               qid: "name",
      //             },
      //             printElementType: {
      //               title: "文本",
      //               type: "text",
      //             },
      //           },
      //           {
      //             options: {
      //               left: 160.5,
      //               top: 174,
      //               height: 36,
      //               width: 550,
      //               fields: [],
      //               field: "table",
      //               qid: "table",
      //               columns: [
      //                 [
      //                   {
      //                     width: 137.5,
      //                     title: "名称",
      //                     field: "name",
      //                     checked: true,
      //                     columnId: "name",
      //                     fixed: false,
      //                     rowspan: 1,
      //                     colspan: 1,
      //                     align: "center",
      //                   },
      //                   {
      //                     width: 137.5,
      //                     title: "性别",
      //                     field: "gender",
      //                     checked: true,
      //                     columnId: "gender",
      //                     fixed: false,
      //                     rowspan: 1,
      //                     colspan: 1,
      //                     align: "center",
      //                   },
      //                   {
      //                     width: 137.5,
      //                     title: "数量",
      //                     field: "count",
      //                     checked: true,
      //                     columnId: "count",
      //                     fixed: false,
      //                     rowspan: 1,
      //                     colspan: 1,
      //                     align: "center",
      //                   },
      //                   {
      //                     width: 137.5,
      //                     title: "金额",
      //                     field: "amount",
      //                     checked: true,
      //                     columnId: "amount",
      //                     fixed: false,
      //                     rowspan: 1,
      //                     colspan: 1,
      //                     align: "center",
      //                   },
      //                 ],
      //               ],
      //             },
      //             printElementType: {
      //               title: "表格",
      //               type: "table",
      //               editable: true,
      //               columnDisplayEditable: true,
      //               columnDisplayIndexEditable: true,
      //               columnTitleEditable: true,
      //               columnResizable: true,
      //               columnAlignEditable: true,
      //               isEnableEditField: true,
      //               isEnableContextMenu: true,
      //               isEnableInsertRow: true,
      //               isEnableDeleteRow: true,
      //               isEnableInsertColumn: true,
      //               isEnableDeleteColumn: true,
      //               isEnableMergeCell: true,
      //             },
      //           },
      //         ],
      //         paperNumberContinue: true,
      //         watermarkOptions: {},
      //         panelLayoutOptions: {},
      //       },
      //     ],
      //   },
      //   onSubmit: data => {
      //     console.log(6666, data);
      //   },
      // });
    },
    saveHandler(configList) {
      console.log("保存配置", configList);
    },
    handlePrint1(row) {
      console.log(11122333, row);
    },
    onPrintData(tempItem, done) {
      // function(){return [1,2]}
      console.log("111app", tempItem, done);
      if (tempItem.templeteName === "自定义模式") {
        // 模拟异步接口请求
        const data = {
          name: "自定义模式",
          table: [
            {
              index: 0,
              name: "2233",
              age: 12,
              gender: "男",
              count: 100,
              amount: 1000,
              aaa: "123",
              bbb: "456",
              ccc: "789",
              ddd: "101112",
            },
            {
              index: 1,
              name: "张三",
              age: 25,
              gender: "男",
              count: 200,
              amount: 2000,
              aaa: "abc",
              bbb: "def",
              ccc: "ghi",
              ddd: "jkl",
            },
            {
              index: 2,
              name: "李四",
              age: 30,
              gender: "女",
              count: 300,
              amount: 3000,
              aaa: "mno",
              bbb: "pqr",
              ccc: "stu",
              ddd: "vwx",
            },
            {
              index: 3,
              name: "王五",
              age: 28,
              gender: "男",
              count: 400,
              amount: 4000,
              aaa: "yz1",
              bbb: "234",
              ccc: "567",
              ddd: "890",
            },
            {
              index: 4,
              name: "赵六",
              age: 35,
              gender: "女",
              count: 500,
              amount: 5000,
              aaa: "qwe",
              bbb: "rty",
              ccc: "uio",
              ddd: "pas",
            },
            {
              index: 5,
              name: "钱七",
              age: 22,
              gender: "男",
              count: 600,
              amount: 6000,
              aaa: "dfg",
              bbb: "hjk",
              ccc: "lzx",
              ddd: "cvb",
            },
          ],
        };
        done(data);
      }
    },
    save(e) {
      console.log(123, e);

      // this.formSearchData.value.usageStatus = null;
    },
  },
};
</script>

<style lang="scss" scoped>
/* #app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
} */
.grid-content {
  display: grid;
  // grid-template-columns: repeat(2, 1fr);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  // align-items: center;
  // justify-items: center;
  // justify-content: center;
  align-content: center;
  height: 300px; /* 你想要的高度 */
  gap: 10px;
  div {
    background-color: aqua;
  }
}

.container {
  display: flex;
  align-items: center; /* 默认让所有子项在垂直方向居中 */
  height: 200px;
  background: #eee;
}
.item {
  width: 60px;
  height: 60px;
  background: orange;
  margin: 5px;
}
.item2 {
  align-self: flex-start; /* 只让这个item到底部对齐 */
}

.triangle-up {
  margin-left: 400px;
  width: 100px;
  height: 100px;
  background-color: purple;
  clip-path: polygon(50% 0%, 0% 0%, 0% 100%, 100% 100%);
}

.square-container {
  width: 100px; /* 控制容器宽度 */
}

.square {
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: red;
}

.ellipsis-container {
  width: 200px;
  // height: 100px;
  border: 1px solid #ccc;
  overflow: hidden;
  white-space: nowrap;
  // text-overflow: ellipsis;
  // display: -webkit-box;
  // -webkit-line-clamp: 4; /* 设置行数，例如3行 */
  // -webkit-box-orient: vertical;
}
</style>
