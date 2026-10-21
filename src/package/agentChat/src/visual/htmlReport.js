import { REPORT_CSS } from "./reportBaseCss.js";

let echartsUmdPromise = null;

/** 按需加载本地 ECharts UMD 源码（懒加载）。 */
export function loadEchartsUmd() {
  if (!echartsUmdPromise) {
    echartsUmdPromise = import("echarts/dist/echarts.min.js?raw")
      .then(m => (m && m.default ? m.default : m))
      .then(src => {
        if (typeof src !== "string" || src.length < 1000) {
          throw new Error(
            "[ol-report] 未能取到 echarts 源码：当前打包器不支持 `?raw`。" +
              "webpack 需配置 resourceQuery=/^\\?raw/ + type=asset/source 的规则。",
          );
        }
        return src;
      });
  }
  return echartsUmdPromise;
}

function safeJson(obj) {
  return JSON.stringify(obj || {}).replace(/</g, "\\u003c");
}

export function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BLOCKED_TAGS = ["script", "iframe", "frame", "object", "embed", "link", "meta", "base", "noscript", "form"];
const MAX_MODEL_CSS_CHARS = 60000;

/**
 * 消毒模型产出的 CSS：允许自由排版，但禁止外部资源与 CSS 注入执行。
 * - 不允许 @import / 外链字体 / 外链图片 / expression / behavior
 * - 允许 data:image 位图与 url(#id)
 * - 防止 </style> 提前闭合标签
 */
export function sanitizeCss(css) {
  let out = String(css == null ? "" : css);
  out = out.replace(/<\/style/gi, "<\\/style");
  out = out.replace(/@import\s+(?:url\()?[^;]+;?/gi, "");
  out = out.replace(/expression\s*\(/gi, "");
  out = out.replace(/(?:javascript|vbscript)\s*:/gi, "");
  out = out.replace(/(?:behavior|-moz-binding)\s*:/gi, "");
  out = out.replace(/@font-face\s*\{[\s\S]*?\}/gi, "");
  out = out.replace(/url\(\s*(['"]?)([^)]*?)\1\s*\)/gi, (whole, _quote, target) => {
    const value = String(target).trim();
    if (/^data:image\/(png|jpe?g|gif|webp)[;,]/i.test(value)) return whole;
    if (/^#/.test(value)) return whole;
    return "none";
  });
  return out;
}

function sanitizeCssAttr(css) {
  return sanitizeCss(css).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * 消毒模型产出的 HTML 片段：报告要在沙箱 iframe 里执行，且能下载离线打开，
 * 因此禁掉脚本 / 事件属性 / javascript: 伪协议 / 外部资源；
 * 样式允许自由写，但 style 属性与 <style> 内容会先经过 CSS 消毒。
 */
export function sanitizeReportHtml(html) {
  let out = String(html == null ? "" : html);
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  BLOCKED_TAGS.forEach(tag => {
    out = out.replace(new RegExp("<\\s*" + tag + "\\b[\\s\\S]*?<\\s*/\\s*" + tag + "\\s*>", "gi"), "");
    out = out.replace(new RegExp("<\\s*/?\\s*" + tag + "\\b[^>]*>", "gi"), "");
  });
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");
  out = out.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m, css) => ` style="${sanitizeCssAttr(css)}"`);
  out = out.replace(/\sstyle\s*=\s*'([^']*)'/gi, (_m, css) => ` style="${sanitizeCssAttr(css)}"`);
  out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_m, open, css, close) => {
    return open + sanitizeCss(css) + close;
  });
  out = out.replace(
    /\s(srcset|poster|action|formaction|ping|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    "",
  );
  out = out.replace(/(href|src)\s*=\s*"\s*(javascript|vbscript|data:text\/html)[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'\s*(javascript|vbscript|data:text\/html)[^']*'/gi, "$1='#'");
  out = out.replace(/(src)\s*=\s*"\s*(https?:)?\/\/[^"]*"/gi, '$1=""');
  out = out.replace(/(src)\s*=\s*'\s*(https?:)?\/\/[^']*'/gi, "$1=''");
  out = out.replace(/(href)\s*=\s*"\s*(https?:)?\/\/[^"]*"/gi, '$1="#"');
  out = out.replace(/(href)\s*=\s*'\s*(https?:)?\/\/[^']*'/gi, "$1='#'");
  return out;
}

/**
 * 注入到报告页内的运行脚本：图表初始化、目录、页脚、水印、
 * 数字兜底格式化、自适应高度上报、主题切换。
 */
const INIT_SCRIPT = `
(function () {
  var META = window.__OL_REPORT__ || {};
  var data = window.__OL_CHARTS__ || {};
  var PALETTE = ["#4f7cff","#22c1c3","#f59e0b","#8b5cf6","#ef4444","#10b981","#6366f1","#14b8a6"];
  var AXIS_COLOR = "#94a3b8", LINE_COLOR = "#e2e8f0", SPLIT_COLOR = "#eef2f7", LABEL_COLOR = "#64748b";
  var CLAMP_ROWS = 15, CLAMP_HEIGHT = 560;

  function thousands(intStr) { return String(intStr).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ","); }
  function compact(v) {
    if (typeof v !== "number" || !isFinite(v)) { return String(v); }
    var abs = Math.abs(v);
    if (abs >= 1e8) { return strip(v / 1e8) + "亿"; }
    if (abs >= 1e4) { return strip(v / 1e4) + "万"; }
    if (abs % 1 === 0) { return thousands(v); }
    return String(Math.round(v * 100) / 100);
  }
  function strip(v) {
    var s = (Math.round(v * 100) / 100).toFixed(2);
    return s.replace(/0+$/, "").replace(/\\.$/, "");
  }

  function base(opt) {
    opt = opt || {};
    if (!opt.color) { opt.color = PALETTE; }
    opt.textStyle = Object.assign({ color: "#334155", fontFamily: "inherit" }, opt.textStyle || {});
    if (opt.animationDuration == null) { opt.animationDuration = 600; }
    var arr = Array.isArray(opt.series) ? opt.series : (opt.series ? [opt.series] : []);
    var pieLike = arr.some(function (x) { return x && (x.type === "pie" || x.type === "gauge" || x.type === "funnel"); });
    if (opt.tooltip !== false) {
      opt.tooltip = Object.assign({ trigger: pieLike ? "item" : "axis", confine: true, backgroundColor: "rgba(255,255,255,.96)", borderColor: "#e8edf5", textStyle: { color: "#1f2937" } }, opt.tooltip || {});
    }
    if (pieLike) {
      arr.forEach(function (s) {
        if (!s || (s.type !== "pie" && s.type !== "funnel")) { return; }
        s.avoidLabelOverlap = true;
        if (!s.label) { s.label = { color: LABEL_COLOR, fontSize: 11 }; }
        if (!s.labelLine) { s.labelLine = { lineStyle: { color: "#cbd5e1" } }; }
      });
    }
    var axes = [];
    ["xAxis", "yAxis"].forEach(function (k) {
      var a = opt[k];
      if (!a) { return; }
      axes = axes.concat(Array.isArray(a) ? a : [a]);
    });
    axes.forEach(function (a) {
      if (!a || a.show === false) { return; }
      if (!a.axisLine) { a.axisLine = { lineStyle: { color: LINE_COLOR } }; }
      if (!a.axisTick) { a.axisTick = { show: false }; }
      if (!a.axisLabel) { a.axisLabel = {}; }
      if (a.axisLabel.color === undefined) { a.axisLabel.color = LABEL_COLOR; }
      if (a.axisLabel.fontSize === undefined) { a.axisLabel.fontSize = 11; }
      if (a.type === "value") {
        if (!a.splitLine) { a.splitLine = { lineStyle: { color: SPLIT_COLOR } }; }
        if (a.axisLabel.formatter === undefined) { a.axisLabel.formatter = function (v) { return compact(v); }; }
      } else if (a.splitLine === undefined) {
        a.splitLine = { show: false };
      }
    });
    var hasLegend = arr.length > 1 && !pieLike;
    if (hasLegend && opt.legend === undefined) {
      opt.legend = { bottom: 0, icon: "roundRect", itemWidth: 10, itemHeight: 10, itemGap: 14, textStyle: { color: LABEL_COLOR, fontSize: 11 } };
    } else if (opt.legend && typeof opt.legend === "object") {
      if (opt.legend.bottom === undefined && opt.legend.top === undefined) { opt.legend.bottom = 0; }
      if (opt.legend.icon === undefined) { opt.legend.icon = "roundRect"; }
      if (opt.legend.itemWidth === undefined) { opt.legend.itemWidth = 10; }
      if (opt.legend.itemHeight === undefined) { opt.legend.itemHeight = 10; }
      if (!opt.legend.textStyle) { opt.legend.textStyle = { color: LABEL_COLOR, fontSize: 11 }; }
    }
    if (!opt.grid) {
      opt.grid = { left: 14, right: 18, top: 44, bottom: opt.legend ? 26 : 6, containLabel: true };
    }
    if (opt.toolbox === undefined && META.chartToolbox !== false) {
      opt.toolbox = { right: 6, top: 0, itemSize: 12, itemGap: 6, showTitle: false, iconStyle: { borderColor: "#cbd5e1" }, feature: { saveAsImage: { title: "保存图片", pixelRatio: 2, backgroundColor: "#fff" } } };
    }
    return opt;
  }

  function q(id) {
    return document.querySelector('.ol-chart[data-id="' + id + '"]') ||
           document.querySelector('.ol-chart[id="' + id + '"]') ||
           document.getElementById(id);
  }

  function charts() { return document.querySelectorAll(".ol-chart"); }

  function initCharts() {
    var empty = !window.echarts;
    document.querySelectorAll('script[type="application/json"]').forEach(function (sc) {
      var id = sc.getAttribute("data-ol-chart") || sc.getAttribute("data-id") || sc.id;
      if (!id) { return; }
      try { data[id] = JSON.parse(sc.textContent || "{}"); } catch (e) {}
    });
    Object.keys(data).forEach(function (id) {
      var el = q(id);
      if (!el || el.getAttribute("data-ol-ready")) { return; }
      var opt = data[id];
      if (empty || !opt || (typeof opt === "object" && !Object.keys(opt).length)) {
        el.setAttribute("data-ol-empty", "1");
        return;
      }
      if (!el.style.height) { el.style.height = "320px"; }
      try {
        window.echarts.init(el).setOption(base(opt));
        el.setAttribute("data-ol-ready", "1");
        el.removeAttribute("data-ol-empty");
      } catch (e) {
        el.setAttribute("data-ol-empty", "1");
        if (window.console) { console.warn("[ol-report] chart " + id, e); }
      }
    });
    charts().forEach(function (el) {
      if (!el.getAttribute("data-ol-ready") && !el.querySelector("canvas")) {
        el.setAttribute("data-ol-empty", "1");
      }
    });
  }

  function resizeCharts() {
    if (!window.echarts) { return; }
    charts().forEach(function (el) {
      var inst = window.echarts.getInstanceByDom(el);
      if (inst) { inst.resize(); }
    });
  }

  /* ---- 数字兜底格式化：只处理"纯数字"文本节点，带单位/百分号的不动 ---- */
  var NUM_SELECTOR = ".num,td.num,th.num,.stat-value,.ring-value,.compare-now,.compare-prev,.kpi-value,.chip-value,.rank-value,.bar-value,.progress-top b";
  function formatNumbers() {
    document.querySelectorAll(NUM_SELECTOR).forEach(function (el) {
      if (el.children.length && el.childNodes.length) { /* 仍处理其中的文本节点 */ }
      for (var i = 0; i < el.childNodes.length; i++) {
        var node = el.childNodes[i];
        if (node.nodeType !== 3) { continue; }
        var raw = node.nodeValue;
        node.nodeValue = raw.replace(/(^\\s*)(-?[\\d,]+(?:\\.\\d+)?)(\\s*)$/, function (all, pre, numStr, post) {
          if (!/^-?[\\d,]+(?:\\.\\d+)?$/.test(numStr)) { return all; }
          var m = numStr.match(/^(-?)(\\d[\\d,]*)(\\.\\d+)?$/);
          if (!m) { return all; }
          var intPart = m[2].replace(/,/g, "");
          var out = m[1] + thousands(intPart) + (m[3] || "");
          return pre + out + post;
        });
      }
    });
  }

  /* ---- 数字 count-up：只动第一个文本节点，保留单位/后缀；导出前恢复最终值 ---- */
  function initCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      if (el.getAttribute("data-count-ready")) { return; }
      var raw = parseFloat(String(el.getAttribute("data-count")).replace(/,/g, ""));
      if (!isFinite(raw)) { return; }
      var node = null;
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (child.nodeType === 3 && String(child.nodeValue || "").trim()) { node = child; break; }
      }
      if (!node) { return; }
      var finalText = node.nodeValue;
      var decimalPart = (String(raw).split(".")[1] || "");
      var decimals = decimalPart.length;
      el.__olCountNode = node;
      el.__olCountFinal = finalText;
      el.setAttribute("data-count-ready", "1");
      var start = 0;
      var duration = 700;
      var t0 = 0;
      function frame(now) {
        if (!t0) { t0 = now; }
        var p = Math.min(1, (now - t0) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = start + (raw - start) * eased;
        node.nodeValue = formatCount(value, decimals);
        if (p < 1) { requestAnimationFrame(frame); } else { node.nodeValue = finalText; }
      }
      requestAnimationFrame(frame);
    });
  }

  function finishCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      if (el.__olCountNode && el.__olCountFinal != null) {
        el.__olCountNode.nodeValue = el.__olCountFinal;
      }
    });
  }

  function formatCount(value, decimals) {
    var text = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    var parts = text.split(".");
    return thousands(parts[0]) + (parts[1] ? "." + parts[1] : "");
  }

  /* ---- 章节信息上报：左侧导航由宿主组件渲染，文档本身保持纯内容 ---- */
  function collectSections() {
    var secs = document.querySelectorAll(".section");
    var list = [];
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    for (var i = 0; i < secs.length; i++) {
      var sec = secs[i];
      if (!sec.id) { sec.id = "ol-sec-" + (i + 1); }
      var titleEl = sec.querySelector(".section-title");
      var noEl = sec.querySelector(".section-no");
      list.push({
        id: sec.id,
        no: noEl && noEl.textContent.trim() ? noEl.textContent.trim() : String(i + 1),
        title: titleEl && titleEl.textContent.trim() ? titleEl.textContent.trim() : "第 " + (i + 1) + " 节",
        y: Math.round((sec.getBoundingClientRect().top + scrollTop) * 100) / 100
      });
    }
    notify("sections", list);
    return list;
  }

  function scrollToSection(id) {
    var el = id ? document.getElementById(id) : null;
    if (!el) { return; }
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      window.scrollTo(0, el.offsetTop || 0);
    }
  }

  /* 内部滚动时（预览限高 / 全屏）由 iframe 自己上报当前章节 */
  function bindActiveSection() {
    var secs = Array.prototype.slice.call(document.querySelectorAll(".section"));
    if (!secs.length) { return; }
    var ticking = false;
    function update() {
      ticking = false;
      var top = (window.pageYOffset || document.documentElement.scrollTop || 0) + 90;
      var current = secs[0];
      secs.forEach(function (s) { if (s.offsetTop <= top) { current = s; } });
      if (current && current.id) { notify("active", current.id); }
    }
    window.addEventListener("scroll", function () {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* 导出前调用：展开所有折叠/限高，保证导出的长图和 PDF 内容完整 */
  function prepareExport() {
    document.documentElement.classList.add("is-export");
    finishCounters();
    document.querySelectorAll("tr.is-hide").forEach(function (tr) { tr.classList.remove("is-hide"); });
    document.querySelectorAll(".table-wrap.is-clamped").forEach(function (wrap) {
      wrap.style.maxHeight = "none";
      wrap.style.overflow = "visible";
    });
    window.scrollTo(0, 0);
  }
  window.__OL_REPORT_PREPARE_EXPORT__ = prepareExport;

  /* ---- 表格结构兜底：列数不足的行会整行错位，直接隐藏并提示 ---- */
  function cellSpan(tr) {
    var n = 0;
    var cells = tr ? tr.children : [];
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (!c || (c.tagName !== "TD" && c.tagName !== "TH")) { continue; }
      var cs = parseInt(c.getAttribute("colspan") || "1", 10);
      n += isNaN(cs) || cs < 1 ? 1 : cs;
    }
    return n;
  }

  function normalizeTables() {
    document.querySelectorAll("table").forEach(function (table) {
      var headRow = table.tHead && table.tHead.rows ? table.tHead.rows[0] : null;
      var cols = cellSpan(headRow);
      var rows = table.rows || [];
      if (!cols) {
        for (var i = 0; i < rows.length; i++) {
          var hasTh = rows[i].getElementsByTagName && rows[i].getElementsByTagName("th").length > 0;
          if (hasTh) { cols = cellSpan(rows[i]); break; }
        }
      }
      if (!cols && rows.length) { cols = cellSpan(rows[0]); }
      if (!cols) { return; }

      var bad = 0;
      var bodies = table.tBodies || [];
      for (var b = 0; b < bodies.length; b++) {
        var bodyRows = bodies[b].rows;
        for (var r = 0; r < bodyRows.length; r++) {
          var tr = bodyRows[r];
          if (cellSpan(tr) === cols) { continue; }
          bad++;
          tr.setAttribute("data-ol-cells-bad", "1");
          tr.style.display = "none";
        }
      }
      if (!bad) { return; }
      var note = document.createElement("div");
      note.className = "table-note";
      note.textContent = "有 " + bad + " 行数据列数与表头不一致，已隐藏；请重新生成报告";
      if (table.parentNode) { table.parentNode.insertBefore(note, table.nextSibling); }
    });
  }

  /* ---- 长表折叠 ---- */
  function clampTables() {
    document.querySelectorAll("table").forEach(function (table) {
      var body = table.tBodies && table.tBodies[0];
      if (!body) { return; }
      var rows = Array.prototype.slice.call(body.rows);
      if (rows.length <= CLAMP_ROWS) { return; }
      var wrap = table.parentNode;
      if (!wrap || !wrap.classList || !wrap.classList.contains("table-wrap")) {
        wrap = document.createElement("div");
        wrap.className = "table-wrap";
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
      wrap.classList.add("is-clamped");
      wrap.style.maxHeight = CLAMP_HEIGHT + "px";
      rows.forEach(function (tr, i) { if (i >= CLAMP_ROWS) { tr.classList.add("is-hide"); } });
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "table-toggle";
      btn.textContent = "展开全部 " + rows.length + " 行";
      btn.addEventListener("click", function () {
        var opened = wrap.getAttribute("data-open") === "1";
        wrap.setAttribute("data-open", opened ? "0" : "1");
        rows.forEach(function (tr, i) { if (i >= CLAMP_ROWS) { tr.classList.toggle("is-hide", opened); } });
        wrap.style.maxHeight = opened ? CLAMP_HEIGHT + "px" : "none";
        btn.textContent = opened ? ("展开全部 " + rows.length + " 行") : "收起";
      });
      if (wrap.parentNode) { wrap.parentNode.insertBefore(btn, wrap.nextSibling); }
    });
  }

  /* ---- 页脚（期间/口径/数据来源/生成时间由前端注入，不依赖模型） ---- */
  function buildFooter() {
    var host = document.querySelector(".report") || document.body;
    if (!document.querySelector(".report-footer")) {
      var parts = [];
      if (META.title) { parts.push("报告：" + META.title); }
      if (META.period) { parts.push("期间：" + META.period); }
      if (META.scope) { parts.push("口径：" + META.scope); }
      if (META.sources && META.sources.length) { parts.push("数据表：" + META.sources.join("、")); }
      if (META.generatedAt) { parts.push("生成时间：" + META.generatedAt); }
      var el = document.createElement("div");
      el.className = "report-footer";
      var left = document.createElement("span");
      left.textContent = parts.join(" · ");
      var right = document.createElement("span");
      right.textContent = "本报告由 AI 基于数据库实时查询生成，仅供内部参考";
      el.appendChild(left);
      el.appendChild(right);
      host.appendChild(el);
    }
    if (!document.querySelector(".report-print-footer")) {
      var pf = document.createElement("div");
      pf.className = "report-print-footer";
      pf.textContent = [META.title || "分析报告", META.period || "", META.generatedAt || ""]
        .filter(Boolean)
        .join(" · ");
      document.body.appendChild(pf);
    }
  }

  /* ---- 数据质量提示（warnings 由模型填写，前端统一样式） ---- */
  function buildQuality() {
    var list = META.warnings;
    if (!list || !list.length || document.querySelector(".data-quality")) { return; }
    var box = document.createElement("div");
    box.className = "data-quality";
    var title = document.createElement("div");
    title.className = "data-quality__title";
    title.textContent = "数据质量提示";
    var ul = document.createElement("ul");
    for (var i = 0; i < list.length; i++) {
      var li = document.createElement("li");
      li.textContent = String(list[i]);
      ul.appendChild(li);
    }
    box.appendChild(title);
    box.appendChild(ul);
    var report = document.querySelector(".report") || document.body;
    var header = report.querySelector(".report-header");
    if (header && header.parentNode) {
      header.parentNode.insertBefore(box, header.nextSibling);
    } else {
      report.insertBefore(box, report.firstChild);
    }
  }

  /* ---- 水印 ---- */
  function buildWatermark() {
    var text = META.watermark;
    if (!text || document.querySelector(".report-watermark")) { return; }
    var safe = String(text).replace(/[<>&"']/g, "");
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="190">' +
      '<text x="140" y="104" text-anchor="middle" transform="rotate(-24 140 104)" ' +
      'font-family="-apple-system,Segoe UI,PingFang SC,Microsoft YaHei,sans-serif" font-size="14" fill="#334155">' + safe + "</text></svg>";
    var el = document.createElement("div");
    el.className = "report-watermark";
    el.style.backgroundImage = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
    document.body.appendChild(el);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }

  function docHeight() {
    var b = document.body, d = document.documentElement;
    return Math.max(b.scrollHeight, b.offsetHeight, d.scrollHeight, d.offsetHeight);
  }

  function notify(type, value) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ __olReport: 1, type: type, value: value }, "*");
      }
    } catch (e) {}
  }

  var rafId = 0;
  function scheduleSync() {
    if (rafId) { return; }
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      resizeCharts();
      collectSections();
      notify("height", docHeight());
    });
  }

  function bindResize() {
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(scheduleSync);
      charts().forEach(function (el) { ro.observe(el); });
      ro.observe(document.body);
    }
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("load", scheduleSync);
    setTimeout(scheduleSync, 80);
    setTimeout(scheduleSync, 500);
  }

  function boot() {
    applyTheme(META.theme);
    initCharts();
    formatNumbers();
    initCounters();
    normalizeTables();
    clampTables();
    buildFooter();
    buildWatermark();
    buildQuality();
    collectSections();
    bindActiveSection();
    bindResize();
    notify("ready", 1);
    notify("height", docHeight());
  }

  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.__olReport !== 1) { return; }
    if (e.source && window.parent !== window && e.source !== window.parent) { return; }
    if (d.type === "theme") { applyTheme(d.value); scheduleSync(); }
    if (d.type === "reflow") { scheduleSync(); setTimeout(scheduleSync, 60); }
    if (d.type === "scroll-to") { scrollToSection(d.value); }
    if (d.type === "prepare-export") { prepareExport(); }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("load", function () {
    notify("ready", 1);
    scheduleSync();
  });
})();
`;

export function formatReportTime(date) {
  const d = date || new Date();
  const pad = n => (n < 10 ? "0" + n : "" + n);
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

export function buildHtmlReportDoc({ html = "", charts = {}, css = "", echartsUmd = "", options = {} } = {}) {
  const meta = {
    title: options.title || "",
    theme: options.theme === "dark" ? "dark" : "light",
    layout: options.layout || "",
    visualStyle: options.visualStyle || "",
    generatedAt: options.generatedAt || "",
    watermark: options.watermark || "",
    period: options.period || "",
    scope: options.scope || "",
    sources: Array.isArray(options.sources) ? options.sources.filter(Boolean) : [],
    warnings: Array.isArray(options.warnings) ? options.warnings.filter(Boolean) : [],
  };
  const modelCss = sanitizeCss(String(css || "").slice(0, MAX_MODEL_CSS_CHARS));
  const modelStyle = modelCss ? `<style data-ol-model-css>${modelCss}</style>` : "";
  return `<!doctype html>
<html lang="zh-CN" data-theme="${meta.theme}" data-layout="${escapeHtml(meta.layout)}" data-visual-style="${escapeHtml(meta.visualStyle)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'" />
<title>${escapeHtml(meta.title || "分析报告")}</title>
<script>${echartsUmd}</script>
<style>${REPORT_CSS}</style>
${modelStyle}
</head>
<body>
${sanitizeReportHtml(html)}
<script>window.__OL_CHARTS__ = ${safeJson(charts)};window.__OL_REPORT__ = ${safeJson(meta)};</script>
<script>${INIT_SCRIPT}</script>
</body>
</html>`;
}

export function createBlobUrl(doc) {
  return URL.createObjectURL(new Blob([doc], { type: "text/html;charset=utf-8" }));
}

export function sanitizeFileName(name) {
  return String(name || "报告").replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 60) || "报告";
}

export function downloadHtml(doc, fileName) {
  const url = createBlobUrl(doc);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFileName(fileName) + ".html";
  document.body.appendChild(a);
  a.click();
  if (a.parentNode) a.parentNode.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function openInNewWindow(doc) {
  const url = createBlobUrl(doc);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
