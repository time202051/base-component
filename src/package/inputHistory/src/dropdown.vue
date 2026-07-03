<template>
  <div
    v-show="visible && filteredRecords.length > 0"
    class="input-history-dropdown"
    @mousedown.prevent
  >
    <div
      v-for="(value, index) in filteredRecords"
      :key="index"
      :class="['input-history-item', { 'is-active': index === selectedIndex }]"
      @mousedown.stop="selectItem(value)"
      @mouseenter="selectedIndex = index"
    >
      {{ value }}
    </div>
  </div>
</template>

<script>
import Fuse from "fuse.js";
import { convertToPinyin } from "tiny-pinyin";

export default {
  name: "InputHistoryDropdown",
  props: {
    visible: { type: Boolean, default: false },
    records: { type: Array, default: () => [] },
    selectedIndex: { type: Number, default: -1 },
  },
  data() {
    return {
      query: "",
    };
  },
  computed: {
    filteredRecords() {
      const q = (this.query || "").trim();
      if (!q) return [];
      const plain = JSON.parse(JSON.stringify(this.records));
      // 每条记录附带拼音全文 + 首字母缩写，Fuse 同时匹配三者
      const items = plain.map((v) => {
        const fullPy = convertToPinyin(v || "", "", true);
        // 首字母缩写：空格分隔每个字的拼音，取首字母
        const initials = convertToPinyin(v || "", " ", true)
          .split(" ")
          .map((s) => s[0] || "")
          .join("");
        return { original: v, py: fullPy, pyInitials: initials };
      });
      const fuse = new Fuse(items, {
        keys: ["original", "py", "pyInitials"],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 1,
      });
      const results = fuse.search(q);
      return results.map((r) => {
        // 直接是 item 对象 { original, py, pyInitials }
        if (r && r.original) return r.original;
        // 包了 FuseResult { item: { original, py, pyInitials } }
        if (r && r.item && r.item.original) return r.item.original;
        // 纯索引数字
        return plain[r];
      });
    },
  },
  methods: {
    setQuery(val) {
      this.query = val || "";
    },
    selectItem(value) {
      this.$emit("select", value);
    },
  },
};
</script>

<style lang="scss">
.input-history-dropdown {
  position: fixed;
  z-index: 10000;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;

  .input-history-item {
    padding: 0 12px;
    height: 36px;
    line-height: 36px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    color: #606266;
    white-space: nowrap;

    &:hover,
    &.is-active {
      background: #f5f7fa;
    }
  }
}
</style>
