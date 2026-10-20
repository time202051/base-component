<template>
  <div class="agent-chat-root">
    <!-- 悬浮球 -->
    <button
      v-if="isLauncher"
      class="agent-chat-fab"
      :class="{ 'is-open': open }"
      type="button"
      @click="toggleOpen"
    >
      <i :class="open ? 'el-icon-close' : 'el-icon-chat-dot-round'"></i>
    </button>

    <!-- 弹窗 / 内嵌面板 -->
    <transition :name="isLauncher ? 'agent-chat-pop' : ''">
      <div
        v-show="isInline || open"
        class="agent-chat-panel"
        :class="isLauncher ? 'agent-chat-panel--float' : 'agent-chat-panel--inline'"
        :style="panelStyle"
      >
        <div
          v-if="isLauncher"
          class="ac-resize ac-resize--e"
          @mousedown="startResize($event, 'w')"
        ></div>
        <div
          v-if="isLauncher"
          class="ac-resize ac-resize--n"
          @mousedown="startResize($event, 'h')"
        ></div>
        <div
          v-if="isLauncher"
          class="ac-resize ac-resize--nw"
          @mousedown="startResize($event, 'both')"
        ></div>

        <header class="agent-chat-header">
          <div class="agent-chat-header__brand">
            <div class="agent-chat-header__avatar">
              <i class="el-icon-magic-stick"></i>
            </div>
            <div class="agent-chat-header__text">
              <div class="agent-chat-header__title">{{ effectiveTitle }}</div>
              <div class="agent-chat-header__sub">在线 · 只读查询数据库</div>
            </div>
          </div>
          <div class="agent-chat-header__actions">
            <button
              type="button"
              class="agent-chat-icon el-icon-setting"
              title="设置（模型 / 密钥）"
              @click="openSettings"
            ></button>
            <button
              type="button"
              class="agent-chat-icon"
              :class="showHistory ? 'el-icon-arrow-left' : 'el-icon-time'"
              title="历史会话"
              @click="showHistory = !showHistory"
            ></button>
            <button
              type="button"
              class="agent-chat-icon el-icon-plus"
              title="新建会话"
              @click="onNewFromHeader"
            ></button>
            <button
              v-if="isLauncher"
              type="button"
              class="agent-chat-icon el-icon-close"
              title="收起"
              @click="open = false"
            ></button>
          </div>
        </header>

        <div v-if="configError" class="agent-chat-banner">
          <i class="el-icon-warning-outline"></i>
          <div class="agent-chat-banner__body">
            <span>{{ configError }}</span>
            <div v-if="agentUnreachable" class="agent-chat-download">
              <div class="agent-chat-download__steps">
                本机还没运行查询服务。下载后解压，双击里面的
                <b>install.bat</b>（会自动安装并开机自启），再点「重新检测」即可。
              </div>
              <div class="agent-chat-download__actions">
                <el-button
                  v-if="downloadUrl"
                  size="mini"
                  type="primary"
                  icon="el-icon-download"
                  @click="downloadAgent"
                >
                  下载本地查询服务
                </el-button>
                <el-button size="mini" icon="el-icon-refresh" @click="checkConnection">
                  重新检测
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="agent-chat-content">
          <!-- 历史抽屉 -->
          <transition name="agent-chat-drawer">
            <div v-show="showHistory" class="agent-chat-history">
              <div class="agent-chat-history__title">历史会话</div>
              <div class="ac-convs">
                <div
                  v-for="c in conversationItems"
                  :key="c.id"
                  class="ac-conv"
                  :class="{ 'is-active': c.id === conversationId }"
                  @click="selectConversation(c.id)"
                >
                  <i v-if="c.pinned" class="el-icon-top ac-conv__pin" title="已置顶"></i>
                  <span class="ac-conv__title">{{ c.label }}</span>
                  <el-dropdown
                    class="ac-conv__more"
                    trigger="click"
                    placement="bottom-end"
                    @command="onMenuCommand($event, c)"
                    @click.native.stop
                  >
                    <i class="el-icon-more"></i>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="rename">
                        <i class="el-icon-edit"></i> 重命名
                      </el-dropdown-item>
                      <el-dropdown-item command="pin">
                        <i class="el-icon-top"></i> 置顶
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <i class="el-icon-delete"></i> 删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </transition>

          <div class="agent-chat-body" @click="onBodyClick">
            <el-x-bubble-list
              v-if="bubbleList.length"
              :list="bubbleList"
              :max-width="bubbleMaxWidth"
              max-height="100%"
              :always-show-scrollbar="true"
            >
              <template #content="{ item }">
                <div v-if="item.loading" class="ac-typing">
                  <span></span><span></span><span></span>
                </div>
                <template v-else>
                  <div
                    v-if="item.content"
                    class="ac-markdown"
                    v-html="renderMarkdown(item.content)"
                  ></div>
                  <div v-for="(visual, vi) in item.visuals" :key="'v' + vi" class="ac-visual">
                    <component
                      v-if="getVisualComponent(visual.component)"
                      :is="getVisualComponent(visual.component)"
                      v-bind="visualProps(visual)"
                    />
                    <div v-else class="ac-visual__unknown">
                      <div class="ac-visual__unknown-tip">
                        暂不支持的可视化组件：{{ visual.component }}
                      </div>
                      <pre class="ac-visual__unknown-json">{{ stringifyVisual(visual) }}</pre>
                    </div>
                  </div>
                  <el-table
                    v-if="item.table && item.table.rows && item.table.rows.length"
                    class="ac-result-table"
                    :data="item.table.rows"
                    size="mini"
                    border
                    max-height="320"
                  >
                    <el-table-column
                      v-for="col in item.table.columns"
                      :key="col"
                      :prop="col"
                      :label="col"
                      show-overflow-tooltip
                    />
                  </el-table>
                </template>
              </template>

              <template #footer="{ item, index }">
                <div v-if="item.loading" class="ac-actions ac-actions--stop">
                  <span class="ac-action" @click.stop="cancel()">
                    <i class="el-icon-close"></i> 停止生成
                  </span>
                </div>
                <div v-else-if="item.content" class="ac-actions">
                  <span class="ac-action" @click.stop="copyText(item.content)">
                    <i class="el-icon-document-copy"></i> 复制
                  </span>
                  <span
                    v-if="item.role === 'user'"
                    class="ac-action"
                    @click.stop="editUserMessage(index)"
                  >
                    <i class="el-icon-edit"></i> 编辑
                  </span>
                  <span
                    v-if="item.role === 'assistant'"
                    class="ac-action"
                    @click.stop="regenerate(index)"
                  >
                    <i class="el-icon-refresh"></i> 重新生成
                  </span>
                </div>
              </template>
            </el-x-bubble-list>
            <div v-else class="agent-chat-empty">
              <div class="agent-chat-empty__logo">
                <i class="el-icon-magic-stick"></i>
              </div>
              <div class="agent-chat-empty__title">{{ effectiveTitle }}</div>
              <div class="agent-chat-empty__desc">
                用中文提问即可，例如："一共有几个客户？分别来自哪些城市？"
              </div>
            </div>
          </div>
        </div>

        <footer class="agent-chat-sender">
          <el-x-sender
            ref="sender"
            v-model="input"
            :loading="sending"
            :disabled="sending"
            :placeholder="placeholder"
            @submit="send"
            @cancel="cancel"
          />
        </footer>
      </div>
    </transition>

    <!-- 设置：模型 / 密钥（密钥只存本机浏览器，不写进代码） -->
    <el-dialog
      title="设置"
      :visible.sync="settingsOpen"
      width="420px"
      :append-to-body="true"
      custom-class="agent-chat-settings"
    >
      <el-form label-width="88px" size="small">
        <el-form-item label="模型服务">
          <el-select v-model="settingsForm.provider" style="width: 100%" @change="onProviderChange">
            <el-option v-for="p in providers" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口地址">
          <el-input v-model="settingsForm.baseUrl" placeholder="https://api.deepseek.com/v1" />
        </el-form-item>
        <el-form-item label="模型名">
          <el-input v-model="settingsForm.model" placeholder="deepseek-chat" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="settingsForm.apiKey" show-password placeholder="sk-..." />
        </el-form-item>
      </el-form>
      <div class="ac-settings-hint">
        密钥只保存在本机浏览器（localStorage），不会写进代码、不会上传到仓库。
      </div>
      <div v-if="testResult" class="ac-settings-test" :class="testResult.ok ? 'is-ok' : 'is-bad'">
        {{ testResult.text }}
      </div>
      <div slot="footer">
        <el-button size="small" :loading="testing" @click="testConnection">测试连接</el-button>
        <el-button size="small" type="primary" @click="saveSettings">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ElXBubbleList, ElXSender } from "vue-element-ui-x";
import "highlight.js/styles/github-dark.css";
import { checkConfig, streamChat } from "./api/chat.js";
import { renderMarkdown } from "./markdown.js";
import { getVisualComponent } from "./visual/registry.js";
import { globalConfig, llmProviders } from "./config.js";
import {
  loadConversations,
  createConversation,
  loadMessages,
  saveMessages,
  saveConversations,
  removeMessages,
  loadSettings,
  saveSettings,
} from "./storage.js";

export default {
  name: "agent-chat",
  components: {
    "el-x-bubble-list": ElXBubbleList,
    "el-x-sender": ElXSender,
  },
  props: {
    // launcher：右下角悬浮球 + 弹窗；inline：直接内嵌
    mode: { type: String, default: "launcher" },
    agentBaseUrl: { type: String, default: "" },
    userId: { type: String, default: "" },
    title: { type: String, default: "" },
    height: { type: String, default: "100%" },
    panelWidth: { type: String, default: "404px" },
    panelHeight: { type: String, default: "634px" },
  },
  data() {
    return {
      open: false,
      showHistory: false,
      conversations: [],
      conversationId: null,
      messages: [],
      input: "",
      sending: false,
      controller: null,
      panelSize: { width: 404, height: 634 },
      configError: "",
      // 本地 agent 服务是否探测不到（用于展示"下载本地服务"引导）
      agentUnreachable: false,
      // 设置（模型 / 密钥）：密钥存本机浏览器，不写进代码
      settingsOpen: false,
      settings: null,
      providers: llmProviders,
      settingsForm: { provider: "deepseek", baseUrl: "", model: "", apiKey: "" },
      testing: false,
      testResult: null,
      convMenu: [
        { label: "重命名", key: "rename", icon: "el-icon-edit", command: "rename" },
        { label: "置顶", key: "pin", icon: "el-icon-top", command: "pin" },
        {
          label: "删除",
          key: "delete",
          icon: "el-icon-delete",
          command: "delete",
          menuItemHoverStyle: { color: "#F56C6C", backgroundColor: "rgba(245,108,108,0.1)" },
        },
      ],
    };
  },
  created() {
    const saved = this.loadPanelSize();
    const w = saved.width || parseInt(this.panelWidth, 10) || 404;
    const h = saved.height || parseInt(this.panelHeight, 10) || 634;
    this.panelSize = { width: w, height: h };
  },
  computed: {
    isLauncher() {
      return this.mode === "launcher";
    },
    isInline() {
      return this.mode === "inline";
    },
    panelStyle() {
      if (this.isInline) return { height: this.height };
      return { width: this.panelSize.width + "px", height: this.panelSize.height + "px" };
    },
    // 宿主通过 Vue.use(OlCom, { agentChat: { db, llm, agentBaseUrl, ... } }) 下发的配置
    agentChatConfig() {
      return (this.$olBaseConfig || {}).agentChat || {};
    },
    // 本地 agent 服务安装包下载地址（由宿主下发）
    downloadUrl() {
      return this.agentChatConfig.downloadUrl || globalConfig.downloadUrl || "";
    },
    effectiveUserId() {
      return this.userId || this.agentChatConfig.userId || globalConfig.userId;
    },
    effectiveAgentBaseUrl() {
      return this.agentBaseUrl || this.agentChatConfig.agentBaseUrl || globalConfig.agentBaseUrl;
    },
    effectiveTitle() {
      return this.title || this.agentChatConfig.title || globalConfig.title;
    },
    placeholder() {
      return this.agentChatConfig.placeholder || globalConfig.placeholder;
    },
    // 有效的大模型配置：用户在本机填的 > 代码里注册的默认 > 预设
    effectiveLlm() {
      const base = this.agentChatConfig.llm || globalConfig.llm || {};
      const saved = (this.settings && this.settings.llm) || {};
      const provider = saved.provider || base.provider || "deepseek";
      const preset = llmProviders.find(p => p.value === provider) || llmProviders[0];
      return {
        provider,
        baseUrl: saved.baseUrl || base.baseUrl || preset.baseUrl,
        model: saved.model || base.model || preset.model,
        apiKey: saved.apiKey || base.apiKey || "",
      };
    },
    requestConfig() {
      const ac = this.agentChatConfig;
      const cfg = {};
      const db = ac.db || globalConfig.db;
      if (db) cfg.db = db;
      const llm = this.effectiveLlm;
      cfg.llm = { apiKey: llm.apiKey, baseUrl: llm.baseUrl, model: llm.model };
      const limits = ac.limits || globalConfig.limits;
      if (limits) cfg.limits = limits;
      return cfg;
    },
    bubbleMaxWidth() {
      if (this.isInline) return "100%";
      return Math.max(220, this.panelSize.width - 34) + "px";
    },
    conversationItems() {
      const sorted = this.conversations.slice().sort((a, b) => {
        const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pin !== 0) return pin;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      return sorted.map(c => ({
        id: c.id,
        label: c.title || "新会话",
        pinned: !!c.pinned,
        prefixIcon: "el-icon-chat-dot-round",
      }));
    },
    bubbleList() {
      const result = this.messages.map(m => ({
        content: m.content,
        role: m.role,
        placement: m.role === "user" ? "end" : "start",
        loading: !!m.loading,
        table: m.table || null,
        visuals: m.visuals || [],
      }));
      console.log("result", result);
      return result;
    },
  },
  watch: {
    effectiveUserId() {
      this.init();
    },
  },
  mounted() {
    this.init();
    this.loadUserSettings();
    if (globalConfig.checkOnMount) this.checkConnection();
    // 首次使用（还没填密钥）自动弹出设置
    if (!this.effectiveLlm.apiKey) this.openSettings();
    // 忽略浏览器对 ResizeObserver 的良性循环告警（图表/报表自适应尺寸时常见），
    // 避免 dev 环境的报错浮层误弹。捕获阶段拦截，先于 dev-server overlay 的处理。
    this._roGuard = e => {
      const msg = (e && (e.message || (e.reason && e.reason.message))) || "";
      if (msg.indexOf("ResizeObserver loop") !== -1) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.preventDefault) e.preventDefault();
      }
    };
    window.addEventListener("error", this._roGuard, true);
    window.addEventListener("unhandledrejection", this._roGuard, true);
  },
  beforeDestroy() {
    this.cancel();
    if (this._roGuard) {
      window.removeEventListener("error", this._roGuard, true);
      window.removeEventListener("unhandledrejection", this._roGuard, true);
      this._roGuard = null;
    }
  },
  methods: {
    renderMarkdown,
    getVisualComponent,
    // 兼容两种可视化协议：report（blocks 在顶层）与 render_chart（数据在 props 里）
    visualProps(visual) {
      if (!visual) return {};
      const base = visual.props && typeof visual.props === "object" ? visual.props : {};
      return Object.assign({}, visual, base);
    },
    stringifyVisual(visual) {
      try {
        return JSON.stringify(visual, null, 2);
      } catch {
        return "";
      }
    },
    loadUserSettings() {
      this.settings = loadSettings(this.effectiveUserId) || null;
    },
    openSettings() {
      const llm = this.effectiveLlm;
      this.settingsForm = {
        provider: llm.provider,
        baseUrl: llm.baseUrl,
        model: llm.model,
        apiKey: llm.apiKey,
      };
      this.testResult = null;
      this.settingsOpen = true;
    },
    onProviderChange(value) {
      const preset = llmProviders.find(p => p.value === value);
      if (preset && value !== "custom") {
        this.settingsForm.baseUrl = preset.baseUrl;
        this.settingsForm.model = preset.model;
      }
    },
    async testConnection() {
      this.testing = true;
      this.testResult = null;
      try {
        const result = await checkConfig({
          agentBaseUrl: this.effectiveAgentBaseUrl,
          config: {
            ...this.requestConfig,
            llm: {
              apiKey: this.settingsForm.apiKey,
              baseUrl: this.settingsForm.baseUrl,
              model: this.settingsForm.model,
            },
          },
        });
        const problems = [];
        if (result && result.error) problems.push(result.error);
        if (result && result.db && !result.db.ok) {
          problems.push(`数据库：${result.db.error || "失败"}`);
        }
        if (result && result.llm && !result.llm.ok) {
          problems.push(`大模型：${result.llm.error || "失败"}`);
        }
        this.testResult = problems.length
          ? { ok: false, text: problems.join("；") }
          : { ok: true, text: "连接正常" };
      } catch (e) {
        this.testResult = { ok: false, text: `连接失败：${(e && e.message) || e}` };
      } finally {
        this.testing = false;
      }
    },
    saveSettings() {
      this.settings = { llm: { ...this.settingsForm } };
      saveSettings(this.effectiveUserId, this.settings);
      this.settingsOpen = false;
      this.checkConnection();
    },
    async checkConnection() {
      try {
        const result = await checkConfig({
          agentBaseUrl: this.effectiveAgentBaseUrl,
          config: this.requestConfig,
        });
        this.agentUnreachable = false;
        const problems = [];
        if (result && result.error) problems.push(result.error);
        if (result && result.db && !result.db.ok) {
          problems.push(`数据库连接失败：${result.db.error || "未知错误"}`);
        }
        if (result && result.llm && !result.llm.ok) {
          problems.push(`大模型不可用：${result.llm.error || "未知错误"}`);
        }
        this.configError = problems.join("；");
      } catch (e) {
        this.agentUnreachable = true;
        this.configError = `未检测到本地查询服务：${(e && e.message) || e}`;
      }
    },
    downloadAgent() {
      const url = this.downloadUrl;
      if (!url) return;
      window.open(url, "_blank");
    },
    loadPanelSize() {
      try {
        return JSON.parse(localStorage.getItem("agentchat:panel-size") || "{}");
      } catch {
        return {};
      }
    },
    savePanelSize() {
      try {
        localStorage.setItem("agentchat:panel-size", JSON.stringify(this.panelSize));
      } catch {
        /* ignore */
      }
    },
    startResize(event, edge) {
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const startW = this.panelSize.width;
      const startH = this.panelSize.height;
      const maxW = Math.max(320, window.innerWidth - 48);
      const maxH = Math.max(360, window.innerHeight - 120);

      const onMove = e => {
        if (edge === "w" || edge === "both") {
          const w = Math.min(Math.max(320, startW + (startX - e.clientX)), maxW);
          this.panelSize = { width: w, height: this.panelSize.height };
        }
        if (edge === "h" || edge === "both") {
          const h = Math.min(Math.max(360, startH + (startY - e.clientY)), maxH);
          this.panelSize = { width: this.panelSize.width, height: h };
        }
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.userSelect = "";
        this.savePanelSize();
      };
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    parseResult(output) {
      if (!output) return null;
      try {
        return JSON.parse(output);
      } catch {
        return null;
      }
    },
    onBodyClick(event) {
      const btn =
        event.target && event.target.closest ? event.target.closest(".ac-code__copy") : null;
      if (!btn) return;
      const wrapper = btn.closest(".ac-code");
      const codeEl = wrapper ? wrapper.querySelector("code") : null;
      this.copyText(codeEl ? codeEl.textContent : "");
    },
    copyText(text) {
      if (!text) return;
      const done = () => this.$message && this.$message.success("已复制");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(done)
          .catch(() => {});
        return;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    },
    toggleOpen() {
      this.open = !this.open;
      if (!this.open) this.showHistory = false;
    },
    init() {
      const uid = this.effectiveUserId;
      if (!loadConversations(uid).length) {
        createConversation(uid);
      }
      const convs = this.refreshConversations();
      this.conversationId = convs[0].id;
      this.messages = loadMessages(uid, this.conversationId);
    },
    refreshConversations() {
      const uid = this.effectiveUserId;
      const list = loadConversations(uid)
        .slice()
        .sort((a, b) => {
          const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
          if (pin !== 0) return pin;
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
      this.conversations = list;
      return list;
    },
    onNewFromHeader() {
      this.newConversation();
      this.showHistory = false;
    },
    newConversation() {
      this.cancel();
      const created = createConversation(this.effectiveUserId);
      this.refreshConversations();
      this.conversationId = created.id;
      this.messages = [];
    },
    selectConversation(id) {
      if (!id || id === this.conversationId) return;
      this.cancel();
      this.conversationId = id;
      this.messages = loadMessages(this.effectiveUserId, id);
    },
    onMenuCommand(command, item) {
      if (command === "rename") this.renameConversation(item);
      else if (command === "pin") this.pinConversation(item);
      else if (command === "delete") this.deleteConversation(item);
    },
    findConversation(item) {
      const id = item && (item.id || item.uniqueKey);
      return this.conversations.find(c => c.id === id);
    },
    renameConversation(item) {
      const conv = this.findConversation(item);
      if (!conv) return;
      const uid = this.effectiveUserId;
      this.$prompt("请输入会话名称", "重命名", {
        inputValue: conv.title,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: v => (v && v.trim() ? true : "名称不能为空"),
      })
        .then(({ value }) => {
          conv.title = String(value).trim().slice(0, 50);
          saveConversations(uid, this.conversations);
          this.refreshConversations();
        })
        .catch(() => {});
    },
    pinConversation(item) {
      const conv = this.findConversation(item);
      if (!conv) return;
      conv.pinned = !conv.pinned;
      saveConversations(this.effectiveUserId, this.conversations);
      this.refreshConversations();
    },
    deleteConversation(item) {
      const id = item && (item.id || item.uniqueKey);
      if (!id) return;
      const uid = this.effectiveUserId;
      if (this.conversationId === id) this.cancel();
      const convs = loadConversations(uid).filter(c => c.id !== id);
      saveConversations(uid, convs);
      removeMessages(uid, id);
      this.refreshConversations();
      if (this.conversationId === id) {
        if (this.conversations.length) {
          this.conversationId = this.conversations[0].id;
          this.messages = loadMessages(uid, this.conversationId);
        } else {
          this.init();
        }
      }
    },
    send() {
      const text = this.input.trim();
      if (!text || this.sending) return;
      this.input = "";
      this.messages.push({ role: "user", content: text });
      this.runAssistantReply();
    },
    regenerate(index) {
      if (this.sending) return;
      // 删掉该条助手消息（及其之后的内容），重新生成
      this.messages.splice(index);
      this.persist();
      this.runAssistantReply();
    },
    editUserMessage(index) {
      if (this.sending) this.cancel();
      const msg = this.messages[index];
      if (!msg) return;
      const text = msg.content;
      // 从该条用户消息开始截断，把内容放回输入框，让用户改完再发
      this.messages.splice(index);
      this.persist();
      this.input = text;
      this.$nextTick(() => {
        const sender = this.$refs.sender;
        if (sender && typeof sender.focus === "function") sender.focus();
      });
    },
    runAssistantReply() {
      const reply = { role: "assistant", content: "", loading: true, table: null, visuals: [] };
      this.messages.push(reply);
      this.sending = true;

      // 流式更新节流：合并高频 token，降低重渲染次数（约 12 次/秒）
      const buffer = { text: "" };
      let pending = false;
      let timer = null;
      const flush = () => {
        pending = false;
        timer = null;
        if (reply.content !== buffer.text) reply.content = buffer.text;
      };
      const schedule = () => {
        if (pending) return;
        pending = true;
        timer = setTimeout(flush, 80);
      };
      const finalize = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        pending = false;
        reply.content = buffer.text;
        reply.loading = false;
        this._finalize = null;
      };
      this._finalize = finalize;

      const payload = this.messages
        .filter(m => m !== reply)
        .map(m => ({ role: m.role, content: m.content }));

      this.controller = streamChat({
        agentBaseUrl: this.effectiveAgentBaseUrl,
        config: this.requestConfig,
        messages: payload,
        conversationId: this.conversationId,
        handlers: {
          onToken: token => {
            if (reply.loading) reply.loading = false;
            buffer.text += token;
            schedule();
          },
          onToolResult: event => {
            const parsed = this.parseResult(event.output);
            if (
              parsed &&
              Array.isArray(parsed.rows) &&
              parsed.rows.length &&
              Array.isArray(parsed.columns)
            ) {
              reply.table = { columns: parsed.columns, rows: parsed.rows };
            }
          },
          onVisual: visual => {
            if (!visual || !visual.component) return;
            const spec = Object.assign({}, visual);
            delete spec.type;
            if (!reply.visuals) reply.visuals = [];
            reply.visuals.push(spec);
          },
          onDone: () => {
            finalize();
            this.sending = false;
            this.persist();
          },
          onError: message => {
            finalize();
            reply.content += (reply.content ? "\n" : "") + "⚠️ " + message;
            this.sending = false;
            this.persist();
          },
        },
      });
    },
    cancel() {
      const had = !!this._finalize;
      if (this._finalize) this._finalize();
      if (this.controller) {
        this.controller.abort();
        this.controller = null;
      }
      this.sending = false;
      if (had) this.persist();
    },
    persist() {
      const uid = this.effectiveUserId;
      const clean = this.messages.map(m => ({
        role: m.role,
        content: m.content,
        table: m.table || null,
        visuals: m.visuals || [],
      }));
      saveMessages(uid, this.conversationId, clean);

      const firstUser = clean.find(m => m.role === "user");
      if (firstUser) {
        const convs = loadConversations(uid);
        const target = convs.find(c => c.id === this.conversationId);
        if (target && (target.title === "新会话" || !target.title)) {
          target.title = firstUser.content.slice(0, 20);
        }
        if (target) target.updatedAt = Date.now();
        saveConversations(uid, convs);
        this.refreshConversations();
      }
    },
  },
};
</script>

<style scoped>
.agent-chat-root {
  --ac-primary: #4f7cff;
  --ac-primary-2: #6aa1ff;
}

/* ===== 悬浮球 ===== */
.agent-chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--ac-primary), var(--ac-primary-2));
  box-shadow: 0 8px 24px rgba(79, 124, 255, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 1901;
}
.agent-chat-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(79, 124, 255, 0.55);
}
.agent-chat-fab.is-open {
  background: #fff;
  color: var(--ac-primary);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

/* ===== 弹窗缩放手柄（锚点在右下角，拖左边/上边/左上角） ===== */
.ac-resize {
  position: absolute;
  z-index: 30;
}
.ac-resize--e {
  left: 0;
  top: 16px;
  bottom: 16px;
  width: 6px;
  cursor: ew-resize;
}
.ac-resize--n {
  left: 16px;
  right: 16px;
  top: 0;
  height: 6px;
  cursor: ns-resize;
}
.ac-resize--e:hover,
.ac-resize--n:hover {
  background: rgba(79, 124, 255, 0.25);
}
.ac-resize--nw {
  left: 0;
  top: 0;
  width: 24px;
  height: 24px;
  padding: 3px;
  box-sizing: border-box;
  cursor: nwse-resize;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}
.ac-resize--nw:hover {
  color: #fff;
}

/* ===== 面板 ===== */
.agent-chat-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}
.agent-chat-panel--float {
  position: fixed;
  right: 24px;
  bottom: 96px;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  z-index: 1900;
}
.agent-chat-panel--inline {
  height: 100%;
  border: 1px solid #ebeef5;
  border-radius: 10px;
}

/* 弹窗动画 */
.agent-chat-pop-enter-active,
.agent-chat-pop-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
  transform-origin: bottom right;
}
.agent-chat-pop-enter,
.agent-chat-pop-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

/* ===== 头部 ===== */
.agent-chat-header {
  height: 60px;
  flex-shrink: 0;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #6aa1ff);
}
.agent-chat-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.agent-chat-header__avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.agent-chat-header__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.agent-chat-header__sub {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 2px;
}
.agent-chat-header__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.agent-chat-icon {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.agent-chat-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ===== 配置错误提示 ===== */
.agent-chat-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
  border-bottom: 1px solid rgba(245, 108, 108, 0.25);
}
.agent-chat-banner i {
  margin-top: 2px;
}
.agent-chat-banner__body {
  flex: 1;
  min-width: 0;
}
.agent-chat-download {
  margin-top: 6px;
}
.agent-chat-download__steps {
  color: #606266;
  margin-bottom: 6px;
}
.agent-chat-download__actions {
  display: flex;
  gap: 8px;
}

/* ===== 设置弹窗 ===== */
.agent-chat-settings .el-dialog__body {
  padding-top: 12px;
}
.ac-settings-hint {
  margin: 2px 0 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
.ac-settings-test {
  margin-bottom: 4px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 4px;
  word-break: break-all;
}
.ac-settings-test.is-ok {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}
.ac-settings-test.is-bad {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

/* ===== 内容区 ===== */
.agent-chat-content {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}
.agent-chat-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 14px;
  overflow: hidden;
}
.agent-chat-history {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  z-index: 5;
  background: #fff;
  border-right: 1px solid #ebeef5;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.06);
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
}
.agent-chat-history__title {
  font-size: 13px;
  color: #909399;
  padding: 4px 6px 8px;
}
.agent-chat-drawer-enter-active,
.agent-chat-drawer-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.agent-chat-drawer-enter,
.agent-chat-drawer-leave-to {
  transform: translateX(-100%);
  opacity: 0.6;
}

/* ===== 空状态 ===== */
.agent-chat-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 24px;
}
.agent-chat-empty__logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef3ff, #dfe9ff);
  color: #4f7cff;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.agent-chat-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}
.agent-chat-empty__desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

/* ===== 输入区 ===== */
.agent-chat-sender {
  padding: 10px 12px 12px;
  border-top: 1px solid #f0f2f5;
  flex-shrink: 0;
}

/* 等待首个 token 的打字动画 */
.ac-typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 20px;
}
.ac-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #b6bac0;
  animation: ac-blink 1.2s infinite ease-in-out;
}
.ac-typing span:nth-child(2) {
  animation-delay: 0.2s;
}
.ac-typing span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes ac-blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}
</style>

<!-- Markdown 渲染样式（v-html 内容，需非 scoped） -->
<style>
.ac-markdown {
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.ac-markdown p {
  margin: 0 0 8px;
}
.ac-markdown p:last-child {
  margin-bottom: 0;
}
.ac-markdown h1,
.ac-markdown h2,
.ac-markdown h3 {
  margin: 12px 0 8px;
  font-weight: 600;
  color: #1f2329;
}
.ac-markdown ul,
.ac-markdown ol {
  padding-left: 20px;
  margin: 6px 0;
}
.ac-markdown li {
  margin: 3px 0;
}
.ac-markdown table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 13px;
}
.ac-table-wrap {
  margin: 8px 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 6px;
  scrollbar-width: thin;
}
.ac-table-wrap::-webkit-scrollbar {
  height: 8px;
}
.ac-table-wrap::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
.ac-table-wrap::-webkit-scrollbar-track {
  background: #f5f7fa;
}
.ac-markdown th,
.ac-markdown td {
  border: 1px solid #e4e7ed;
  padding: 6px 10px;
  text-align: left;
  white-space: nowrap;
}
.ac-markdown th {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
}
.ac-markdown tr:nth-child(even) td {
  background: #fafafa;
}
.ac-markdown code {
  background: #f2f3f5;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: "Consolas", "Monaco", monospace;
}
.ac-markdown pre {
  background: #f6f8fa;
  padding: 10px 12px;
  border-radius: 6px;
  overflow: auto;
  margin: 8px 0;
}
.ac-markdown pre code {
  background: transparent;
  padding: 0;
}
.ac-markdown blockquote {
  margin: 6px 0;
  padding-left: 10px;
  border-left: 3px solid #dcdfe6;
  color: #909399;
}
.ac-markdown a {
  color: #4f7cff;
}
.ac-markdown hr {
  border: none;
  border-top: 1px solid #ebeef5;
  margin: 12px 0;
}
.ac-markdown img {
  max-width: 100%;
  border-radius: 6px;
}

/* 代码块 */
.ac-code {
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
}
.ac-code__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #161b22;
  color: #8b949e;
  font-size: 12px;
}
.ac-code__copy {
  cursor: pointer;
  user-select: none;
}
.ac-code__copy:hover {
  color: #fff;
}
.ac-code__pre {
  margin: 0;
  padding: 12px;
  overflow: auto;
  background: #0d1117;
}
.ac-code__pre code {
  background: transparent;
  padding: 0;
  font-size: 12.5px;
  font-family: "Consolas", "Monaco", monospace;
}

/* 工具返回的结构化结果表 */
.ac-result-table {
  width: 100%;
  margin-top: 8px;
}

/* 防止气泡内容超出弹框宽度（库组件为外部元素，需全局覆盖） */
.agent-chat-panel .el-x-bubble,
.agent-chat-panel .el-x-bubble-content-wrapper,
.agent-chat-panel .el-x-bubble-content {
  max-width: 100% !important;
  box-sizing: border-box;
}
.agent-chat-panel .typer-container {
  overflow-x: hidden;
}
.agent-chat-panel .el-x-bubble-content-wrapper {
  overflow-x: hidden;
}

/* 消息操作栏（默认隐藏，悬停气泡时显示） */
.ac-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.el-x-bubble-content-wrapper:hover .ac-actions,
.ac-actions--stop {
  opacity: 1;
}
.ac-action {
  cursor: pointer;
  user-select: none;
}
.ac-action:hover {
  color: #4f7cff;
}
.ac-actions--stop .ac-action {
  color: #f56c6c;
}

/* 历史会话列表 */
.ac-convs {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-conv {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
}
.ac-conv:hover {
  background: #f2f3f5;
}
.ac-conv.is-active {
  background: #eef3ff;
  color: #4f7cff;
}
.ac-conv__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-conv__pin {
  color: #4f7cff;
  flex-shrink: 0;
}
.ac-conv__more {
  padding: 0 2px;
  cursor: pointer;
  color: #909399;
  flex-shrink: 0;
}
.ac-conv__more:hover {
  color: #4f7cff;
}

/* 可视化块（图表等） */
.ac-visual {
  margin-top: 8px;
}
.ac-visual__unknown {
  padding: 8px 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  color: #909399;
  font-size: 12px;
}
.ac-visual__unknown-tip {
  margin-bottom: 6px;
}
.ac-visual__unknown-json {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

