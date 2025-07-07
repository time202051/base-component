<template>
  <div>
    <el-dialog
      v-el-drag-dialog
      :title="gettitle"
      :visible.sync="form.dialogFormVisible"
      :close-on-click-modal="false"
      :width="form.width || '45%'"
      :show-close="true"
      top="5vh"
      @close="resetForm('form')"
      @open="handleOpen('form')"
    >
      <el-form
        ref="form"
        :model="form.value"
        :rules="form.rules"
        label-width="130px"
        style="display: flex; flex-wrap: wrap"
      >
        <el-form-item
          v-for="(item, index) in form.model"
          :key="index"
          :label="item.label"
          :prop="item.prop"
          :required="item.required || false"
          :style="{ width: width(item) }"
        >
          <el-input
            v-if="item.type == 'input'"
            v-model="form.value[item.prop]"
            :placeholder="
              item.readonly
                ? item.placeholder || item.label
                : `请输入${item.placeholder || item.label}`
            "
            :clearable="item.clearable || true"
            :readonly="item.readonly || false"
            :disabled="item.disabled || false"
            :show-password="item.showPassword || false"
          />
          <el-input-number
            v-if="item.type == 'number'"
            v-model="form.value[item.prop]"
            :placeholder="`请输入${item.placeholder || item.label}`"
            :clearable="item.clearable || true"
            :readonly="item.readonly || false"
            :min="item.props.min || 0"
            v-bind="item.props || {}"
          />
          <el-input
            v-if="item.type == 'textarea'"
            v-model="form.value[item.prop]"
            type="textarea"
            :placeholder="`请输入${item.placeholder || item.label}`"
            :autosize="item.autosize"
            :readonly="item.readonly || false"
            :clearable="item.clearable || true"
            :maxlength="item.length || ''"
          />
          <el-switch
            v-if="item.type == 'switch'"
            v-model="form.value[item.prop]"
            class="switchStyle"
            active-text="启用"
            inactive-text="禁用"
          />
          <el-radio-group
            v-if="item.type == 'radio'"
            v-model="form.value[item.prop]"
          >
            <el-radio
              v-for="(ctem, cindex) in item.child"
              :key="ctem.key"
              :label="ctem.key"
              >{{ ctem.value }}</el-radio
            >
          </el-radio-group>
          <el-date-picker
            v-if="item.type == 'date'"
            v-model="form.value[item.prop]"
            v-bind="item.props || { type: 'date' }"
            :placeholder="item.placeholder || '请选择日期'"
            style="width: 100%"
            :clearable="item.clearable || true"
          />
          <Tree-select
            v-if="item.type == 'treeSelect'"
            v-model="form.value[item.prop]"
            v-bind="item.props || {}"
            :options="item.child"
            @getValue="item.change && item.change(form.value[item.prop])"
          />
          <!-- @change="
                item.change
                  ? item.change(form.value[item.prop])
                  : selectChange(item, form.value[item.prop])
              " -->
          <el-select
            v-if="item.type == 'select'"
            v-model="form.value[item.prop]"
            :placeholder="`请选择${item.placeholder || item.label}`"
            :clearable="'clearable' in item ? item.clearable : true"
            :disabled="item.disabled || false"
            v-bind="item.props || {}"
            v-on="{
              ...(item.listeners || {}),
              change: () => selectChangeHandler(item, form.value[item.prop]),
            }"
          >
            <el-option
              v-for="(jtem, jindex) in item.child"
              :key="jindex"
              :label="jtem.value"
              :value="jtem.key"
            />
          </el-select>
          <div v-if="item.type == 'inputSpecial'">
            <el-col :span="6">
              <el-form-item :prop="item.layerprop">
                <el-input
                  v-model="form.value[item.layerprop]"
                  :clearable="item.clearable || true"
                />
              </el-form-item>
            </el-col>
            <el-col class="line" style="text-align: center" :span="3"
              >-
            </el-col>
            <el-col :span="6">
              <el-form-item :prop="item.rowprop">
                <el-input
                  v-model="form.value[item.rowprop]"
                  :clearable="item.clearable || true"
                />
              </el-form-item>
            </el-col>
            <el-col class="line" style="text-align: center" :span="3"
              >-
            </el-col>
            <el-col :span="6">
              <el-form-item :prop="item.columnprop">
                <el-input
                  v-model="form.value[item.columnprop]"
                  :clearable="item.clearable || true"
                />
              </el-form-item>
            </el-col>
          </div>
          <!-- 自定义输入框插槽 -->
          <template v-if="item.type == 'slot'">
            <slot :name="item.name" :item="item" />
          </template>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resetForm('form')">取 消</el-button>
        <el-button
          v-if="form.requestData.methodsType != 'get'"
          type="primary"
          @click="submitForm('form')"
          >确 定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
/**
   * 参数
   *  dialogFormVisible:false,//弹窗显示
   *  title:'',//标题
   *  width:'',//弹窗宽度
   model:[{
   label: "test",
   type: "input",
   prop: "code",
   }],//表单数据
   rules:[],//表单规则
   value:{},//双向绑定的值
   requestData:{},//接口地址及传参的数据
   */
export default {
  name: "dialogTemplate",
  props: {
    form: Object,
  },
  data() {
    return {};
  },
  computed: {
    width() {
      return function (item) {
        if (this.form.model.length > 18 && item.type != "textarea") {
          return "25%";
        } else if (
          this.form.model.length > 10 &&
          this.form.model.length <= 18 &&
          item.type != "textarea"
        ) {
          return "calc(100% / 3)";
        } else if (
          this.form.model.length > 6 &&
          this.form.model.length <= 10 &&
          item.type != "textarea"
        ) {
          return "50%";
        } else {
          return item.type == "textarea" && item.width ? item.width : "100%";
        }
      };
    },
    gettitle() {
      //  如果传入是
      if (this.form.title && !this.form.titleAdd) {
        return this.form.title;
      } else if (this.form.titleAdd) {
        if (this.form.requestData.flage == "add") {
          return "添加";
        } else {
          return "编辑";
        }
      } else {
        return "提示";
      }
    },
  },
  methods: {
    selectChangeHandler(item, val) {
      if (item.change) {
        item.change(this.form.value[item.prop]);
      } else if (item.listeners && item.listeners.change) {
        item.listeners.change(item, this.form.value[item.prop]);
      } else {
        this.selectChange(item, this.form.value[item.prop]);
      }
    },
    selectChange(obj, val) {
      let temp = {
        obj: obj,
        val: val,
      };
      this.$emit("selectChange", temp);
    },

    submitForm(formName) {
      console.log("form", this.form);

      this.$refs[formName].validate((valid) => {
        if (valid) {
          /**
           * 翻包工位配置 特殊处理业务
           */
          if (this.form.requestData.specialFn) {
            if (!this.form.value.businessType && !this.form.value.boxModel) {
              return this.$message.error("业务类型和空容器型号必填一个");
            }
          }
          /**
           * 质检单 - 质检单明细
           */
          if (this.form.requestData.flage == "zjDetail") {
            return this.$emit("newRequest", this.form.value);
          }
          if (this.form.requestData.flage == "update") {
            this.put({
              url: this.form.requestData.url + "/" + this.form.value.id,
              data: this.form.value,
              isLoading: true,
            }).then((res) => {
              this.form.requestData.fn();
              this.form.dialogFormVisible = false;
              this.$message({
                type: "success",
                message: "操作成功!",
              });
            });
          } else {
            /**
             * flage == "autoArrange"
             * 弹框方法不用内部  用外部方法
             */
            if (this.form.requestData.flage == "autoArrange") {
              return this.$emit("submitForm", "form");
            }
            /**
             * 默认请求地址
             */
            let url = this.form.requestData.url;
            /**
             * task 页面路径名字
             * 特殊页面   弹框标识 flages 参数接在url 后面
             */
            if (this.form.requestData.flages) {
              let joinData = this.form.requestData.joinData;
              let str = "";
              for (let i = 0; i < joinData.length; i++) {
                str += `${i == 0 ? "?" : "&"}${joinData[i]}=${
                  this.form.value[joinData[i]]
                }`;
              }
              url = this.form.requestData.url + str;
            }
            /**
             * 弹框可能是get请求
             */
            if (
              this.form.requestData.methodsType &&
              this.form.requestData.methodsType == "get"
            ) {
              return this.get({
                url: url,
                data: this.form.value,
                isLoading: true,
              }).then((res) => {
                this.form.requestData.fn();
                this.form.dialogFormVisible = false;
                this.$message({
                  type: "success",
                  message: "操作成功!",
                });
              });
            }
            /**
             * 弹框可能是post请求
             * 默认
             */
            this.post({
              url: url,
              data: this.form.value,
              isLoading: true,
            }).then((res) => {
              this.form.requestData.fn();
              this.form.dialogFormVisible = false;
              this.$message({
                type: "success",
                message: "操作成功!",
              });
            });
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    closeD(formName) {
      this.form.dialogFormVisible = false;
    },
    resetForm(formName) {
      this.$emit("close");
      if (this.form.requestData.flage == "autoArrange") {
        return this.$emit("resetForm");
      }
      this.$refs[formName].resetFields();
      this.form.dialogFormVisible = false;
    },
    handleOpen(formName) {
      this.$nextTick(() => {
        this.$refs[formName].clearValidate();
      });
    },
  },
};
</script>
<style lang="scss">
.el-dialog__header {
  background-color: #008cff !important;
  padding: 10px 15px;
  text-align: left;
  .el-dialog__title,
  .el-dialog__headerbtn i {
    color: white;
  }
}
.el-dialog__body {
  padding: 25px 20px;
}
.el-dialog__close {
  cursor: pointer !important;
  font-size: 20px !important;
  position: relative !important;
  top: -11px !important;
  color: #fff !important;
  border-radius: 50% !important;
  text-align: center !important;
  height: 30px !important;
  width: 30px !important;
  line-height: 30px !important;
  vertical-align: middle !important;
  right: -13px !important;
}
.el-select,
.el-input-number {
  width: 100% !important;
}
.activeWidth {
  width: 50% !important;
}
.switchStyle .el-switch__label {
  position: absolute;
  display: none;
  color: #fff;
}
.switchStyle .el-switch__label--left {
  z-index: 9;
  left: 20px;
}
.switchStyle .el-switch__label--right {
  z-index: 9;
}
.switchStyle .el-switch__label.is-active {
  display: block;
}
.switchStyle.el-switch .el-switch__core,
.el-switch .el-switch__label {
  width: 60px !important;
}
</style>
