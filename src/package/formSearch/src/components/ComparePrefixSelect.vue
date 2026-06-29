<template>
  <div style="width: 75px">
    <el-select
      :value="value"
      :popper-append-to-body="false"
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
  </div>
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
