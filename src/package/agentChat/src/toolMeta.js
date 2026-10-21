export const TOOL_META = {
  list_tables: { label: "浏览数据表", unit: "" },
  get_table_schema: { label: "查看表结构", unit: "张表" },
  run_sql: { label: "执行查询", unit: "次查询" },
  render_report: { label: "生成分析报表", unit: "" },
  render_html_report: { label: "生成 HTML 报告", unit: "" },
  render_chart: { label: "生成图表", unit: "" },
};

export function toolLabel(name) {
  return (TOOL_META[name] && TOOL_META[name].label) || "工具调用";
}

export function toolUnit(name) {
  return (TOOL_META[name] && TOOL_META[name].unit) || "";
}

export function buildToolDetail(name, input) {
  const args = input && typeof input === "object" ? input : {};
  if (name === "list_tables") {
    return args.keyword ? `筛选：${args.keyword}` : "全部表";
  }
  if (name === "get_table_schema") {
    return args.table || "";
  }
  if (name === "run_sql") {
    const tables = tablesFromSql(args.sql);
    return tables.length ? tables.join("、") : "";
  }
  if (name === "render_report" || name === "render_html_report" || name === "render_chart") {
    return "准备生成";
  }
  return "";
}

export function sqlPreview(sql, max) {
  const text = String(sql || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const limit = Number(max) > 0 ? Number(max) : 100;
  return text.length > limit ? text.slice(0, limit) + "…" : text;
}

export function tablesFromSql(sql) {
  const text = String(sql || "");
  const result = [];
  const seen = new Set();
  const ident = '(`[^`]+`|"[^"]+"|\\[[^\\]]+\\]|[\\w$]+)';
  const re = new RegExp(`\\b(?:from|join)\\s+${ident}(?:\\s*\\.\\s*${ident})?`, "gi");
  let match;
  while ((match = re.exec(text))) {
    const first = match[1] || "";
    const second = match[2] || "";
    const table = (second ? first + "." + second : first)
      .replace(/[`"\[\]]/g, "")
      .replace(/\s*\.\s*/g, ".")
      .trim();
    if (!table || seen.has(table)) continue;
    seen.add(table);
    result.push(table);
  }
  return result;
}
