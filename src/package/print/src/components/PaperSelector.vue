<template>
  <div class="paper-selector">
    <el-button-group>
      <el-button
        v-for="(value, type) in paperTypes"
        :key="type"
        :type="curPaperType === type ? 'primary' : 'default'"
        size="small"
        @click="setPaper(type, value)"
      >
        {{ type }}
      </el-button>
      <el-button
        :type="curPaperType === 'other' ? 'primary' : 'default'"
        size="small"
        @click="showPaperPop"
      >
        自定义纸张
      </el-button>
    </el-button-group>

    <el-dialog
      title="设置纸张宽高(mm)"
      :visible.sync="paperPopVisible"
      width="400px"
      :append-to-body="true"
    >
      <el-form label-width="80px">
        <el-form-item label="纸张宽度">
          <el-input v-model="paperWidth" type="number" placeholder="宽(mm)" />
        </el-form-item>
        <el-form-item label="纸张高度">
          <el-input v-model="paperHeight" type="number" placeholder="高(mm)" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="hidePaperPop">取消</el-button>
        <el-button type="primary" @click="setPaperOther">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "PaperSelector",
  props: {
    hiprintTemplate: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      curPaper: {
        type: "A4",
        width: 210,
        height: 296.6,
      },
      paperTypes: {
        A3: { width: 420, height: 296.6 },
        A4: { width: 210, height: 296.6 },
        A5: { width: 210, height: 147.6 },
        B3: { width: 500, height: 352.6 },
        B4: { width: 250, height: 352.6 },
        B5: { width: 250, height: 175.6 },
      },
      paperPopVisible: false,
      paperWidth: "220",
      paperHeight: "80",
    };
  },
  computed: {
    curPaperType() {
      let type = "other";
      let types = this.paperTypes;
      for (const key in types) {
        let item = types[key];
        let { width, height } = this.curPaper;
        if (item.width === width && item.height === height) {
          type = key;
        }
      }
      return type;
    },
  },
  methods: {
    showPaperPop() {
      this.paperPopVisible = true;
    },
    hidePaperPop() {
      this.paperPopVisible = false;
    },
    setPaper(type, value) {
      try {
        if (Object.keys(this.paperTypes).includes(type)) {
          this.curPaper = { type: type, width: value.width, height: value.height };
          this.hiprintTemplate.setPaper(value.width, value.height);
        } else {
          this.curPaper = { type: "other", width: value.width, height: value.height };
          this.hiprintTemplate.setPaper(value.width, value.height);
        }
        this.$emit("change", this.curPaper);
      } catch (error) {
        this.$message.error(`操作失败: ${error}`);
      }
    },
    setPaperOther() {
      let value = {};
      value.width = Number(this.paperWidth);
      value.height = Number(this.paperHeight);
      this.paperPopVisible = false;
      this.setPaper("other", value);
    },
  },
};
</script>

<style scoped>
.paper-selector {
  display: inline-block;
}
</style>
