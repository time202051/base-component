<template>
  <div class="agent-chat-root">
    <!-- 悬浮球 -->
    <button
      v-if="isLauncher"
      class="agent-chat-fab"
      :class="{ 'is-open': open }"
      type="button"
      :aria-label="open ? '收起 AI 助手' : '打开 AI 助手'"
      :title="open ? '收起 AI 助手' : '打开 AI 助手'"
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
              <div class="agent-chat-header__sub" :title="connectionTitle">
                <span class="ac-conn" :class="'is-' + connectionState"></span>
                <span class="ac-conn__text">{{ connectionText }}</span>
              </div>
            </div>
          </div>
          <div class="agent-chat-header__actions">
            <button
              type="button"
              class="agent-chat-icon el-icon-setting"
              aria-label="设置"
              title="设置（模型 / 密钥）"
              @click="openSettings"
            ></button>
            <button
              type="button"
              class="agent-chat-icon"
              :class="showHistory ? 'el-icon-arrow-left' : 'el-icon-time'"
              aria-label="历史会话"
              title="历史会话"
              @click="toggleHistory"
            ></button>
            <button
              type="button"
              class="agent-chat-icon el-icon-plus"
              aria-label="新建会话"
              title="新建会话"
              @click="onNewFromHeader"
            ></button>
            <button
              v-if="isLauncher"
              type="button"
              class="agent-chat-icon el-icon-close"
              aria-label="收起面板"
              title="收起"
              @click="open = false"
            ></button>
          </div>
        </header>

        <div v-if="configError && bannerOpen" class="agent-chat-banner" role="alert">
          <i class="el-icon-warning-outline"></i>
          <div class="agent-chat-banner__body">
            <div class="agent-chat-banner__head">
              <span>{{ configError }}</span>
              <button
                type="button"
                class="agent-chat-banner__close el-icon-close"
                aria-label="关闭提示"
                @click="bannerOpen = false"
              ></button>
            </div>
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
            <div v-else class="agent-chat-banner__actions">
              <el-button size="mini" icon="el-icon-refresh" @click="checkConnection">
                重新检测
              </el-button>
              <el-button size="mini" type="primary" plain @click="openSettings">
                打开设置
              </el-button>
            </div>
          </div>
        </div>

        <div class="agent-chat-content">
          <!-- 历史抽屉 -->
          <div
            v-if="showHistory"
            class="agent-chat-history-mask"
            @click="showHistory = false"
          ></div>
          <transition name="agent-chat-drawer">
            <div v-show="showHistory" class="agent-chat-history" @click.stop>
              <div class="agent-chat-history__head">
                <span class="agent-chat-history__title">历史会话</span>
                <button
                  type="button"
                  class="agent-chat-history__close el-icon-close"
                  aria-label="关闭历史会话"
                  @click="showHistory = false"
                ></button>
              </div>
              <el-input
                v-model="historyQuery"
                class="agent-chat-history__search"
                size="mini"
                clearable
                prefix-icon="el-icon-search"
                placeholder="搜索会话"
              />
              <div class="ac-convs">
                <div
                  v-for="group in conversationGroups"
                  :key="group.label"
                  class="ac-conv-group"
                >
                  <div class="ac-conv-group__label">{{ group.label }}</div>
                  <div
                    v-for="c in group.items"
                    :key="c.id"
                    class="ac-conv"
                    :class="{ 'is-active': c.id === conversationId }"
                    @click="selectConversation(c.id)"
                  >
                    <i v-if="c.pinned" class="el-icon-top ac-conv__pin" title="已置顶"></i>
                    <span class="ac-conv__title">{{ c.title || "新会话" }}</span>
                    <span class="ac-conv__time">{{ formatRelativeTime(c.updatedAt) }}</span>
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
                          <i class="el-icon-top"></i> {{ c.pinned ? "取消置顶" : "置顶" }}
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" divided>
                          <i class="el-icon-delete"></i> 删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </el-dropdown>
                  </div>
                </div>
                <div v-if="!conversationGroups.length" class="ac-conv-empty">
                  暂无匹配的会话
                </div>
              </div>
            </div>
          </transition>

          <div class="agent-chat-body" role="log" aria-live="polite" @click="onBodyClick">
            <el-x-bubble-list
              v-if="bubbleList.length"
              :list="bubbleList"
              :max-width="bubbleMaxWidth"
              max-height="100%"
              :always-show-scrollbar="true"
              :show-back-button="true"
            >
              <template #content="{ item, index }">
                <div v-if="item.notice" class="ac-status">{{ item.notice }}</div>
                <trace-timeline
                  v-if="item.steps && item.steps.length"
                  :steps="item.steps"
                  :live="item.streaming"
                  :show-sql="effectiveShowSql"
                />
                <div v-if="item.loading" class="ac-typing">
                  <span></span><span></span><span></span>
                </div>
                <template v-else>
                  <div
                    v-if="item.content"
                    class="ac-markdown"
                    v-html="renderMarkdown(item.content)"
                  ></div>
                  <div v-if="item.error" class="ac-error" role="alert">
                    <i class="el-icon-warning-outline"></i>
                    <div class="ac-error__body">
                      <div class="ac-error__text">{{ item.error }}</div>
                      <div class="ac-error__actions">
                        <span class="ac-action" @click.stop="regenerate(item.sourceIndex)">重试</span>
                        <span
                          v-if="isAuthError(item.error)"
                          class="ac-action"
                          @click.stop="openSettings"
                        >
                          打开设置
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-if="item.interrupt" class="ac-approval" role="alert">
                    <div class="ac-approval__head">
                      <i class="el-icon-warning-outline"></i>
                      <span>执行查询前需要确认</span>
                    </div>
                    <div
                      v-for="(action, ai) in interruptActions(item)"
                      :key="ai"
                      class="ac-approval__action"
                    >
                      <div class="ac-approval__title">
                        {{ action.description || action.name }}
                      </div>
                      <pre v-if="action.args && action.args.sql">{{ action.args.sql }}</pre>
                    </div>
                    <div class="ac-approval__actions">
                      <button
                        type="button"
                        class="ac-approval__btn is-primary"
                        @click.stop="resumeInterrupt(item.sourceIndex, 'approve')"
                      >
                        执行查询
                      </button>
                      <button
                        type="button"
                        class="ac-approval__btn"
                        @click.stop="resumeInterrupt(item.sourceIndex, 'reject')"
                      >
                        取消
                      </button>
                    </div>
                  </div>
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
                  <evidence-card
                    v-if="showEvidence(item)"
                    :meta="item.meta"
                    :steps="item.steps"
                    :table="item.table"
                    :usage="item.usage"
                    :show-sql-default="effectiveShowSql"
                  />
                </template>
              </template>

              <template #footer="{ item, index }">
                <div v-if="item.streaming" class="ac-actions ac-actions--stop">
                  <span class="ac-action" @click.stop="cancel()">
                    <i class="el-icon-close"></i> 停止生成
                  </span>
                </div>
                <div
                  v-else
                  class="ac-actions"
                  :class="{ 'is-last': item.sourceIndex === bubbleList.length - 1 }"
                >
                  <span v-if="item.content" class="ac-action" @click.stop="copyText(item.content)">
                    <i class="el-icon-document-copy"></i> 复制
                  </span>
                  <span
                    v-if="item.role === 'user'"
                    class="ac-action"
                    @click.stop="editUserMessage(item.sourceIndex)"
                  >
                    <i class="el-icon-edit"></i> 编辑
                  </span>
                  <span
                    v-if="item.role === 'assistant' && !item.error && !item.interrupt"
                    class="ac-action"
                    @click.stop="regenerate(item.sourceIndex)"
                  >
                    <i class="el-icon-refresh"></i> 重新生成
                  </span>
                  <span
                    v-if="item.role === 'assistant' && item.error"
                    class="ac-action"
                    @click.stop="regenerate(item.sourceIndex)"
                  >
                    <i class="el-icon-refresh"></i> 重试
                  </span>
                  <span
                    v-if="item.role === 'assistant' && item.visuals && item.visuals.length"
                    class="ac-action"
                    @click.stop="copyReportMeta(item)"
                  >
                    <i class="el-icon-copy-document"></i> 复制结论
                  </span>
                </div>
                <div v-if="item.suggestions && item.suggestions.length" class="ac-suggestions">
                  <button
                    v-for="suggestion in item.suggestions"
                    :key="suggestion"
                    type="button"
                    class="ac-suggestion"
                    @click.stop="sendText(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
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
              <quick-prompts :items="quickPrompts" @select="sendText" />
              <button
                v-if="!effectiveLlm.apiKey"
                type="button"
                class="ac-empty-cta"
                @click="openSettings"
              >
                <i class="el-icon-key"></i> 先配置模型密钥
              </button>
            </div>
          </div>
        </div>

        <footer class="agent-chat-sender">
          <div v-if="editIndex !== null" class="ac-edit-tip">
            <span>正在编辑历史消息，发送后会从这里重新开始</span>
            <button type="button" class="ac-edit-tip__cancel" @click="cancelEdit">
              取消编辑
            </button>
          </div>
          <div class="ac-mode-row">
            <button
              v-for="mode in modes"
              :key="mode.value"
              type="button"
              class="ac-mode"
              :class="{ 'is-active': inputMode === mode.value }"
              @click="inputMode = mode.value"
            >
              {{ mode.label }}
            </button>
            <span class="ac-mode-hint">{{ modeHintText }}</span>
          </div>
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
          <div v-if="currentProviderHint" class="ac-settings-hint-block">
            {{ currentProviderHint }}
          </div>
        </el-form-item>
        <el-form-item label="接口地址">
          <el-input v-model="settingsForm.baseUrl" placeholder="https://api.deepseek.com/v1" />
        </el-form-item>
        <el-form-item label="模型名">
          <el-select
            v-if="currentProviderModels.length"
            v-model="settingsForm.model"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            placeholder="选择或直接输入模型名"
          >
            <el-option
              v-for="model in currentProviderModels"
              :key="model"
              :label="model"
              :value="model"
            />
          </el-select>
          <el-input
            v-else
            v-model="settingsForm.model"
            placeholder="输入模型名，例如 deepseek-chat"
          />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="settingsForm.apiKey" show-password placeholder="sk-..." />
        </el-form-item>
        <el-form-item label="查询 SQL">
          <el-switch v-model="settingsForm.showSql" />
          <span class="ac-settings-hint-inline">默认折叠，开启后「执行过程 / 数据依据」直接显示 SQL</span>
        </el-form-item>
        <el-form-item label="执行确认">
          <el-switch v-model="settingsForm.requireSqlApproval" />
          <span class="ac-settings-hint-inline">开启后每次 SQL 执行前需要点击确认（LangChain HITL）</span>
        </el-form-item>
      </el-form>
      <div class="ac-settings-hint">
        密钥只保存在本机浏览器（localStorage），不会写进代码、不会上传到仓库。
      </div>
      <div v-if="testResult" class="ac-settings-test" :class="testResult.ok ? 'is-ok' : 'is-bad'">
        {{ testResult.text }}
      </div>
      <div slot="footer" class="ac-settings-footer">
        <el-button size="small" type="text" class="ac-settings-danger" @click="clearApiKey">
          清除本机密钥
        </el-button>
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
import { buildToolDetail, tablesFromSql, toolLabel } from "./toolMeta.js";
import TraceTimeline from "./components/TraceTimeline.vue";
import EvidenceCard from "./components/EvidenceCard.vue";
import QuickPrompts from "./components/QuickPrompts.vue";
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

const DEFAULT_PROMPTS = [
  {
    label: "今日运营概览",
    text: "生成今天的运营概览报告",
    icon: "el-icon-s-data",
  },
  {
    label: "库存异常",
    text: "找出当前库存异常的物料，并生成一份异常专报",
    icon: "el-icon-warning-outline",
  },
  {
    label: "本月趋势",
    text: "分析本月出入库趋势，并给出关键结论",
    icon: "el-icon-pie-chart",
  },
  {
    label: "生成周报",
    text: "生成一份本周的运营周报",
    icon: "el-icon-document",
  },
];

export default {
  name: "agent-chat",
  components: {
    "el-x-bubble-list": ElXBubbleList,
    "el-x-sender": ElXSender,
    "trace-timeline": TraceTimeline,
    "evidence-card": EvidenceCard,
    "quick-prompts": QuickPrompts,
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
    showSql: { type: Boolean, default: false },
    examples: { type: Array, default: () => [] },
  },
  data() {
    return {
      open: false,
      showHistory: false,
      historyQuery: "",
      conversations: [],
      conversationId: null,
      messages: [],
      input: "",
      inputMode: "auto",
      editIndex: null,
      sending: false,
      controller: null,
      panelSize: { width: 404, height: 634 },
      configError: "",
      bannerOpen: false,
      agentUnreachable: false,
      checkingConnection: false,
      connectionInfo: null,
      // 设置（模型 / 密钥）：密钥存本机浏览器，不写进代码
      settingsOpen: false,
      settings: null,
      providers: llmProviders,
      settingsForm: {
        provider: "deepseek",
        baseUrl: "",
        model: "",
        apiKey: "",
        showSql: false,
        requireSqlApproval: false,
      },
      testing: false,
      testResult: null,
      modes: [
        { value: "auto", label: "智能问答" },
        { value: "report", label: "报告" },
        { value: "detail", label: "明细" },
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
      const custom = this.agentChatConfig.placeholder || globalConfig.placeholder;
      if (this.inputMode === "report") return "描述要生成的报告，例如：生成一份本周运营周报";
      if (this.inputMode === "detail") return "描述要查看的明细，例如：列出库存异常的前 20 条";
      return custom;
    },
    currentProvider() {
      return this.providers.find(p => p.value === this.settingsForm.provider) || null;
    },
    currentProviderModels() {
      const provider = this.currentProvider;
      const list =
        provider && Array.isArray(provider.models) ? provider.models.slice() : [];
      if (!list.length) return [];
      const current = this.settingsForm.model;
      if (current && !list.includes(current)) list.unshift(current);
      return list;
    },
    currentProviderHint() {
      const provider = this.currentProvider;
      return provider && provider.hint ? provider.hint : "";
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
    effectiveShowSql() {
      if (this.settings && typeof this.settings.showSql === "boolean") {
        return this.settings.showSql;
      }
      if (this.showSql) return true;
      return this.agentChatConfig.showSql === true || globalConfig.showSql === true;
    },
    requestConfig() {
      const ac = this.agentChatConfig;
      const cfg = {};
      const db = ac.db || globalConfig.db;
      if (db) cfg.db = db;
      const llm = this.effectiveLlm;
      cfg.llm = { apiKey: llm.apiKey, baseUrl: llm.baseUrl, model: llm.model };
      const sourceLimits = ac.limits || globalConfig.limits || {};
      const hasLocalApproval = !!(this.settings && this.settings.requireSqlApproval);
      if (sourceLimits || hasLocalApproval) {
        cfg.limits = Object.assign({}, sourceLimits);
        if (hasLocalApproval) cfg.limits.requireSqlApproval = true;
      }
      return cfg;
    },
    bubbleMaxWidth() {
      if (this.isInline) return "100%";
      return Math.max(220, this.panelSize.width - 34) + "px";
    },
    quickPrompts() {
      const raw = this.examples.length
        ? this.examples
        : this.agentChatConfig.examples || globalConfig.examples || [];
      const configured = Array.isArray(raw) ? raw : [];
      if (!configured.length) return DEFAULT_PROMPTS;
      return configured
        .map(item =>
          typeof item === "string"
            ? { label: item, text: item, icon: "el-icon-chat-line-round" }
            : {
                label: item.label || item.text || "",
                text: item.text || item.label || "",
                icon: item.icon || "el-icon-chat-line-round",
              },
        )
        .filter(item => item.text);
    },
    modeHintText() {
      if (this.inputMode === "report") return "优先输出完整 HTML 报告";
      if (this.inputMode === "detail") return "优先输出明细数据和结论";
      return "自动选择最合适的形式";
    },
    connectionState() {
      if (this.checkingConnection) return "checking";
      if (!this.effectiveLlm.apiKey) return "warn";
      if (this.agentUnreachable) return "offline";
      if (this.configError) return "warn";
      return "online";
    },
    connectionText() {
      if (this.connectionState === "checking") return "正在检测连接…";
      if (this.connectionState === "warn" && !this.effectiveLlm.apiKey) return "未配置模型";
      if (this.connectionState === "offline") return "本地服务未连接";
      if (this.connectionState === "warn") return "配置异常";
      const db = this.connectionInfo && this.connectionInfo.db;
      const parts = ["在线"];
      if (db && db.database) parts.push(db.database);
      if (db && db.tableCount) parts.push(db.tableCount + " 张表");
      if (db && db.readOnly !== false) parts.push("只读");
      return parts.join(" · ");
    },
    connectionTitle() {
      if (this.configError) return this.configError;
      if (this.agentUnreachable) return "本机查询服务未启动";
      if (!this.effectiveLlm.apiKey) return "尚未配置大模型密钥";
      return "服务状态正常";
    },
    conversationGroups() {
      const keyword = this.historyQuery.trim().toLowerCase();
      const filtered = this.conversations.filter(item => {
        if (!keyword) return true;
        return String(item.title || "新会话")
          .toLowerCase()
          .includes(keyword);
      });
      const sorted = filtered.slice().sort((a, b) => {
        const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pin !== 0) return pin;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      const groups = [];
      const pinned = sorted.filter(item => item.pinned);
      const rest = sorted.filter(item => !item.pinned);
      if (pinned.length) groups.push({ label: "置顶", items: pinned });
      const buckets = new Map();
      rest.forEach(item => {
        const label = this.dayLabel(item.updatedAt);
        if (!buckets.has(label)) buckets.set(label, []);
        buckets.get(label).push(item);
      });
      ["今天", "昨天", "更早"].forEach(label => {
        if (buckets.has(label)) groups.push({ label, items: buckets.get(label) });
      });
      return groups;
    },
    bubbleList() {
      return this.messages.map((m, sourceIndex) => ({
        sourceIndex,
        content: m.content,
        role: m.role,
        placement: m.role === "user" ? "end" : "start",
        loading: !!m.loading,
        notice: m.notice || "",
        steps: m.steps || [],
        streaming: !!m.streaming,
        error: m.error || "",
        interrupt: m.interrupt || null,
        table: m.table || null,
        visuals: m.visuals || [],
        usage: m.usage || null,
        meta: m.meta || null,
        suggestions: m.suggestions || [],
      }));
    },
  },
  watch: {
    effectiveUserId() {
      this.handleUserChange();
    },
    configError(value) {
      if (value) this.bannerOpen = true;
    },
    open(value) {
      if (value) this.$nextTick(this.focusSender);
    },
    showHistory(value) {
      if (value) {
        this.$nextTick(() => {
          const input = this.$el.querySelector(".agent-chat-history__search input");
          if (input) input.focus();
        });
      }
    },
  },
  mounted() {
    this.init();
    this.loadUserSettings();
    const checkOnMount = this.agentChatConfig.checkOnMount;
    const shouldCheck =
      checkOnMount !== undefined ? checkOnMount !== false : globalConfig.checkOnMount !== false;
    if (shouldCheck && this.effectiveLlm.apiKey) {
      this.checkConnection();
    }
    // 忽略浏览器对 ResizeObserver 的良性循环告警（图表/报表自适应尺寸时常见），
    // 避免 dev 环境的报错浮层误弹。捕获阶段拦截，先于 dev-server overlay 的处理。
    this._roGuard = e => {
      const msg = (e && (e.message || (e.reason && e.reason.message))) || "";
      if (msg.indexOf("ResizeObserver loop") !== -1) {
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        if (e.preventDefault) e.preventDefault();
      }
    };
    this._onKeydown = e => {
      if (e.key !== "Escape") return;
      if (this.settingsOpen) return;
      if (this.showHistory) {
        this.showHistory = false;
        return;
      }
      if (this.isLauncher && this.open) this.open = false;
    };
    window.addEventListener("error", this._roGuard, true);
    window.addEventListener("unhandledrejection", this._roGuard, true);
    window.addEventListener("keydown", this._onKeydown);
  },
  beforeDestroy() {
    this.cancel();
    if (this._roGuard) {
      window.removeEventListener("error", this._roGuard, true);
      window.removeEventListener("unhandledrejection", this._roGuard, true);
      this._roGuard = null;
    }
    if (this._onKeydown) {
      window.removeEventListener("keydown", this._onKeydown);
      this._onKeydown = null;
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
        showSql: this.effectiveShowSql,
        requireSqlApproval: !!(this.settings && this.settings.requireSqlApproval),
      };
      this.testResult = null;
      this.settingsOpen = true;
    },
    onProviderChange(value) {
      const preset = llmProviders.find(p => p.value === value);
      if (preset && value !== "custom") {
        this.settingsForm.baseUrl = preset.baseUrl;
        this.settingsForm.model =
          (preset.models && preset.models[0]) || preset.model || "";
      } else if (value === "custom") {
        this.settingsForm.baseUrl = "";
        this.settingsForm.model = "";
      }
      // 不同厂商的 Key 不通用，切换后清空，避免误用上一家的 Key。
      this.settingsForm.apiKey = "";
    },
    async testConnection() {
      this.testing = true;
      this.testResult = null;
      try {
        const result = await checkConfig({
          agentBaseUrl: this.effectiveAgentBaseUrl,
          encryptConfig: this.agentChatConfig.encryptConfig,
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
      this.settings = {
        llm: {
          provider: this.settingsForm.provider,
          baseUrl: this.settingsForm.baseUrl,
          model: this.settingsForm.model,
          apiKey: this.settingsForm.apiKey,
        },
        showSql: !!this.settingsForm.showSql,
        requireSqlApproval: !!this.settingsForm.requireSqlApproval,
      };
      saveSettings(this.effectiveUserId, this.settings);
      this.settingsOpen = false;
      this.checkConnection();
    },
    clearApiKey() {
      this.settingsForm.apiKey = "";
      this.settings = {
        llm: {
          provider: this.settingsForm.provider,
          baseUrl: this.settingsForm.baseUrl,
          model: this.settingsForm.model,
          apiKey: "",
        },
        showSql: !!this.settingsForm.showSql,
        requireSqlApproval: !!this.settingsForm.requireSqlApproval,
      };
      saveSettings(this.effectiveUserId, this.settings);
      this.testResult = null;
      if (this.$message) this.$message.success("已清除本机密钥");
    },
    async checkConnection() {
      if (this.checkingConnection) return;
      if (!this.effectiveLlm.apiKey) {
        this.checkingConnection = false;
        this.agentUnreachable = false;
        this.connectionInfo = null;
        this.configError = "";
        return;
      }
      this.checkingConnection = true;
      try {
        const result = await checkConfig({
          agentBaseUrl: this.effectiveAgentBaseUrl,
          encryptConfig: this.agentChatConfig.encryptConfig,
          config: this.requestConfig,
        });
        this.agentUnreachable = false;
        this.connectionInfo = result || null;
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
        this.connectionInfo = null;
        this.configError = `未检测到本地查询服务：${(e && e.message) || e}`;
      } finally {
        this.checkingConnection = false;
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
    copyReportMeta(item) {
      if (!item || !item.content) return;
      this.copyText(item.content);
    },
    toggleOpen() {
      this.open = !this.open;
      if (!this.open) this.showHistory = false;
    },
    toggleHistory() {
      this.showHistory = !this.showHistory;
    },
    focusSender() {
      const sender = this.$refs.sender;
      if (!sender) return;
      if (typeof sender.focus === "function") {
        sender.focus();
        return;
      }
      const el = sender.$el && sender.$el.querySelector("textarea");
      if (el) el.focus();
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
    handleUserChange() {
      this.cancel(true);
      this.showHistory = false;
      this.historyQuery = "";
      this.cancelEdit();
      this.loadUserSettings();
      this.init();
      this.testResult = null;
      this.connectionInfo = null;
      this.configError = "";
      this.bannerOpen = false;
      this.agentUnreachable = false;
      if (this.effectiveLlm.apiKey) this.checkConnection();
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
    isCurrentEmpty() {
      return !this.sending && this.messages.length === 0;
    },
    newConversation() {
      this.cancel();
      this.cancelEdit();
      if (this.isCurrentEmpty()) {
        this.$nextTick(this.focusSender);
        return;
      }
      const created = createConversation(this.effectiveUserId);
      this.refreshConversations();
      this.conversationId = created.id;
      this.messages = [];
      this.$nextTick(this.focusSender);
    },
    selectConversation(id) {
      if (!id || id === this.conversationId) {
        this.showHistory = false;
        return;
      }
      this.cancel();
      this.cancelEdit();
      this.conversationId = id;
      this.messages = loadMessages(this.effectiveUserId, id);
      this.showHistory = false;
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
    async deleteConversation(item) {
      const id = item && (item.id || item.uniqueKey);
      if (!id) return;
      try {
        await this.$confirm("删除后聊天记录不可恢复，确定删除吗？", "删除会话", {
          confirmButtonText: "删除",
          cancelButtonText: "取消",
          type: "warning",
        });
      } catch {
        return;
      }
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
      if (this.$message) this.$message.success("已删除");
    },
    formatRelativeTime(timestamp) {
      if (!timestamp) return "";
      const diff = Date.now() - timestamp;
      if (diff < 60 * 1000) return "刚刚";
      if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + " 分钟前";
      if (this.dayLabel(timestamp) === "今天") {
        const date = new Date(timestamp);
        return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
      return this.dayLabel(timestamp);
    },
    dayLabel(timestamp) {
      if (!timestamp) return "更早";
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (timestamp >= start) return "今天";
      if (timestamp >= start - 24 * 60 * 60 * 1000) return "昨天";
      return "更早";
    },
    async send() {
      const text = this.input.trim();
      if (!text) return;
      await this.sendText(text, true);
    },
    async sendText(text, fromInput) {
      const value = String(text || "").trim();
      if (!value || this.sending) return;
      if (!this.effectiveLlm.apiKey) {
        if (this.$message) this.$message.warning("请先配置模型密钥");
        this.openSettings();
        return;
      }
      if (this.agentUnreachable) {
        if (this.$message) this.$message.warning("本地查询服务未启动，请先启动服务");
        this.checkConnection();
        return;
      }
      if (this.configError) {
        try {
          await this.$confirm(
            `${this.configError}\n仍要尝试发送吗？`,
            "配置异常",
            { confirmButtonText: "继续发送", cancelButtonText: "取消", type: "warning" },
          );
        } catch {
          return;
        }
      }
      if (this.editIndex !== null) {
        this.messages.splice(this.editIndex);
        this.editIndex = null;
      }
      if (fromInput) this.input = "";
      this.messages.push({ role: "user", content: value, steps: [] });
      this.persist();
      this.runAssistantReply();
    },
    editUserMessage(index) {
      if (this.sending) this.cancel();
      const msg = this.messages[index];
      if (!msg || msg.role !== "user") return;
      this.editIndex = index;
      this.input = msg.content;
      this.$nextTick(this.focusSender);
    },
    cancelEdit() {
      this.editIndex = null;
      this.input = "";
    },
    regenerate(index) {
      if (this.sending) return;
      this.messages.splice(index);
      this.persist();
      this.runAssistantReply();
    },
    applyToolStart(reply, event) {
      if (!event || !event.name) return;
      const id = event.id || `step-${Date.now()}-${reply.steps.length}`;
      const input = event.input || {};
      let step = reply.steps.find(item => item.id === id);
      if (!step) {
        const sql = input.sql || "";
        step = {
          id,
          name: event.name,
          label: event.label || toolLabel(event.name),
          status: "running",
          startedAt: event.startedAt || Date.now(),
          durationMs: 0,
          detail: buildToolDetail(event.name, input),
          sql,
          table: input.table || "",
          tables: tablesFromSql(sql),
          rowCount: 0,
          truncated: false,
          columns: 0,
          tableCount: 0,
          error: "",
        };
        reply.steps.push(step);
      }
      reply.streaming = true;
    },
    applyToolEnd(reply, event) {
      if (!event || !event.name) return;
      const summary = event.summary || {};
      let step = event.id ? reply.steps.find(item => item.id === event.id) : null;
      if (!step) {
        step = reply.steps.find(item => item.name === event.name && item.status === "running");
      }
      if (!step) {
        step = {
          id: event.id || `step-${Date.now()}-${reply.steps.length}`,
          name: event.name,
          label: event.label || toolLabel(event.name),
          status: "running",
          durationMs: 0,
          detail: "",
          sql: "",
          table: "",
          tables: [],
          rowCount: 0,
          truncated: false,
          columns: 0,
          tableCount: 0,
          error: "",
        };
        reply.steps.push(step);
      }
      if (!step.label || step.label === event.name) {
        step.label = event.label || toolLabel(event.name);
      }
      step.status = event.ok === false ? "error" : "success";
      step.durationMs = Number(event.durationMs) || step.durationMs || 0;
      if (event.name === "run_sql") {
        const rows = Number(summary.rowCount) || 0;
        step.rowCount = rows;
        step.truncated = !!summary.truncated;
        step.detail = `${rows} 行${summary.truncated ? " · 已截断" : ""}`;
        if (!step.tables || !step.tables.length) step.tables = tablesFromSql(step.sql);
      } else if (event.name === "get_table_schema") {
        const table = summary.table || step.table || "";
        step.table = table;
        step.columns = Number(summary.columns) || 0;
        step.tables = table ? [table] : step.tables || [];
        step.detail = `${table}${summary.columns ? " · " + summary.columns + " 列" : ""}`;
      } else if (event.name === "list_tables") {
        step.tableCount = Number(summary.tableCount) || 0;
        step.detail = `${step.tableCount} 张表`;
      } else if (summary.title) {
        step.detail = summary.title;
      } else if (summary.component) {
        step.detail = "已生成";
      }
      if (summary.error) step.error = String(summary.error);
    },
    deriveSuggestions(reply) {
      const visuals = reply.visuals || [];
      const hasReport = visuals.some(
        item => item && (item.component === "ol-html-report" || item.component === "ol-report"),
      );
      if (hasReport) {
        return ["按仓库拆分看看", "只看异常 Top 10", "对比上一周期"];
      }
      if (reply.table && reply.table.rows && reply.table.rows.length) {
        return ["按时间趋势看一下", "只看前 10 行", "生成一份分析报告"];
      }
      return ["换一种说法解释", "生成一份分析报告", "继续分析原因"];
    },
    createAssistantReply() {
      return {
        role: "assistant",
        content: "",
        loading: true,
        streaming: true,
        notice: "",
        error: "",
        interrupt: null,
        steps: [],
        table: null,
        visuals: [],
        usage: null,
        meta: null,
        suggestions: [],
      };
    },
    runAssistantReply() {
      const reply = this.createAssistantReply();
      this.messages.push(reply);
      this.startStream(reply);
    },
    resumeInterrupt(index, decision) {
      const target = this.messages[index];
      if (!target || !target.interrupt || this.sending) return;
      const payload = target.interrupt;
      const interrupts = Array.isArray(payload.interrupts) ? payload.interrupts : [];
      const actions = [];
      interrupts.forEach(item => {
        const value = item && item.value;
        if (value && Array.isArray(value.actionRequests)) {
          value.actionRequests.forEach(action => actions.push(action));
        }
      });
      if (!actions.length) {
        target.interrupt = null;
        this.persist();
        return;
      }
      const decisions = actions.map(() =>
        decision === "approve"
          ? { type: "approve" }
          : { type: "reject", message: "用户取消了本次查询" },
      );
      const threadId = payload.threadId;
      if (!threadId) {
        if (this.$message) this.$message.error("审批会话已过期，请重新发起查询");
        target.interrupt = null;
        this.persist();
        return;
      }
      target.interrupt = null;
      target.notice = decision === "approve" ? "已确认，继续执行" : "已取消本次查询";
      this.persist();
      const reply = this.createAssistantReply();
      this.messages.push(reply);
      this.startStream(reply, { threadId, decisions });
    },
    startStream(reply, resume) {
      this.sending = true;
      this._activeReply = reply;

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
        reply.streaming = false;
        this._finalize = null;
      };
      this._finalize = finalize;

      const history = this.messages.filter(m => m !== reply);
      const payload = history.map(m => ({ role: m.role, content: m.content }));
      if (!resume && this.inputMode === "report") {
        payload.unshift({ role: "system", content: "本轮请优先使用 render_html_report 输出完整 HTML 报告。" });
      } else if (!resume && this.inputMode === "detail") {
        payload.unshift({ role: "system", content: "本轮请优先返回明细数据和关键结论，不要生成完整报告。" });
      }

      // 把上一份报告的版式带回服务端，用于避免连续生成结构完全相同的报告
      const lastVisual = [...history]
        .reverse()
        .find(m => m.role === "assistant" && m.visuals && m.visuals.length);
      const lastVisualSpec = lastVisual ? lastVisual.visuals[lastVisual.visuals.length - 1] : null;

      this.controller = streamChat({
        agentBaseUrl: this.effectiveAgentBaseUrl,
        encryptConfig: this.agentChatConfig.encryptConfig,
        config: this.requestConfig,
        messages: payload,
        conversationId: this.conversationId,
        lastLayout: lastVisualSpec && lastVisualSpec.layout,
        lastVisualStyle: lastVisualSpec && lastVisualSpec.visualStyle,
        lastElements: lastVisualSpec && lastVisualSpec.elements,
        resume,
        handlers: {
          onToken: token => {
            if (reply.loading) reply.loading = false;
            buffer.text += token;
            schedule();
          },
          onToolStart: event => this.applyToolStart(reply, event),
          onToolEnd: event => this.applyToolEnd(reply, event),
          onStatus: message => {
            reply.notice = message || "";
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
          onUsage: usage => {
            reply.usage = usage || null;
          },
          onMeta: meta => {
            reply.meta = meta || null;
          },
          onSuggestions: items => {
            if (Array.isArray(items)) reply.suggestions = items.map(String).filter(Boolean);
          },
          onInterrupt: payload => {
            finalize();
            reply.steps.forEach(step => {
              if (step.status === "running") step.status = "cancelled";
            });
            reply.interrupt = payload || null;
            this.sending = false;
            this._activeReply = null;
            this.persist();
          },
          onDone: () => {
            finalize();
            reply.steps.forEach(step => {
              if (step.status === "running") step.status = "success";
            });
            this.sending = false;
            this._activeReply = null;
            if (!reply.suggestions.length) reply.suggestions = this.deriveSuggestions(reply);
            this.persist();
          },
          onError: message => {
            finalize();
            reply.steps.forEach(step => {
              if (step.status === "running") step.status = "error";
            });
            reply.error = message || "请求失败";
            this.sending = false;
            this._activeReply = null;
            this.persist();
          },
        },
      });
    },
    cancel(skipPersist) {
      const reply = this._activeReply;
      const had = !!this._finalize;
      if (this._finalize) this._finalize();
      if (reply) {
        reply.steps.forEach(step => {
          if (step.status === "running") step.status = "cancelled";
        });
        const hasContent =
          !!reply.content ||
          (reply.visuals && reply.visuals.length) ||
          !!reply.table ||
          (reply.steps && reply.steps.length);
        if (hasContent) {
          reply.notice = "已停止生成";
        } else {
          const index = this.messages.indexOf(reply);
          if (index >= 0) this.messages.splice(index, 1);
        }
      }
      if (this.controller) {
        this.controller.abort();
        this.controller = null;
      }
      this.sending = false;
      this._activeReply = null;
      if (had && !skipPersist) this.persist();
    },
    cleanTitle(text) {
      return String(text || "")
        .replace(/[#>*`_~\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 16);
    },
    persist() {
      const uid = this.effectiveUserId;
      const clean = this.messages.map(m => ({
        role: m.role,
        content: m.content,
        notice: m.notice || "",
        error: m.error || "",
        interrupt: m.interrupt || null,
        steps: m.steps || [],
        table: m.table || null,
        visuals: m.visuals || [],
        usage: m.usage || null,
        meta: m.meta || null,
        suggestions: m.suggestions || [],
      }));
      saveMessages(uid, this.conversationId, clean);

      const firstUser = clean.find(m => m.role === "user");
      if (firstUser) {
        const convs = loadConversations(uid);
        const target = convs.find(c => c.id === this.conversationId);
        if (target && (target.title === "新会话" || !target.title)) {
          target.title = this.cleanTitle(firstUser.content);
        }
        if (target) target.updatedAt = Date.now();
        saveConversations(uid, convs);
        this.refreshConversations();
      }
    },
    showEvidence(item) {
      if (!item || item.role !== "assistant") return false;
      const meta = item.meta || {};
      return Boolean(
        meta.queries ||
          meta.rowCount ||
          (meta.tables && meta.tables.length) ||
          (meta.warnings && meta.warnings.length) ||
          !!meta.report ||
          (item.steps && item.steps.some(step => step.sql || step.table)) ||
          (item.table && item.table.rows && item.table.rows.length),
      );
    },
    interruptActions(item) {
      const actions = [];
      const interrupts =
        item && item.interrupt && Array.isArray(item.interrupt.interrupts)
          ? item.interrupt.interrupts
          : [];
      interrupts.forEach(entry => {
        const value = entry && entry.value;
        if (value && Array.isArray(value.actionRequests)) {
          value.actionRequests.forEach(action => actions.push(action));
        }
      });
      return actions;
    },
    isAuthError(message) {
      return /401|403|key|密钥|鉴权|unauthorized|forbidden|invalid.api/i.test(
        String(message || ""),
      );
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
.agent-chat-header__text {
  min-width: 0;
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
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.9;
}
.ac-conn {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: #c0c4cc;
}
.ac-conn.is-online {
  background: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25);
}
.ac-conn.is-warn {
  background: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.25);
}
.ac-conn.is-offline {
  background: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.25);
}
.ac-conn.is-checking {
  background: #c0c4cc;
  animation: ac-conn-pulse 1.2s infinite ease-in-out;
}
.ac-conn__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  color: #fff;
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
.agent-chat-icon:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: 1px;
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
.agent-chat-banner > i {
  margin-top: 2px;
}
.agent-chat-banner__body {
  flex: 1;
  min-width: 0;
}
.agent-chat-banner__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.agent-chat-banner__head > span {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}
.agent-chat-banner__close {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: #f56c6c;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.4;
  padding: 0 2px;
}
.agent-chat-banner__actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
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
.ac-settings-hint-inline {
  margin-left: 8px;
  font-size: 11px;
  color: #909399;
}
.ac-settings-hint-block {
  margin-top: 4px;
  font-size: 11px;
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
.ac-settings-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.ac-settings-danger {
  margin-right: auto;
  color: #f56c6c;
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
.agent-chat-history-mask {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgba(17, 24, 39, 0.28);
}
.agent-chat-history {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(260px, 86%);
  z-index: 5;
  background: #fff;
  border-right: 1px solid #ebeef5;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.agent-chat-history__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 8px;
}
.agent-chat-history__title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.agent-chat-history__close {
  border: none;
  background: transparent;
  color: #909399;
  font-size: 14px;
  cursor: pointer;
  padding: 2px;
}
.agent-chat-history__close:hover {
  color: #4f7cff;
}
.agent-chat-history__search {
  margin-bottom: 8px;
}
.ac-convs {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-conv-group {
  margin-bottom: 6px;
}
.ac-conv-group__label {
  padding: 4px 8px;
  font-size: 11px;
  color: #909399;
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
.ac-conv__time {
  flex: 0 0 auto;
  font-size: 10.5px;
  color: #b1b6bf;
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
.ac-conv-empty {
  padding: 24px 8px;
  text-align: center;
  font-size: 12px;
  color: #b1b6bf;
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
  padding: 0 18px;
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
.ac-empty-cta {
  margin-top: 14px;
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  color: #fff;
  font-size: 12.5px;
  cursor: pointer;
  background: linear-gradient(135deg, #4f7cff, #6aa1ff);
  box-shadow: 0 6px 16px rgba(79, 124, 255, 0.28);
}

/* ===== 输入区 ===== */
.agent-chat-sender {
  padding: 8px 12px 12px;
  border-top: 1px solid #f0f2f5;
  flex-shrink: 0;
}
.ac-edit-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  padding: 5px 9px;
  border-radius: 7px;
  color: #b88230;
  background: rgba(230, 162, 60, 0.1);
  font-size: 11.5px;
  line-height: 1.4;
}
.ac-edit-tip__cancel {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: #4f7cff;
  font-size: 11.5px;
  cursor: pointer;
  padding: 0;
}
.ac-mode-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  min-width: 0;
}
.ac-mode {
  padding: 3px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: #f5f7fa;
  color: #909399;
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
}
.ac-mode:hover {
  color: #4f7cff;
}
.ac-mode.is-active {
  border-color: rgba(79, 124, 255, 0.35);
  color: #4f7cff;
  background: #eef3ff;
}
.ac-mode-hint {
  min-width: 0;
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  color: #b1b6bf;
}

/* 上下文压缩等轻量状态提示（不进入回答正文，不参与复制/导出） */
.ac-status {
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}
.ac-status::before {
  content: "·";
  margin-right: 4px;
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
@keyframes ac-conn-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* ===== 错误卡片 ===== */
.ac-error {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid rgba(245, 108, 108, 0.28);
  border-radius: 8px;
  background: rgba(245, 108, 108, 0.06);
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.55;
}
.ac-error > i {
  margin-top: 2px;
  flex: 0 0 auto;
}
.ac-error__body {
  min-width: 0;
}
.ac-error__text {
  word-break: break-all;
}
.ac-error__actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11.5px;
}

/* ===== SQL 审批卡片（LangChain HITL） ===== */
.ac-approval {
  margin-top: 4px;
  padding: 9px 10px;
  border: 1px solid rgba(230, 162, 60, 0.35);
  border-radius: 8px;
  background: rgba(230, 162, 60, 0.07);
  color: #8a5a12;
  font-size: 12px;
  line-height: 1.55;
}
.ac-approval__head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.ac-approval__action {
  margin-top: 6px;
}
.ac-approval__title {
  color: #8a5a12;
  font-size: 11.5px;
}
.ac-approval__action pre {
  margin: 4px 0 0;
  padding: 7px 8px;
  max-height: 150px;
  overflow: auto;
  border: 1px solid #f0e0c2;
  border-radius: 6px;
  background: #fffdf8;
  color: #4b3a1f;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
.ac-approval__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.ac-approval__btn {
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #606266;
  font-size: 11.5px;
  cursor: pointer;
}
.ac-approval__btn:hover {
  border-color: #4f7cff;
  color: #4f7cff;
}
.ac-approval__btn.is-primary {
  border-color: #4f7cff;
  background: #4f7cff;
  color: #fff;
}
.ac-approval__btn.is-primary:hover {
  background: #3d6bf0;
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

/* 工具返回的结构化结果表（兼容旧引用） */
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

/* 消息操作栏（默认隐藏，悬停/最后一条/键盘聚焦时显示） */
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
.el-x-bubble-content-wrapper:focus-within .ac-actions,
.ac-actions.is-last,
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

/* 追问建议 */
.ac-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.ac-suggestion {
  padding: 4px 10px;
  border: 1px solid rgba(79, 124, 255, 0.28);
  border-radius: 999px;
  background: #f7f9ff;
  color: #4f7cff;
  font-size: 11.5px;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.ac-suggestion:hover {
  background: #eef3ff;
  border-color: rgba(79, 124, 255, 0.5);
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
