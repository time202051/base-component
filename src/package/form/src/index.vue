<template>
  <div>
    <el-form
      ref="formRef"
      :model="form.value"
      :rules="form.rules"
      style="display: flex; flex-wrap: wrap"
      v-bind="{
        labelWidth: '130px',
        disabled: !form.type,
        ...$attrs,
        ...form.attrs,
      }"
      v-on="$listeners"
    >
      <template v-for="(item, index) in form.model">
        <el-form-item
          v-if="!item.hidden"
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
            :show-password="item.showPassword || false"
            v-bind="{
              ...item.props,
              disabled: inputDisabled(item),
            }"
          />
          <el-input-number
            v-else-if="item.type == 'number'"
            v-model="form.value[item.prop]"
            :placeholder="`请输入${item.placeholder || item.label}`"
            :clearable="item.clearable || true"
            :readonly="item.readonly || false"
            v-bind="{ min: 0, ...item.props }"
          />
          <el-input
            v-else-if="item.type == 'textarea'"
            v-model="form.value[item.prop]"
            type="textarea"
            :placeholder="`请输入${item.placeholder || item.label}`"
            :autosize="item.autosize"
            :readonly="item.readonly || false"
            :clearable="item.clearable || true"
            :maxlength="item.length || ''"
          />
          <el-switch
            v-else-if="item.type == 'switch'"
            v-model="form.value[item.prop]"
            class="switchStyle"
            active-text="启用"
            inactive-text="禁用"
            v-bind="item.props || {}"
          />
          <el-radio-group v-else-if="item.type == 'radio'" v-model="form.value[item.prop]">
            <el-radio v-for="ctem in item.children" :key="ctem.key" :label="ctem.key">{{
              ctem.value
            }}</el-radio>
          </el-radio-group>
          <!-- v-bind="item.props || { type: 'date' }" -->
          <el-date-picker
            v-else-if="item.type == 'date'"
            v-model="form.value[item.prop]"
            :placeholder="item.placeholder || '请选择日期'"
            style="width: 100%"
            v-bind="{ type: 'date', ...item.props }"
            :clearable="item.clearable || true"
            v-on="{
              ...item.listeners,
              change: event => changeHandle(event, item),
            }"
          />
          <Tree-select
            v-else-if="item.type == 'treeSelect'"
            v-model="form.value[item.prop]"
            v-bind="item.props || {}"
            :options="item.children"
            @getValue="item.change && item.change(form.value[item.prop])"
          />
          <!-- <el-select v-else-if="item.type == 'select'" v-model="form.value[item.prop]"
                  :placeholder="`请选择${item.placeholder || item.label}`"
                  :clearable="'clearable' in item ? item.clearable : true" :disabled="item.disabled || false"
                  v-bind="item.props || {}" v-on="{ ...item.listeners, change: selectChangeHandle(item) }">
                  <el-option v-for="(jtem, jindex) in item.children" :key="jindex" :label="jtem.value"
                      :value="jtem.key"></el-option>
              </el-select> -->
          <!-- v-on="{ ...item.listeners, change: (event) => selectChangeHandle(event,
          item), }" -->
          <el-select
            v-else-if="item.type == 'select'"
            v-model="form.value[item.prop]"
            :placeholder="`请选择${item.placeholder || item.label}`"
            :clearable="'clearable' in item ? item.clearable : true"
            v-bind="{ disabled: !!item.disabled, ...(item.props || {}) }"
            v-on="{
              ...item.listeners,
              change: event => selectChangeHandle(event, item),
            }"
            @keyup.native="
              $event =>
                item.keyup({
                  event: $event,
                  item,
                  form: form.value,
                })
            "
          >
            <el-option
              v-for="(jtem, jindex) in item.children"
              :key="jindex"
              :label="jtem.value"
              :value="jtem.key"
            />
          </el-select>
          <ol-number-range
            v-else-if="item.type === 'numberRange'"
            v-model="form.value[item.prop]"
            v-bind="item.props || {}"
            v-on="{ ...item.listeners, change: val => item.listeners && item.listeners.change && item.listeners.change({ item, val }) }"
          ></ol-number-range>

          <div v-else-if="item.type == 'inputSpecial'">
            <el-col :span="6">
              <el-form-item :prop="item.layerprop">
                <el-input
                  v-model="form.value[item.layerprop]"
                  :clearable="item.clearable || true"
                />
              </el-form-item>
            </el-col>
            <el-col class="line" style="text-align: center" :span="3">- </el-col>
            <el-col :span="6">
              <el-form-item :prop="item.rowprop">
                <el-input v-model="form.value[item.rowprop]" :clearable="item.clearable || true" />
              </el-form-item>
            </el-col>
            <el-col class="line" style="text-align: center" :span="3">- </el-col>
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
          <template v-else-if="item.type == 'slot'">
            <slot :name="item.name" :item="item" />
          </template>
          <!-- 兜底 -->
          <div v-else style="color: red">"{{ item.type }}"类型暂不支持，请手动添加</div>
        </el-form-item>
      </template>
    </el-form>
    <div v-if="showBtn" slot="footer" class="dialog-footer">
      <slot v-if="$slots.btnSlot" name="btnSlot" :form="form" />
      <template v-else>
        <el-button @click="onCancel">取消</el-button>
        <el-button v-if="form.type" type="primary" @click="onConfirm">确定</el-button>
      </template>
      <slot name="btnAfterSlot" />
    </div>
  </div>
</template>
<!--
  # BaseForm 基础表单组件
  
  ## Props 属性
  | 属性名        | 类型      | 默认值  | 必填  | 说明          |
  |-------------|----------|---------|------|--------------|
  | form        | Object   | -       | 是    | 表单配置对象    |
  | defaultValue| Object   | {}      | 否    | 表单默认值      |
  | showBtn     | Boolean  | true    | 否    | 是否显示底部按钮 |
  
  ## form 对象结构
  {
    type: Number,      // 表单类型：0-详情，1-新建，2-编辑
    title: String,     // 表单标题（会根据type自动设置）
    value: Object,     // 表单数据对象
    rules: Object,     // 表单验证规则
    attrs: Object,     // el-form的属性配置
    model: Array       // 表单项配置数组
  }
  
  ## model 项配置
  | 字段         | 类型            | 说明    |
  |-------------|----------------|---------|
  | type        | String         | 表单项类型：input/number/textarea/switch/radio/date/treeSelect/select/projectCodeSelect/inputSpecial/slot |
  | label       | String         | 表单项标签 |
  | prop        | String         | 表单项字段名 |
  | placeholder | String         | 占位文本 |
  | required    | Boolean        | 是否必填 |
  | hidden      | Boolean        | 是否隐藏 |
  | clearable   | Boolean        | 是否可清空 |
  | readonly    | Boolean        | 是否只读 |
  | disabled    | Boolean/Function| 是否禁用 |
  | props       | Object         | 对应表单控件的属性配置 |
  | listeners   | Object         | 事件监听器配置 |
  
  ## Events 事件
  | 事件名        | 说明          | 回调参数 |
  |-------------|---------------|---------|
  | onSubmit    | 表单提交事件    | {form: 表单配置, data: 表单数据} |
  | onCancel    | 取消按钮点击事件 | - |
  | selectChange| 选择器值变化事件 | {obj: 当前项配置, val: 变化后的值} |
  -->
<script>
import { initForm } from "../../../utils/initData.js";
import OlNumberRange from "../../numberRange/index.js";

// interface FormItem {
//   type: Number;
//   title?: String;
//   model: IModelItem[]; //src\utils\interface\dialogInterface.ts
//   rules:Form.rules;
//   attrs: Form; //import { Form } from "element-ui";
// }
export default {
  name: "form",
  components: {
    OlNumberRange,
  },
  props: {
    url: {
      type: String,
      // default: "/api/app/warehouse/warehouse",
      default: "",
    },
    form: Object,
    // 默认值
    defaultValue: {
      type: Object,
      default: () => ({}),
    },
    showBtn: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      // model: [],
      formInit: {}, // 初始化表单，用于重置表单用
      // formValue: {}, // 表单数据
    };
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
  },
  watch: {
    // 副作用以便父级直接使用
    "form.type": {
      handler(newValue) {
        // 如果没有type则默认值为1
        if (!Object.keys(this.form).includes("type")) {
          this.$set(this.form, "type", 1);
        }
        let result;
        switch (newValue) {
          case 0:
            result = "详情"; // 当 newValue 为 0 时，标题为 "详情"
            break;
          case 1:
            result = "新建";
            break;
          case 2:
            result = "编辑";
            break;
          default:
            result = "弹框";
            break;
        }
        this.form.title = result;
      },
      immediate: true,
    },
    // "form.model": {
    //   handler() {

    //   },
    //   immediate: true,
    //   deep: true
    // }
  },
  created() {
    // 默认值复制
    if (Object.keys(this.defaultValue) && Object.keys(this.defaultValue).length) {
      Object.keys(this.defaultValue).forEach(key => {
        form.value[key] = this.defaultValue[key];
      });
    }
    initForm({
      url: this.url,
      form: this.form,
    });
  },
  // beforeDestroy() {},
  methods: {
    // 保留之前的change调用方式，并添扩展新的
    selectChangeHandle(val, item) {
      (item &&
        item.listeners &&
        item.listeners.change &&
        item.listeners.change(item, this.form.value[item.prop])) ||
      item.change
        ? item.change(val)
        : this.selectChange(item, val);
    },
    changeHandle(val, item) {
      if (
        item &&
        item.listeners &&
        item.listeners.change &&
        item.listeners.change(item, this.form.value[item.prop])
      ) {
        this.selectChange(item, val);
      }
    },
    selectChange(obj, val) {
      const temp = {
        obj: obj,
        val: val,
      };
      this.$emit("selectChange", temp);
    },
    inputDisabled(item) {
      if (!item.props) return false;
      if (!Object.keys(item.props).includes("disabled")) return false;
      // disabled是函数还是Boolean值，如果boolean值直接返回，如果是函数执行函数并返回boolean
      return typeof item.props.disabled === "function"
        ? item.props.disabled({ item, form: this.form })
        : item.props.disabled;
    },
    validate() {
      return new Promise((resolve, reject) => {
        this.$refs.formRef.validate(valid => {
          if (valid) {
            resolve({
              valid,
              formData: (this.form && this.form.value) || {},
            });
          } else {
            reject("表单验证失败");
          }
        });
      });
    },
    onCancel() {
      this.$refs.formRef.resetFields();
      this.$refs.formRef.clearValidate();
      this.$emit("onCancel");
    },
    onConfirm() {
      console.log("BaseForm数据", this.form);
      this.validate()
        .then(() => {
          this.$emit("onSubmit", { form: this.form, data: this.form.value });
        })
        .catch(err => {
          console.log("校验失败", err);
        });
    },
  },
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
