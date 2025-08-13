<template>
  <div class="formSearch formSearchArrowUp">
    <div
      v-if="formSearchData.tableSearch && formSearchData.tableSearch.length >= 0"
      class="table-header"
    >
      <el-form
        ref="formSearch"
        size="small"
        :rules="formSearchData.rules"
        :model="formSearch"
        :inline="true"
        label-position="right"
        v-bind="{
          ...(formSearchData.options && formSearchData.options.formProps),
        }"
      >
        <!-- 'label-width': '100px', -->
        <div
          class="transitionGroup"
          :class="[formSearchData.expendShow ? 'formSearchBtnArrowDowns' : 'formSearchBtnArrowUps']"
        >
          <el-form-item
            v-for="item in findTableSearch"
            v-show="!item.show"
            :key="item.value"
            class="table-header-item"
            :label="item.label"
            :prop="item.value"
            v-bind="item.labelProps || {}"
            :class="{
              picker: item.props && item.props.type === 'datetimerange',
              date: item.props && item.props.type === 'date',
            }"
          >
            <!--    <template v-if="item.inputType === 'treeSelect'">
                <slot name="treeSlot"></slot>
              </template> -->
            <Tree-select
              v-if="item.inputType === 'treeSelect'"
              ref="TreeSelectref"
              v-model="formSearch[item.value]"
              v-bind="item.props || {}"
              :options="item.children"
              @getValue="item.change && item.change(formSearch[item.value])"
            />

            <el-select
              v-else-if="item.inputType === 'select'"
              v-model="formSearch[item.value]"
              v-el-select-all="item.loadmores"
              :clearable="item.clearable === undefined || item.clearable"
              v-bind="item.props || {}"
              :placeholder="`请选择${item.placeholder || item.label}`"
              :popper-append-to-body="false"
              @change="item.change && item.change(formSearch[item.value])"
              @keyup.enter.native="handleSearch('formSearch')"
            >
              <el-option
                v-for="option in item.children"
                :key="option.key"
                :label="option.value"
                :value="option.key"
              />
            </el-select>
            <!-- v-bind="item.props || {}" -->
            <el-select
              v-else-if="item.inputType === 'selectTEMP'"
              v-model="formSearch[item.value]"
              v-el-select-all="item.loadmores"
              v-bind="{ clearable: true, ...(item.props || {}) }"
              :placeholder="`请选择${item.placeholder || item.label}`"
              :popper-append-to-body="false"
              @change="item.change && item.change(formSearch[item.value])"
              @keyup.enter.native="handleSearch('formSearch')"
            >
              <el-option
                v-for="option in item.children"
                :key="option.key"
                :label="option.value"
                :value="option.key"
              />
            </el-select>
            <el-select
              v-else-if="item.inputType === 'selectRemoteMethod'"
              v-model="formSearch[item.value]"
              v-el-select-all="item.loadmores"
              filterable
              remote
              clearable
              reserve-keyword
              :placeholder="`请输入至少3位关键字`"
              :remote-method="item.remoteMethod"
              :loading="item.loading"
            >
              <el-option
                v-for="option in item.children"
                :key="option.key"
                :label="option.value"
                :value="option.key"
              />
            </el-select>
            <el-date-picker
              v-else-if="item.inputType === 'picker'"
              v-model="formSearch[item.value]"
              clearable
              style="width: 100%"
              :placeholder="item.props.placeholder || '选择日期'"
              v-bind="item.props || { type: 'date' }"
              :default-time="item.props.type == 'datetimerange' ? ['00:00:00', '23:59:59'] : ''"
            />
            <el-input
              v-else
              v-model="formSearch[item.value]"
              clearable
              v-bind="item.props || {}"
              :type="item.inputType || 'text'"
              :placeholder="`请输入${item.placeholder || item.label}`"
              :maxlength="item.maxlength"
              :oninput="handleChangeInput(item)"
              :class="item.inputType == 'number' ? 'numrule' : ''"
              @keyup.enter.native="handleSearch('formSearch')"
              @keydown.native="keyInput(item, $event)"
              @paste.native="onPaste(item, $event)"
            />
          </el-form-item>
        </div>
        <el-form-item
          style="word-break: keep-all; white-space: nowrap; margin-left: 10px"
          class="fromBtn"
          :class="[formSearchData.expendShow ? 'formSearchBtnArrowDown' : 'formSearchBtnArrowUp']"
        >
          <el-button
            v-if="formSearchData.reset"
            size="small"
            type="primary"
            @click="handleSearch('formSearch')"
            >查询
          </el-button>
          <el-button
            v-if="formSearchData.reset"
            plain
            size="small"
            @click="handleReset('formSearch')"
            >重置</el-button
          >
          <el-button
            v-if="formSearchData.expendShow"
            plain
            size="small"
            :icon="expend ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
            @click="handleExpend('formSearch')"
          >
            {{ expend ? "收起" : "展开" }}</el-button
          >
        </el-form-item>
      </el-form>
    </div>

    <!-- <div class="btnbox">
        <el-form class="demo-form-inline">
          <el-form-item>
            <el-button
              v-for="(btn, index) in btnlist"
              :key="index"
              size="small"
              :type="btn.types ? btn.types : 'primary'"
              @click="btn.method"
              >{{ btn.title }}</el-button
            >
          </el-form-item>
        </el-form>
      </div> -->
  </div>
</template>

<script>
import { getData } from "../../index.js";

export default {
  name: "search",
  directives: {
    "el-select-loadmore": {
      bind(el, binding) {
        // 获取element-ui定义好的scroll盒子
        const SELECTWRAP_DOM = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        SELECTWRAP_DOM.addEventListener("scroll", function () {
          /**
           * scrollHeight 获取元素内容高度(只读)
           * scrollTop 获取或者设置元素的偏移值,常用于, 计算滚动条的位置, 当一个元素的容器没有产生垂直方向的滚动条, 那它的scrollTop的值默认为0.
           * clientHeight 读取元素的可见高度(只读)
           * 如果元素滚动到底, 下面等式返回true, 没有则返回false:
           * ele.scrollHeight - ele.scrollTop === ele.clientHeight;
           */
          const condition = this.scrollHeight - this.scrollTop <= this.clientHeight;
          if (condition > 0 && condition < 2) {
            binding.value();
          }
        });
      },
    },
    "el-select-all": {
      bind(el, binding, vnode) {
        // console.log(binding.value)
        const _that = vnode.context; // 当前vue对象
        const SELECTWRAP_DOM = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        SELECTWRAP_DOM.addEventListener("scroll", function () {
          // console.log(SELECTWRAP_DOM.scrollHeight) // 文档内容的实际高度
          // console.log(SELECTWRAP_DOM.scrollTop) // 滚动条滚动高度
          // console.log(SELECTWRAP_DOM.clientHeight) // 可视窗口高度
          // CONDITION  //滚动条到底了
          const CONDITION =
            SELECTWRAP_DOM.scrollHeight - SELECTWRAP_DOM.scrollTop - 2 <=
            SELECTWRAP_DOM.clientHeight;
          if (CONDITION) {
            binding.value.SELECTWRAP_DOM_index += 10;
            binding.value.fn();
          }
        });
      },
      unbind(el, binding, vnode) {
        // 解除事件监听
        const _that = vnode.context; // 当前vue对象
        const SELECTWRAP_DOM = el.querySelector(".el-select-dropdown .el-select-dropdown__wrap");
        if (SELECTWRAP_DOM) {
          SELECTWRAP_DOM.removeEventListener("scroll", function () {
            binding.value.SELECTWRAP_DOM_index = 0;
          });
        }
      },
    },
  },
  props: {
    url: {
      type: String,
      default: "",
    },
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
        };
      },
    },
    // btnlist: Array,
    tableSearchSlice: {
      type: Number,
      default: 4,
    },
    tableSearch: {
      type: Array,
    },
    rulesLength: {
      type: Boolean,
    },
  },
  data() {
    return {
      findTableSearch: {},
      expend: !this.formSearchData.expendShow,
      formSearch: {
        ...this.formSearchData.value,
      },
      // 自定义指令
      loadmores: {
        fn: this.loadmoreGX,
        SELECTWRAP_DOM_index: 0,
        flage: null,
      },
      tempBoxData: [],
      optionBox: [],
    };
  },
  async created() {
    this.init();
  },
  watch: {
    "formSearchData.value": {
      handler: function (newVal, OldVal) {
        if (newVal) {
          return (this.formSearch = {
            ...newVal,
          });
          // return (this.findTableSearch = { ...newVal });
        }
      },
      deep: true,
    },
  },
  methods: {
    async init() {
      const swaggerData = await getData();
      const swaggersearchColumns = swaggerData.paths[this.url].get.parameters || [];
      swaggersearchColumns.forEach(item => {
        let tempItem = this.formSearchData.tableSearch.find(
          e => e.value.toLowerCase() === item.name.toLowerCase()
        );
        if (tempItem) {
          // 匹配到
          tempItem = { ...item, ...tempItem };
        } else if (item.description) {
          // 未匹配到
          const pushItem = {
            value: item.name,
            label: item.description,
            inputType: "text",
            props: {},
          };
          if (item.schema.enum && Array.isArray(item.schema.enum)) {
            //枚举值
            pushItem.inputType = "select";
            pushItem.children = item.schema.enum.map(e => ({
              key: e,
              value: e,
            }));
          } else if (item.schema.format === "date-time") {
            //日期
            pushItem.inputType = "picker";
            pushItem.props.valueFormat = "yyyy-MM-dd";
            pushItem.props.format = "yyyy/MM/dd";
          } else if (item.schema && item.schema.type === "string") {
            pushItem.inputType = "text";
          }
          this.formSearchData.tableSearch.push(pushItem);
        }
      });

      const tableHasCreatedTime = this.formSearchData.tableSearch.some(
        e => e.value === "createdTime"
      );
      if (!tableHasCreatedTime) {
        //  单独处理创建时间 就是BeginTime，EndTime
        const requiredNames = ["BeginTime", "EndTime"];
        const hseCreatedTime = requiredNames.every(name =>
          swaggersearchColumns.some(item => item.name === name)
        );
        if (hseCreatedTime) {
          this.formSearchData.tableSearch.push({
            label: "创建时间",
            value: "createdTime",
            inputType: "picker",
            props: {
              type: "datetimerange",
              startPlaceholder: "开始时间",
              endPlaceholder: "结束时间",
              placeholder: "选择时间范围",
              valueFormat: "yyyy-MM-dd HH:mm:ss",
              format: "yyyy/MM/dd HH:mm:ss",
            },
          });
        }
      }
      this.findTableSearch =
        this.formSearchData.tableSearch.length > this.tableSearchSlice
          ? this.formSearchData.tableSearch.slice(0, this.tableSearchSlice)
          : this.formSearchData.tableSearch;
      console.log(`\x1b[36m\x1b[4mol插件-搜索框渲染`, this.formSearchData.tableSearch);
    },
    // 树形下拉
    getValue(val) {
      this.$emit("getTreeSelectValue", val);
    },
    // 搜索查询按钮
    handleSearch(formName, item) {
      if (this.formSearch.createdTime) {
        this.formSearch.BeginTime = this.formSearch.createdTime[0];
        this.formSearch.EndTime = this.formSearch.createdTime[1];
      } else {
        this.formSearch.BeginTime = null;
        this.formSearch.EndTime = null;
      }
      const tempFormSearch = Object.assign({}, this.formSearch);
      if (this.formSearchData.rules) {
        return this.$refs[formName].validate(valid => {
          if (!valid) return false;
          this.$emit("handleSearch", tempFormSearch, item);
        });
      }
      this.$emit("handleSearch", tempFormSearch, item);
      console.log(`\x1b[36m\x1b[4mol插件-搜索框查询`, tempFormSearch);
    },
    loadmore(obj) {
      this.$emit("loadmore", obj);
    },
    // 搜索重置按钮
    handleReset(formName) {
      this.$refs[formName].resetFields();
      if (this.formSearchData.reset) {
        for (const key in this.formSearch) {
          if (Object.prototype.toString.call(this.formSearch[key]) === "[object String]") {
            this.formSearch[key] = null;
          } else if (Object.prototype.toString.call(this.formSearch[key]) === "[object Array]") {
            this.formSearch[key] = [];
          } else if (Object.prototype.toString.call(this.formSearch[key]) === "[object Object]") {
            this.formSearch[key] = {};
          } else if (Object.prototype.toString.call(this.formSearch[key]) === "[object Boolean]") {
            this.formSearch[key] = false;
          } else {
            this.formSearch[key] = null;
          }
        }
      } else {
        this.formSearch = {
          ...this.formSearchData.value,
        };
      }
      this.$emit("handleReset", this.formSearch);
      if (this.formSearchData.reset) return false;
      this.handleSearch();
    },
    // 展开和收起
    handleExpend() {
      this.expend = !this.expend; // 展开和收起
      this.findTableSearch = this.expend
        ? this.formSearchData.tableSearch.slice(0, this.formSearchData.tableSearch.length)
        : this.formSearchData.tableSearch.slice(0, this.tableSearchSlice);

      this.$emit("btnHandleExpend", this.expend);
    },
    // input为number校验
    handleChangeInput(item) {
      return item.inputType === "number"
        ? this.handleOnInput(this.formSearch[item.value], item.value, item.max)
        : null;
    },
    keyInput(item, e) {
      if (item.inputType === "number") {
        let key = e.key;
        if (key === "e" || key === "E" || key === "-" || key === "+" || key === ".") {
          e.returnValue = false;
          return false;
        }
        return true;
      }
    },
    // 输入框的粘贴事件
    onPaste(item, e) {
      if (item.inputType === "number") {
        const pastedText = e.clipboardData.getData("text");
        const nonNumericPattern = /[^\d]/g;
        if (nonNumericPattern.test(pastedText)) {
          e.preventDefault();
        }
      }
    },
    // input渲染长度校验
    handleOnInput(val, label, max) {
      if (val && Number(val) <= 0) {
        this.formSearch[label] = 0;
      }
      if (val && Number(val) > max) {
        this.formSearch[label] = max;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.formSearch {
  .el-form-item {
    // width: 21%;
    margin-right: 2px;
    margin-bottom: 5px;

    ::v-deep .el-form-item__label {
      width: 37% !important;
      padding: 0 5px 0 0;
      word-break: keep-all;
      white-space: nowrap;
      font-size: 13px;
    }

    ::v-deep .el-form-item__content {
      width: 63% !important;
    }
  }

  ::v-deep .el-select {
    width: 100% !important;
  }

  ::v-deep .picker {
  }

  .formSearchBtnArrowUp {
    // width: 12%;
    ::v-deep .el-form-item__content {
      width: 130px !important;
    }
  }
}

.formSearchArrowUp {
  // height: auto;
  // overflow: hidden;

  .el-form {
    position: relative;
  }

  .formSearchBtnArrowDown {
    position: absolute;
    top: 0px;
    width: 15%;
    left: 81.5%;

    ::v-deep .el-form-item__content {
      width: 100% !important;

      ::v-deep .el-button {
        // width: 30.3%;
        padding: 7px;
        margin-left: 0px;
        font-size: 13px;
        padding: 5px 10px;
      }
    }
  }
}

.table-header {
  padding-top: 10px;
  border-bottom: 1px #ccc solid;

  ::v-deep .table-header-item {
  }

  .table-header-item .el-form-item {
    width: 100%;
    display: flex;
    margin-bottom: 12px;

    .el-form-item__content,
    .el-select {
      width: 100%;
    }
  }
}

.transitionGroup {
  display: flex;
  flex-wrap: wrap;

  .el-form-item {
    width: calc(100% / 5);
  }

  .picker {
    width: 25%;

    ::v-deep .el-form-item__label {
      width: 27% !important;
      padding: 0 5px 0 0;
      word-break: break-all;
      white-space: nowrap;
    }

    ::v-deep .el-form-item__content {
      width: 73% !important;
      height: 28px;
    }
  }
}

.formSearchBtnArrowDowns {
  .el-form-item {
    width: 20%;
  }
}

.formSearchBtnArrowUps {
  display: inline;
}

.list-enter-active,
.list-leave-active {
  transition: all 1s;
}

.list-enter {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

::v-deep .el-select-dropdown__item.hover {
  background-color: #eff7ff !important;
}

::v-deep .el-select-dropdown__item:hover {
  background-color: #eff7ff !important;
}

::v-deep .el-input.is-disabled {
  ::v-deep .el-input__inner {
    background-color: #eceff8;
    border-color: #eceff8;
  }
}

::v-deep .el-input--small {
  ::v-deep .el-input__inner {
    height: 28px;
    line-height: 28px;
  }
}

.fromBtn {
  ::v-deep .el-button {
    // padding: 7px;
    font-size: 12px;
  }
}

.btnbox {
  .upload-demo {
    display: -webkit-inline-box;
    margin-left: 10px;
  }

  padding: 10px;
}
//解决type=number的上下箭头
::v-deep .numrule input::-webkit-outer-spin-button,
::v-deep .numrule input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
}
::v-deep .numrule input[type="number"] {
  -moz-appearance: textfield !important;
}
// 解决type=number输入中文后光标上移的问题
::v-deep .numrule .el-input__inner {
  line-height: 1px !important;
}
</style>
