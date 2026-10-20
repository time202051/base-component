import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getInstanceByDom } from "echarts/core";
import { CHART_THEME, resolveTheme } from "./theme.js";

const EXPORT_WIDTHS = { 1: 760, 2: 1000, 3: 1280 };
const H_PADDING = 24;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFileName(name) {
  return String(name || "分析报表")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim()
    .slice(0, 60);
}

function replaceCanvasesWithImages(root, images) {
  const nodes = root.querySelectorAll(".ac-chart__canvas");
  nodes.forEach((node, i) => {
    const src = images[i];
    if (!src) return;
    const canvas = node.querySelector("canvas");
    const img = document.createElement("img");
    img.src = src;
    img.style.display = "block";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "fill";
    if (canvas && canvas.parentNode) canvas.parentNode.replaceChild(img, canvas);
    else node.appendChild(img);
  });
}

/**
 * 导出报表为 PNG / PDF。
 * 做法：让图表按导出宽度重绘取高清图 → 克隆报表并替换图表为图片 →
 * 离屏按导出宽度渲染 → html2canvas 截图。屏幕与导出复用同一主题。
 */
export async function exportReport(el, options = {}) {
  if (!el) return;
  const format = options.format === "pdf" ? "pdf" : "png";
  const resolved = resolveTheme(options.theme);
  const bg = (CHART_THEME[resolved] || CHART_THEME.light).surface;
  const cols = options.cols || 1;
  const exportWidth = options.width || EXPORT_WIDTHS[cols] || 1280;
  const fileName = sanitizeFileName(options.fileName);

  // 与 DOM 顺序一一对应，避免某个图表未初始化导致图片错位
  const chartNodes = Array.from(el.querySelectorAll(".ac-chart__canvas"));
  const entries = chartNodes.map(node => {
    const chart = getInstanceByDom(node);
    return {
      chart,
      original: chart ? { width: chart.getWidth(), height: chart.getHeight() } : null,
    };
  });

  const scale = Math.max(1, (exportWidth - H_PADDING) / Math.max(1, el.clientWidth - H_PADDING));
  entries.forEach(entry => {
    if (!entry.chart || !entry.original) return;
    try {
      entry.chart.resize({
        width: Math.round(entry.original.width * scale),
        height: entry.original.height,
      });
    } catch {
      /* ignore */
    }
  });
  await wait(80);

  const images = entries.map(entry => {
    if (!entry.chart) return "";
    try {
      return entry.chart.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: bg });
    } catch {
      return "";
    }
  });

  entries.forEach(entry => {
    if (!entry.chart || !entry.original) return;
    try {
      entry.chart.resize(entry.original);
    } catch {
      /* ignore */
    }
  });

  const clone = el.cloneNode(true);
  replaceCanvasesWithImages(clone, images);
  clone.style.width = exportWidth + "px";
  clone.style.maxWidth = "none";
  clone.style.position = "fixed";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.zIndex = "-1";
  clone.style.pointerEvents = "none";
  document.body.appendChild(clone);
  await wait(80);

  let canvas;
  try {
    canvas = await html2canvas(clone, {
      backgroundColor: bg,
      scale: 2,
      useCORS: true,
      logging: false,
      width: exportWidth,
      windowWidth: exportWidth,
    });
  } finally {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
  }

  if (format === "pdf") {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = canvas.width / 2;
    const imgH = canvas.height / 2;
    const ratio = Math.min((pageW - 32) / imgW, (pageH - 32) / imgH);
    const w = imgW * ratio;
    const h = imgH * ratio;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageW - w) / 2, 16, w, h);
    pdf.save(fileName + ".pdf");
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = fileName + ".png";
  document.body.appendChild(link);
  link.click();
  if (link.parentNode) link.parentNode.removeChild(link);
}
