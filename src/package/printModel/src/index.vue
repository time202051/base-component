<template>
  <div>
    <div class="print-manage-container">
      <div class="left-panel">
        <div class="panel-title">菜单树</div>
        <el-tree
          :data="menuTreeData"
          :props="treeProps"
          node-key="id"
          :current-node-key="currentMenuId"
          default-expand-all
          :expand-on-click-node="false"
          highlight-current
          @node-click="handleNodeClick"
        >
        </el-tree>
      </div>
      <div class="right-panel">
        <div class="panel-header">
          <span class="panel-title">{{ currentMenuName }} - 打印模板</span>
          <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">
            新增模板
          </el-button>
        </div>
        <div class="template-list">
          <div v-if="templateList.length === 0" class="empty-card" @click="handleAdd">
            <i class="el-icon-plus add-icon"></i>
            <span class="add-text">点击添加模板</span>
          </div>
          <div v-for="template in templateList" :key="template.id" class="template-card">
            <div class="card-header">
              <i class="el-icon-document card-icon"></i>
              <span class="card-title">{{ template.templeteName }}</span>
            </div>
            <div class="card-body">
              <div class="card-info">
                <span class="info-label">备注：</span>
                <span class="info-value">{{ template.remark || "无" }}</span>
              </div>
              <div class="card-info">
                <span class="info-label">数据源URL：</span>
                <span class="info-value">{{ template.printUrl || "无" }}</span>
              </div>
            </div>
            <div class="card-footer">
              <el-button type="text" size="small" icon="el-icon-edit" @click="handleEdit(template)">
                编辑
              </el-button>
              <el-button
                type="text"
                size="small"
                icon="el-icon-delete"
                class="delete-btn"
                @click="handleDelete(template)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-dialog
        :title="dialogTitle"
        :visible.sync="dialogVisible"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-form-item label="模板名称" prop="templeteName">
            <el-input v-model="form.templeteName" placeholder="请输入模板名称"></el-input>
          </el-form-item>
          <el-form-item label="创建模板" prop="templeteJson">
            <span style="margin-right: 10px">{{ form.templeteJson ? "已创建" : "未创建" }}</span>
            <el-button type="primary" @click="handleCreateTemplate">创建模板</el-button>
          </el-form-item>
          <el-form-item label="数据源URL" prop="printUrl">
            <el-input
              v-model="form.printUrl"
              placeholder="请输入数据源URL"
              @blur="form.printUrl = form.printUrl && form.printUrl.trim()"
            ></el-input>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            ></el-input>
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
export default {
  name: "print-model",
  data() {
    return {
      menuTreeData: [],
      treeProps: {
        label: "title",
        children: "child",
      },
      currentMenuId: null,
      currentMenuName: "全部",
      currentItem: {},
      templateList: [],
      dialogVisible: false,
      dialogTitle: "新增模板",
      form: {
        id: null,
        templeteName: "",
        remark: "",
        templeteJson: "",
        printUrl: "",
      },
      rules: {
        templeteName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
        templeteJson: [{ required: true, message: "请输入模板JSON", trigger: "blur" }],
      },
    };
  },
  mounted() {
    this.initMenuTree();
  },
  methods: {
    initMenuTree() {
      const wms = JSON.parse(localStorage.getItem("wms") || "{}");
      const menus = wms.SET_MENUS || [];
      this.menuTreeData = this.buildTreeData(menus);
      const firstNode = this.findFirstMenuNode(this.menuTreeData);
      if (firstNode) {
        this.currentMenuId = firstNode.id;
        this.currentMenuName = firstNode.title;
        this.currentItem = firstNode;
        this.loadTemplates(firstNode.id);
      }
    },
    findFirstMenuNode(menus) {
      if (!menus || menus.length === 0) return null;
      for (const menu of menus) {
        if (menu.child && menu.child.length > 0) {
          const found = this.findFirstMenuNode(menu.child);
          if (found) return found;
        }
        return menu;
      }
      return null;
    },
    buildTreeData(menus) {
      return menus.filter(menu => {
        if (menu.child && menu.child.length > 0) {
          menu.child = this.buildTreeData(menu.child);
        }
        return menu.type === 0;
      });
    },
    handleNodeClick(data) {
      this.currentMenuId = data.id;
      this.currentMenuName = data.title;
      this.currentItem = data;
      this.loadTemplates(data.id);
    },
    async loadTemplates(menuId) {
      try {
        const res = await this.get({
          url: "/api/app/print-templete/page-list",
          data: {
            MenuId: menuId,
            Page: 1,
            MaxResultCount: 1000,
          },
        });
        if (res.code !== 200) return;
        this.templateList = res.result?.items || [];
      } catch (error) {
        console.error("加载模板列表失败:", error);
      }
    },
    handleAdd() {
      this.dialogTitle = "新增模板";
      this.form = {
        id: null,
        templeteName: "",
        remark: "",
        templeteJson: "",
        printUrl: "",
      };
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate();
      });
    },
    handleEdit(template) {
      this.dialogTitle = "编辑模板";
      this.form = {
        id: template.id,
        templeteName: template.templeteName,
        remark: template.remark,
        templeteJson: template.templeteJson,
        printUrl: template.printUrl || "",
      };
      this.dialogVisible = true;
    },
    async handleDelete(template) {
      this.$confirm("确认删除该模板吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          try {
            await this.del({
              url: `/api/app/print-templete/print-templete/${template.id}`,
            });
            this.$message.success("删除成功");
            this.loadTemplates(this.currentMenuId);
          } catch (error) {
            console.error("删除失败:", error);
          }
        })
        .catch(() => {});
    },
    async handleSubmit() {
      this.$refs.formRef.validate(async valid => {
        if (valid) {
          try {
            if (this.form.id) {
              await this.put({
                url: "/api/app/print-templete/print-templete",
                data: {
                  id: this.form.id,
                  templeteName: this.form.templeteName,
                  templeteJson: this.form.templeteJson,
                  printUrl: this.form.printUrl,
                },
              });
              this.$message.success("编辑成功");
            } else {
              await this.post({
                url: "/api/app/print-templete/print-templete",
                data: {
                  menuId: this.currentMenuId,
                  templeteName: this.form.templeteName,
                  templeteJson: this.form.templeteJson,
                  printUrl: this.form.printUrl,
                },
              });
              this.$message.success("新增成功");
            }
            this.dialogVisible = false;
            this.loadTemplates(this.currentMenuId);
          } catch (error) {
            console.error("提交失败:", error);
          }
        }
      });
    },
    handleCreateTemplate() {
      let templateData = {};
      if (this.form.templeteJson) {
        try {
          templateData = JSON.parse(this.form.templeteJson);
        } catch (e) {
          console.error("解析模板JSON失败:", e);
        }
      }
      this.$hiprint({
        defaultTemplate: templateData,
        onSubmit: res => {
          this.form.templeteJson = JSON.stringify(res);
          console.log("保存的结果", this.form);
          this.$message.success("模板创建成功！");
        },
      });
    },
  },
};
</script>

<style scoped>
.print-manage-container {
  display: flex;
  height: calc(100vh - 84px);
  background: #f5f5f5;
  padding: 20px;
  gap: 20px;
}

.left-panel {
  width: 280px;
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.tree-icon {
  margin-right: 8px;
  font-size: 16px;
  color: #909399;
}

.tree-label {
  color: #606266;
}

.right-panel {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.panel-header .panel-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.template-list {
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.empty-card {
  width: 100%;
  height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  grid-column: 1 / -1;
}

.empty-card:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.add-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.empty-card:hover .add-icon {
  color: #409eff;
  transform: scale(1.1);
}

.add-text {
  font-size: 14px;
  color: #909399;
}

.template-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.card-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.card-body {
  margin-bottom: 15px;
}

.card-info {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-label {
  color: #909399;
  margin-right: 5px;
}

.info-value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background: #f5f5f5;
}
</style>
