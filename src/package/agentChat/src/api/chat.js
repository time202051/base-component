import { globalConfig } from '../config.js';
import { encryptConfig } from '../crypto.js';

async function buildBody({
  messages,
  conversationId,
  config,
  configEnc,
  base,
  force,
  encryptConfig: encryptConfigEnabled,
  lastLayout,
  lastVisualStyle,
  lastElements,
}) {
  const body = { messages, conversationId };
  if (lastLayout) body.lastLayout = lastLayout;
  if (lastVisualStyle) body.lastVisualStyle = lastVisualStyle;
  if (Array.isArray(lastElements) && lastElements.length) body.lastElements = lastElements;
  if (configEnc) {
    body.configEnc = configEnc;
    return body;
  }
  if (config) {
    const shouldEncrypt =
      typeof encryptConfigEnabled === 'boolean'
        ? encryptConfigEnabled
        : globalConfig.encryptConfig !== false;
    if (shouldEncrypt) {
      try {
        body.configEnc = await encryptConfig(config, base, force);
        return body;
      } catch (e) {
        console.warn('[agent-chat] config 加密失败，降级明文发送：', (e && e.message) || e);
      }
    }
    body.config = config;
  }
  return body;
}

function parseSseBlock(text) {
  let data = '';
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf('data:') === 0) data += line.slice(5).replace(/^\s/, '');
  }
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function readError(res) {
  let detail = '请求失败（HTTP ' + res.status + '）';
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      detail = (j && (j.error || j.message)) || detail;
    } catch {
      if (text) detail = text.slice(0, 300);
    }
  } catch {
    /* ignore */
  }
  return detail;
}

async function cancelReader(reader) {
  try {
    await reader.cancel();
  } catch {
    /* ignore */
  }
}

/**
 * 流式对话（自实现 SSE 读取）。
 * - 非 text/event-stream 响应时读出服务端真正的 JSON 错误；
 * - 疑似握手公钥过期时刷新公钥重试一次；
 * - 结束时用 reader.cancel() 收尾，不再 abort 信号，避免 AbortError。
 */
export function streamChat({
  messages,
  conversationId,
  config,
  configEnc,
  encryptConfig: encryptConfigEnabled,
  lastLayout,
  lastVisualStyle,
  lastElements,
  agentBaseUrl,
  resume,
  handlers = {},
}) {
  const controller = new AbortController();
  const base = agentBaseUrl || globalConfig.agentBaseUrl;
  let finished = false;

  // 只记录结束状态并回调，绝不在这里 abort 信号
  const finish = (fn, arg) => {
    if (finished) return;
    finished = true;
    if (fn) fn(arg);
  };

  const emit = payload => {
    if (!payload || finished) return;
    switch (payload.type) {
      case 'token':
        if (handlers.onToken) handlers.onToken(payload.content);
        break;
      case 'tool_start':
        if (handlers.onToolStart) handlers.onToolStart(payload);
        break;
      case 'tool_end':
        if (handlers.onToolEnd) handlers.onToolEnd(payload);
        break;
      case 'tool_result':
        if (handlers.onToolResult) handlers.onToolResult(payload);
        break;
      case 'visual':
        if (handlers.onVisual) handlers.onVisual(payload);
        break;
      case 'status':
        if (handlers.onStatus) handlers.onStatus(payload.message);
        break;
      case 'usage':
        if (handlers.onUsage) handlers.onUsage(payload);
        break;
      case 'meta':
        if (handlers.onMeta) handlers.onMeta(payload);
        break;
      case 'suggestions':
        if (handlers.onSuggestions) handlers.onSuggestions(payload.items || payload);
        break;
      case 'heartbeat':
        if (handlers.onHeartbeat) handlers.onHeartbeat(payload);
        break;
      case 'interrupt':
        finish(handlers.onInterrupt, payload);
        break;
      case 'done':
        finish(handlers.onDone);
        break;
      case 'error':
        finish(handlers.onError, payload.message);
        break;
      default:
        break;
    }
  };

  const attempt = async forceKey => {
    let body;
    try {
      body = await buildBody({
        messages,
        conversationId,
        config,
        configEnc,
        lastLayout,
        lastVisualStyle,
        lastElements,
        base,
        encryptConfig: encryptConfigEnabled,
        force: forceKey,
      });
    } catch (e) {
      finish(handlers.onError, (e && e.message) || String(e));
      return 'fatal';
    }
    if (resume) {
      body.threadId = resume.threadId;
      body.decisions = resume.decisions;
    }
    if (controller.signal.aborted) return 'aborted';

    let res;
    try {
      res = await fetch(base + (resume ? '/chat/resume' : '/chat/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e) {
      if (controller.signal.aborted) return 'aborted';
      finish(handlers.onError, (e && e.message) || '连接中断');
      return 'fatal';
    }

    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.indexOf('text/event-stream') === -1) {
      const detail = await readError(res);
      return { retryable: !forceKey, detail };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const payload = parseSseBlock(block);
          if (payload) emit(payload);
          if (finished) {
            await cancelReader(reader);
            return 'stopped';
          }
        }
      }
      if (buffer.trim()) {
        const payload = parseSseBlock(buffer);
        if (payload) emit(payload);
      }
      finish(handlers.onDone);
    } catch (e) {
      if (!controller.signal.aborted) finish(handlers.onError, (e && e.message) || '连接中断');
    }
    return 'done';
  };

  const run = async () => {
    let result = await attempt(false);
    if (result && result.retryable && !controller.signal.aborted) {
      result = await attempt(true);
    }
    if (result && result.detail) finish(handlers.onError, result.detail);
  };

  run();

  return controller;
}

/** 连接自检：校验数据库与大模型是否可用。 */
export async function checkConfig({
  config,
  agentBaseUrl,
  encryptConfig: encryptConfigEnabled,
  signal,
} = {}) {
  const base = agentBaseUrl || globalConfig.agentBaseUrl;
  const body = {};
  if (config) {
    const shouldEncrypt =
      typeof encryptConfigEnabled === 'boolean'
        ? encryptConfigEnabled
        : globalConfig.encryptConfig !== false;
    if (shouldEncrypt) {
      try {
        body.configEnc = await encryptConfig(config, base);
      } catch (e) {
        console.warn('[agent-chat] config 加密失败，降级明文发送：', (e && e.message) || e);
        body.config = config;
      }
    } else {
      body.config = config;
    }
  }
  const res = await fetch(base + '/config/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    throw new Error('自检失败（HTTP ' + res.status + '）');
  }
  return res.json();
}
