import { jsPDF } from "jspdf";
import { sanitizeFileName } from "./htmlReport.js";

let html2canvasUmdPromise = null;

/** 按需加载本地 html2canvas UMD 源码（导出长图时注入到导出 iframe 里执行）。 */
function loadHtml2canvasUmd() {
  if (!html2canvasUmdPromise) {
    html2canvasUmdPromise = import("html2canvas/dist/html2canvas.min.js?raw")
      .then(m => (m && m.default ? m.default : m))
      .then(src => {
        if (typeof src !== "string" || src.length < 1000) {
          throw new Error("[ol-report] 未能取到 html2canvas 源码（打包器不支持 `?raw`）");
        }
        return src;
      });
  }
  return html2canvasUmdPromise;
}

/**
 * 在一个「不加密沙箱」的隐藏同源 iframe 里打开报告文档。
 * 因为同源，父页面可以在里面执行 html2canvas / 调 print()，
 * 而展示用的 iframe 依然保持 sandbox 隔离，安全策略不变。
 */
function withPipelineFrame(doc, run, { width = 1280, timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("tabindex", "-1");
    frame.style.cssText =
      "position:fixed;left:-100000px;top:0;border:0;pointer-events:none;opacity:0;" +
      "width:" +
      width +
      "px;height:900px;";
    frame.srcdoc = doc;

    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    };

    const onMessage = e => {
      if (e.source !== frame.contentWindow) return;
      const d = e.data;
      if (!d || d.__olReport !== 1 || d.type !== "ready") return;
      start();
    };

    const start = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      // 等一帧，确保 ready 之后的自适应 resize 已经跑完
      setTimeout(() => {
        Promise.resolve()
          .then(() => run(frame.contentWindow, frame.contentDocument))
          .then(v => {
            cleanup();
            resolve(v);
          })
          .catch(err => {
            cleanup();
            reject(err);
          });
      }, 320);
    };

    window.addEventListener("message", onMessage);
    document.body.appendChild(frame);
    timer = setTimeout(start, timeout);
  });
}

export function printDoc(doc, { width = 1280 } = {}) {
  return withPipelineFrame(
    doc,
    win => {
      if (typeof win.__OL_REPORT_PREPARE_EXPORT__ === "function") {
        win.__OL_REPORT_PREPARE_EXPORT__();
      }
      win.focus();
      win.print();
    },
    { width },
  );
}

export async function renderReportImage(doc, { width = 1240, scale = 2, background = "#ffffff" } = {}) {
  const umd = await loadHtml2canvasUmd();
  return withPipelineFrame(
    doc,
    async (win, d) => {
      d.documentElement.style.width = width + "px";
      d.body.style.width = width + "px";
      const script = d.createElement("script");
      script.textContent = umd;
      d.head.appendChild(script);
      if (typeof win.html2canvas !== "function") throw new Error("html2canvas 注入失败");
      // 关键：导出不走 @media print，先展开折叠/限高，避免 PDF 少内容
      if (typeof win.__OL_REPORT_PREPARE_EXPORT__ === "function") {
        win.__OL_REPORT_PREPARE_EXPORT__();
      } else {
        d.documentElement.classList.add("is-export");
      }
      await new Promise(r => setTimeout(r, 320));
      if (d.fonts && d.fonts.ready) {
        try {
          await d.fonts.ready;
        } catch (e) {
          /* 字体加载失败不影响截图 */
        }
      }
      const full = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
      const safeScale = Math.max(1, Math.min(scale, 14000 / Math.max(1, full)));
      const canvas = await win.html2canvas(d.body, {
        backgroundColor: background,
        scale: safeScale,
        useCORS: true,
        logging: false,
        width,
        windowWidth: width,
        height: full,
        windowHeight: full,
      });
      return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
    },
    { width },
  );
}

function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  if (a.parentNode) a.parentNode.removeChild(a);
}

export async function exportReportPng(doc, fileName, options = {}) {
  const img = await renderReportImage(doc, options);
  downloadDataUrl(img.dataUrl, sanitizeFileName(fileName) + ".png");
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片解析失败"));
    img.src = src;
  });
}

/** 长图按 A4 纵向切页，避免整页缩小到看不清。 */
export async function exportReportPdf(doc, fileName, options = {}) {
  const shot = await renderReportImage(doc, options);
  const img = await loadImage(shot.dataUrl);
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;
  const drawW = contentW;
  const drawH = (img.height / img.width) * drawW;

  const pages = Math.max(1, Math.ceil(drawH / contentH));
  for (let page = 0; page < pages; page++) {
    if (page > 0) pdf.addPage();
    pdf.addImage(shot.dataUrl, "PNG", margin, margin - page * contentH, drawW, drawH);
  }
  pdf.save(sanitizeFileName(fileName) + ".pdf");
}
