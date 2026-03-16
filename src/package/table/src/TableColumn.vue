<!-- src/package/table/src/TableColumn.vue -->
<template>
  <el-table-column
    :key="`${column.prop}-${column.show}`"
    v-if="shouldShow"
    :label="column.label"
    :prop="column.prop"
    :min-width="column.minWidth || '150px'"
    :show-overflow-tooltip="column.overHidden || true"
    :type="column.type || 'normal'"
    v-bind="{
      align: 'center',
      width: column.width,
      fixed: column.fixed || false,
      sortable: column.sortable || false,
      ...column.attrs,
    }"
  >
    <!-- 表头插槽 -->
    <template v-slot:header>
      <el-tooltip v-if="column.prop" :content="`${column.label} ${column.prop}`" placement="top">
        <span>{{ column.label }}</span>
      </el-tooltip>
      <!-- 多级表头无prop无需提示 -->
      <span v-else>{{ column.label }}</span>
    </template>

    <template v-for="(index, name) in $scopedSlots" v-slot:[name]="data">
      <slot :name="name" v-bind="data"></slot>
    </template>
    <!-- 递归渲染子列 -->
    <template v-if="column.children && column.children.length">
      <TableColumn v-for="(child, idx) in column.children" :key="idx" :column="child">
        <!-- 透传插槽 -->
        <template v-for="(slotFn, name) in $scopedSlots" v-slot:[name]="slotProps">
          <slot :name="name" v-bind="slotProps" />
        </template>
      </TableColumn>
    </template>
    <template v-slot="scope" v-if="!column.children">
      <render-dom v-if="column.render" :render="() => column.render(scope.row)" />
      <slot v-else-if="column.renderSlot" :row="scope.row" :name="column.prop" />
      <span v-else>{{ scope.row[column.prop] }}</span>
    </template>
  </el-table-column>
</template>
<script>
export default {
  name: "TableColumn",
  components: {
    renderDom: {
      functional: true,
      props: { render: Function },
      render(h, ctx) {
        return <div>{ctx.props.render()}</div>;
      },
    },
    TableColumn: null, // 递归自身，见下方
  },
  props: {
    column: { type: Object, required: true },
  },
  data() {
    return {};
  },
  // beforeCreate() {
  //   // 递归注册自身
  //   this.$options.components.TableColumn = require("./TableColumn.vue").default;
  // },
  computed: {
    shouldShow() {
      if (this.column.hasOwnProperty("show")) return this.column.show;
      return true;
    },
  },
};
</script>
