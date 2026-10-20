// 本地历史存储：按 userId 隔离，全部落在当前浏览器（localStorage）
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES = 300;

function conversationsKey(userId) {
  return `agentchat:${userId || 'default'}:conversations`;
}

function messagesKey(userId, conversationId) {
  return `agentchat:${userId || 'default'}:messages:${conversationId}`;
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // localStorage 超限或不可用时，降级为不持久化，避免中断对话
    console.warn('[agent-chat] localStorage 写入失败：', e && e.message);
  }
}

function settingsKey(userId) {
  return `agentchat:${userId || 'default'}:settings`;
}

// 用户在页面里填的运行时设置（模型/密钥等）：只存本机浏览器，不进代码仓库
export function loadSettings(userId) {
  try {
    const s = JSON.parse(localStorage.getItem(settingsKey(userId)) || 'null');
    return s && typeof s === 'object' ? s : null;
  } catch {
    return null;
  }
}

export function saveSettings(userId, settings) {
  safeSet(settingsKey(userId), JSON.stringify(settings || {}));
}

export function loadConversations(userId) {
  try {
    const list = JSON.parse(localStorage.getItem(conversationsKey(userId)) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveConversations(userId, conversations) {
  safeSet(conversationsKey(userId), JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
}

export function loadMessages(userId, conversationId) {
  try {
    const list = JSON.parse(localStorage.getItem(messagesKey(userId, conversationId)) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveMessages(userId, conversationId, messages) {
  const trimmed = messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
  safeSet(messagesKey(userId, conversationId), JSON.stringify(trimmed));
}

export function removeMessages(userId, conversationId) {
  try {
    localStorage.removeItem(messagesKey(userId, conversationId));
  } catch {
    /* ignore */
  }
}

export function createConversation(userId, title = '新会话') {
  const conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    updatedAt: Date.now(),
  };
  const conversations = loadConversations(userId);
  conversations.unshift(conversation);
  saveConversations(userId, conversations);
  return conversation;
}
