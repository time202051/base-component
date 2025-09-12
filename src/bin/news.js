#!/usr/bin/env node
/**
 * 获取美联储相关新闻列表（优先官方RSS，失败则回退GDELT）
 * 用法:
 *   node src/bin/fetchFedNews.js --limit=20 --json
 *   node src/bin/fetchFedNews.js --since=2024-01-01
 *
 * 选项:
 *   --limit   数量上限，默认 20
 *   --json    以 JSON 输出，否则打印为简洁文本
 *   --since   仅保留不早于该日期的新闻（YYYY-MM-DD）
 */

const { URL } = require("url");
const LIMIT = Number((process.argv.find(a => a.startsWith("--limit=")) || "").split("=")[1]) || 20;
const AS_JSON = process.argv.includes("--json");
const SINCE = (process.argv.find(a => a.startsWith("--since=")) || "").split("=")[1] || "";
const sinceDate = SINCE ? new Date(SINCE) : null;

const FEEDS = [
  { name: "Fed Press Monetary", url: "https://www.federalreserve.gov/feeds/press_monetary.xml", type: "rss" },
  { name: "Fed Speeches", url: "https://www.federalreserve.gov/feeds/speeches.xml", type: "rss" },
  { name: "NY Fed What's New", url: "https://www.newyorkfed.org/rss/feeds/whatsnew.xml", type: "rss" },
];

const GDELT = {
  name: "GDELT Docs",
  url: "https://api.gdeltproject.org/api/v2/doc/doc?query=Federal%20Reserve%20OR%20FOMC%20OR%20Powell&mode=ArtList&maxrecords=50&format=json",
  type: "json",
};

async function safeImportFastXmlParser() {
  try {
    // 优先使用项目中已安装的 fast-xml-parser
    const mod = require("fast-xml-parser");
    const XMLParser = mod.XMLParser || mod;
    return XMLParser;
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function fetchJSON(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

function toDate(d) {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime()) ? null : t;
}

function normalizeRssItem(it, sourceName) {
  // 不同RSS字段命名差异处理
  const link = it.link?.href || it.link || it.guid || "";
  const pubDate = it.pubDate || it.published || it.updated || it["dc:date"] || it["atom:updated"] || "";
  const desc = it.description || it.summary || it.content || "";
  return {
    source: sourceName,
    title: String(it.title || "").trim(),
    link: typeof link === "string" ? link : "",
    publishedAt: toDate(pubDate)?.toISOString() || null,
    description: typeof desc === "string" ? desc.replace(/<[^>]+>/g, "").trim() : "",
  };
}

function normalizeGdeltItem(it) {
  return {
    source: "GDELT",
    title: String(it.title || "").trim(),
    link: it.url || "",
    publishedAt: toDate(it.seendate || it.publishtime || it.datetime)?.toISOString() || null,
    description: String(it.excerpt || it.subtitle || "").trim(),
  };
}

function filterAndSort(items) {
  let arr = items.filter(x => x && x.title && x.link);
  if (sinceDate) {
    arr = arr.filter(x => {
      const t = x.publishedAt ? new Date(x.publishedAt) : null;
      return t && t >= sinceDate;
    });
  }
  arr.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
  return arr.slice(0, LIMIT);
}

async function tryFetchRss(XMLParser) {
  const results = [];
  for (const feed of FEEDS) {
    try {
      const xml = await fetchText(feed.url);
      if (!XMLParser) throw new Error("fast-xml-parser 未安装");
      const parser = new XMLParser({ ignoreAttributes: false });
      const data = parser.parse(xml);
      let items = [];

      // 兼容 RSS 2.0 / Atom
      if (data?.rss?.channel?.item) {
        items = Array.isArray(data.rss.channel.item) ? data.rss.channel.item : [data.rss.channel.item];
      } else if (data?.feed?.entry) {
        items = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
      }

      for (const it of items) {
        results.push(normalizeRssItem(it, feed.name));
      }
    } catch (e) {
      // 单个源失败不影响总体，继续其他源
      // console.warn(`[WARN] RSS源失败: ${feed.name} - ${e.message}`);
    }
  }
  return results;
}

async function fallbackGdelt() {
  try {
    const data = await fetchJSON(GDELT.url);
    const list = data?.articles || data?.documents || data?.matches || [];
    return list.map(normalizeGdeltItem);
  } catch {
    return [];
  }
}

function print(items) {
  if (AS_JSON) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }
  for (const it of items) {
    const time = it.publishedAt ? new Date(it.publishedAt).toISOString().replace("T", " ").slice(0, 19) : "";
    console.log(`- [${it.source}] ${time}`);
    console.log(`  ${it.title}`);
    if (it.link) console.log(`  ${it.link}`);
    console.log("");
  }
}

(async function main() {
  try {
    const XMLParser = await safeImportFastXmlParser();
    let items = [];
    if (XMLParser) {
      items = await tryFetchRss(XMLParser);
    }
    // 若RSS拿不到，回退到GDELT
    if (!items.length) {
      const gd = await fallbackGdelt();
      items = gd;
    }
    items = filterAndSort(items);
    print(items);
  } catch (e) {
    console.error("获取新闻失败：", e.message);
    process.exit(1);
  }
})();