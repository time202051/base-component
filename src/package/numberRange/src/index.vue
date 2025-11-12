<template>
  <div class="ol-number-range" :class="{ 'is-disabled': disabled }">
    <el-input
      ref="startInput"
      v-model="startValue"
      type="number"
      :placeholder="startPlaceholder"
      :min="min"
      :max="max"
      :disabled="disabled"
      class="range-input start-input"
      @blur="handleStartBlur"
      @input="handleStartInput"
      @keyup.enter.native="handleStartBlur"
    />
    <span class="range-separator">-</span>
    <el-input
      ref="endInput"
      v-model="endValue"
      type="number"
      :placeholder="endPlaceholder"
      :min="min"
      :max="max"
      :disabled="disabled"
      class="range-input end-input"
      @blur="handleEndBlur"
      @input="handleEndInput"
      @keyup.enter.native="handleEndBlur"
    />
    <i
      v-if="clearable && !disabled && (startValue || endValue)"
      class="el-icon-circle-close clear-icon"
      @click="handleClear"
    />
  </div>
</template>

<script>
export default {
  name: "NumberRange",
  props: {
    value: {
      type: Array,
      default: () => [null, null],
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 999999,
    },
    startPlaceholder: {
      type: String,
      default: "开始数字",
    },
    endPlaceholder: {
      type: String,
      default: "结束数字",
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    // 是否启用默认填充最大最小值
    autoFillDefault: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // 数值精度,类似el-input-Number组件precision
    precision: {
      type: Number,
      default: 0,
      validator(val) {
        return val === undefined || (Number.isInteger(val) && val >= 0);
      },
    },
  },
  data() {
    return {
      startValue: null,
      endValue: null,
    };
  },
  watch: {
    value: {
      handler(newVal) {
        if (Array.isArray(newVal) && newVal.length === 2) {
          this.startValue =
            newVal[0] !== null && newVal[0] !== undefined
              ? this.formatPrecision(Number(newVal[0]))
              : null;
          this.endValue =
            newVal[1] !== null && newVal[1] !== undefined
              ? this.formatPrecision(Number(newVal[1]))
              : null;
        } else {
          this.startValue = null;
          this.endValue = null;
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    // 格式化精度
    formatPrecision(num) {
      if (this.precision !== undefined && this.precision !== null) {
        return Number(Number(num).toFixed(this.precision));
      }
      return num;
    },
    // 处理起始值输入
    handleStartInput(val) {
      if (this.disabled) return;
      if (val === "" || val === null || val === undefined) {
        this.startValue = null;
      } else {
        let num = Number(val);
        // 限制在 min 和 max 范围内
        if (num < this.min) {
          num = this.min;
        } else if (num > this.max) {
          num = this.max;
        }
        // 应用精度
        this.startValue = this.formatPrecision(num);
      }
      this.emitValue();
    },
    // 处理结束值输入
    handleEndInput(val) {
      if (this.disabled) return;
      if (val === "" || val === null || val === undefined) {
        this.endValue = null;
      } else {
        let num = Number(val);
        // 限制在 min 和 max 范围内
        if (num < this.min) {
          num = this.min;
        } else if (num > this.max) {
          num = this.max;
        }
        // 应用精度
        this.endValue = this.formatPrecision(num);
      }
      this.emitValue();
    },
    // 处理起始值失焦
    handleStartBlur() {
      if (this.disabled) return;
      // 只有当启用自动填充默认值，且只输入了起始值，结束值才默认为最大值
      if (this.autoFillDefault && this.startValue !== null && this.endValue === null) {
        this.endValue = this.formatPrecision(this.max);
      }
      // 应用精度
      if (this.startValue !== null) {
        this.startValue = this.formatPrecision(this.startValue);
      }
      // 验证范围
      this.validateRange();
      this.emitValue();
    },
    // 处理结束值失焦
    handleEndBlur() {
      if (this.disabled) return;
      // 只有当启用自动填充默认值，且只输入了结束值，起始值才默认为最小值
      if (this.autoFillDefault && this.endValue !== null && this.startValue === null) {
        this.startValue = this.formatPrecision(this.min);
      }
      // 应用精度
      if (this.endValue !== null) {
        this.endValue = this.formatPrecision(this.endValue);
      }
      // 验证范围
      this.validateRange();
      this.emitValue();
    },
    // 验证范围
    validateRange() {
      if (this.startValue !== null && this.endValue !== null) {
        // 确保起始值不大于结束值
        if (this.startValue > this.endValue) {
          // 如果起始值大于结束值，交换它们
          const temp = this.startValue;
          this.startValue = this.formatPrecision(this.endValue);
          this.endValue = this.formatPrecision(temp);
        }
      }
    },
    // 清空
    handleClear() {
      if (this.disabled) return;
      this.startValue = null;
      this.endValue = null;
      this.emitValue();
    },
    // 触发 v-model 更新
    emitValue() {
      const result = [this.startValue, this.endValue];
      this.$emit("input", result);
      this.$emit("change", result);
    },
  },
};
</script>

<style lang="scss" scoped>
.ol-number-range {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  padding: 0 30px 0 10px;
  box-sizing: border-box;
  height: 32px;
  line-height: 32px;

  &:hover {
    border-color: #c0c4cc;
  }

  &:focus-within {
    border-color: #409eff;
    outline: none;
  }

  .range-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0;
    height: 100%;
    line-height: inherit;

    ::v-deep .el-input__inner {
      border: none;
      padding: 0;
      height: 100%;
      line-height: inherit;
      background: transparent;
      text-align: center;
      font-size: 14px;
      color: #606266;

      &:focus {
        border: none;
        outline: none;
      }

      &::placeholder {
        color: #c0c4cc;
      }
    }

    ::v-deep .el-input__inner::-webkit-outer-spin-button,
    ::v-deep .el-input__inner::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    ::v-deep .el-input__inner[type="number"] {
      -moz-appearance: textfield;
      appearance: textfield;
    }
  }

  .start-input {
    ::v-deep .el-input__inner {
      text-align: center;
    }
  }

  .end-input {
    ::v-deep .el-input__inner {
      text-align: center;
    }
  }

  .range-separator {
    flex-shrink: 0;
    padding: 0 8px;
    color: #c0c4cc;
    font-size: 14px;
    line-height: 1;
  }

  .clear-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #c0c4cc;
    font-size: 14px;
    transition: color 0.2s;
    z-index: 1;

    &:hover {
      color: #909399;
    }
  }
}

// 小尺寸适配
::v-deep .el-form-item--small .ol-number-range {
  padding: 0 30px 0 10px;
  height: 28px;
  line-height: 28px;

  .range-input {
    height: 28px;
    line-height: 28px;

    ::v-deep .el-input__inner {
      height: 28px;
      line-height: 28px;
      font-size: 13px;
    }
  }
}

// 禁用状态
.ol-number-range.is-disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  cursor: not-allowed;

  .range-input {
    ::v-deep .el-input__inner {
      background-color: #f5f7fa;
      color: #c0c4cc;
      cursor: not-allowed;
    }
  }

  .clear-icon {
    display: none;
  }
}
</style>
