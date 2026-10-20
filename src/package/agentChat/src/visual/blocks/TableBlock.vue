<template>
  <div class="ol-report__card ol-table-block">
    <div v-if="block.title" class="ol-report__card-title">{{ block.title }}</div>
    <div class="ol-table-block__wrap">
      <table class="ol-table-block__table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in rows" :key="ri">
            <td
              v-for="col in columns"
              :key="col"
              :class="{ 'is-num': isNumber(row[col]) }"
            >
              {{ formatCell(row[col]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "ol-table-block",
  props: {
    block: { type: Object, default: () => ({}) },
    theme: { type: String, default: "light" },
  },
  computed: {
    columns() {
      return Array.isArray(this.block && this.block.columns) ? this.block.columns : [];
    },
    rows() {
      return Array.isArray(this.block && this.block.rows) ? this.block.rows : [];
    },
  },
  methods: {
    isNumber(value) {
      return typeof value === "number" && Number.isFinite(value);
    },
    formatCell(value) {
      if (value === null || value === undefined || value === "") return "—";
      if (this.isNumber(value)) {
        return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
      }
      return value;
    },
  },
};
</script>

<style scoped>
.ol-table-block {
  padding: 12px 14px 8px;
  min-width: 0;
}
.ol-table-block__wrap {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}
.ol-table-block__wrap::-webkit-scrollbar {
  height: 6px;
}
.ol-table-block__wrap::-webkit-scrollbar-thumb {
  background: var(--ol-border);
  border-radius: 3px;
}
.ol-table-block__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  white-space: nowrap;
}
.ol-table-block__table th {
  padding: 7px 10px;
  text-align: left;
  font-weight: 600;
  color: var(--ol-text-2);
  background: var(--ol-surface-2);
  border-bottom: 1px solid var(--ol-border);
}
.ol-table-block__table td {
  padding: 7px 10px;
  color: var(--ol-text-1);
  border-bottom: 1px solid var(--ol-border);
}
.ol-table-block__table tbody tr:last-child td {
  border-bottom: none;
}
.ol-table-block__table tbody tr:nth-child(even) td {
  background: var(--ol-surface-2);
}
.ol-table-block__table .is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: var(--ol-number-font);
}
</style>
