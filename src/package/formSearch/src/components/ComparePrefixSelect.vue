<template>
  <el-select
    :value="value"
    size="mini"
    :popper-append-to-body="false"
    class="compare-prefix-select"
    @change="$emit('change', $event)"
    @click.native.stop
  >
    <el-option
      v-for="opt in compareOptions"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>

<script>
export const COMPARE_OPTIONS = [
  { label: "范围", value: "range" },
  { label: "包含于", value: "in" },
  { label: "不包含于", value: "not in" },
  { label: "等于", value: "eq" },
  { label: "不等于", value: "ne" },
  { label: "大于", value: "gt" },
  { label: "大于等于", value: "ge" },
  { label: "小于", value: "lt" },
  { label: "小于等于", value: "le" },
  { label: "包含", value: "contains" },
  { label: "以...开始", value: "startswith" },
  { label: "以...结束", value: "endswith" },
];

export default {
  name: "ComparePrefixSelect",
  props: {
    value: {
      type: String,
      default: "contains",
    },
  },
  data() {
    return {
      compareOptions: COMPARE_OPTIONS,
    };
  },
};
</script>

<style lang="scss" scoped>
.compare-prefix-select {
  width: 44px !important;
  flex: none !important;

  ::v-deep .el-input__inner {
    padding: 0 2px;
    min-width: 36px;
    text-align: center;
    color: #909399;
    background: #f5f7fa;
    border-color: #e4e7ed;
    font-size: 12px;
  }

  ::v-deep .el-select__caret {
    display: none;
  }
}
</style>
