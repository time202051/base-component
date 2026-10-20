import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

// 代码块：语法高亮 + 语言标签 + 复制按钮
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const info = token.info ? token.info.trim() : '';
  const lang = info.split(/\s+/)[0] || '';

  let highlighted;
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlighted = hljs.highlight(token.content, { language: lang }).value;
    } catch {
      highlighted = md.utils.escapeHtml(token.content);
    }
  } else {
    highlighted = md.utils.escapeHtml(token.content);
  }

  const label = lang || 'text';
  return (
    `<div class="ac-code">` +
    `<div class="ac-code__bar"><span class="ac-code__lang">${label}</span>` +
    `<span class="ac-code__copy">复制</span></div>` +
    `<pre class="ac-code__pre"><code class="hljs language-${label}">${highlighted}</code></pre>` +
    `</div>`
  );
};

// 链接统一新窗口打开
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// 表格外层套一个可横向滚动的容器（表格本身不换行，超出时表格内滚动）
md.renderer.rules.table_open = () => '<div class="ac-table-wrap"><table>';
md.renderer.rules.table_close = () => '</table></div>';

const cache = new Map();
const CACHE_MAX = 300;

export function renderMarkdown(text) {
  if (text === null || text === undefined) return '';
  const key = String(text);

  // 按内容缓存渲染结果：避免无关重渲染（改尺寸/开关历史）时重复解析
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let html;
  try {
    html = md.render(key);
  } catch {
    html = key;
  }

  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, html);
  return html;
}
