<template>
  <div id="app">
    <div>table组件案例</div>
    <ol-search
      :form-search-data="formSearchData"
      @handleSearch="handleSearch"
      @handleReset="handleReset"
      url="/api/app/admission-info/paged-result"
    />
    <!-- url="/api/app/admission-info/paged-result" -->

    <ol-table
      :paginations="paginations"
      :empty-img="tableData.emptyImg"
      :btnlist="[]"
      url="/api/app/bind-record/bind-record-detail-pages"
      :table-data="tableData"
      :multiple-selection="multipleSelection"
      @SelectionChange="SelectionChange"
      @handleSizeChange="handleSizeChange"
      @handleindexChange="handleindexChange"
    ></ol-table>
    <el-button @click="handlePrint">接口</el-button>
    <el-button @click="onAdd">新建</el-button>
    <el-button @click="onEdit">编辑</el-button>

    <!-- 编辑,查看弹窗 -->
    <el-dialog :title="`${this.form.title}`" :visible.sync="dialogVisible" width="80%">
      <ol-form
        v-if="dialogVisible"
        url="/api/app/admission-info/admission-info"
        :form="form"
        @onCancel="dialogVisible = false"
        @onSubmit="onSubmit"
      />
    </el-dialog>

    <!-- <el-button @click="handlePrint">接口</el-button>

    <div
      class="ellipsis-container"
      id="ellipsis-container"
      v-for="item in 5"
      :key="item"
    >如何处理文本溢出如何实现单行文本溢出显示省略号</div>

    <div class="triangle-up"></div>
    <div class="grid-content">
      <div>11</div>
      <div>11</div>
    </div>

    <div class="container">
      <div class="item">1</div>
      <div class="item item2">2</div>
      <div class="item">3</div>
    </div>

    <div class="square-container">
      <div class="square"></div>
    </div> -->
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
        }, // 序号和复选框
        rows: [
          {
            bindStateEnum: "11",
            tagNumber: "22",
          },
        ], // 表数据
        columns: [
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
      },
      paginations: {
        page: 1, // 当前位于那页面
        total: 10, // 总数
        limit: 30, // 一页显示多少条
        pagetionShow: true,
      },

      formSearchData: {
        reset: true, // 重置
        expendShow: true, // 展开
        tableSearchSlice: 5,
        value: {
          DocNo: null, // 对应输入框的value字段
          QualityCheckStateType: null,
          QualityCheckState: null,
          timer: [],
          range: [10, 200],
        },
        tableSearch: [
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
    handleSearch(from) {
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
    handleSearch(from) {
      this.formSearchData.value = { ...from };
      this.paginations.page = 1;
      this.getTable();
    },
    handleReset() {
      for (let key in this.formSearchData.value) {
        this.formSearchData.value[key] = null;
      }
      this.paginations.page = 1;
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
