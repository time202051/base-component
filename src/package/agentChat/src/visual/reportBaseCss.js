/**
 * 报告设计系统 CSS（注入到 HTML 报告的 iframe 内），作为基础套件。
 * 模型可以在 css 字段里写差异化样式，注入位置在本文件之后，因此同优先级下会覆盖这里。
 * 推荐模型优先覆盖下面的 CSS 变量，而不是重写整套样式。
 */
export const REPORT_CSS = `
:root{
  --rp-bg:#f5f7fb; --rp-surface:#fff; --rp-surface-2:#f7f9fc; --rp-border:#e8edf5;
  --rp-t1:#1f2937; --rp-t2:#64748b; --rp-t3:#94a3b8;
  --rp-primary:#4f7cff; --rp-primary-2:#6aa1ff;
  --rp-success:#16a34a; --rp-danger:#ef4444; --rp-warning:#f59e0b;
  --rp-radius:14px; --rp-radius-sm:10px; --rp-gap:14px;
  --rp-shadow:0 1px 2px rgba(16,24,40,.04),0 10px 28px rgba(16,24,40,.06);
  --rp-num:"DIN Alternate","SF Mono","Roboto Mono",Consolas,monospace;
  --rp-font:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  --rp-font-heading:var(--rp-font);
  --rp-content-width:1180px;
}
/* ===== 暗色主题 ===== */
html[data-theme="dark"]{
  --rp-bg:#0f1622; --rp-surface:#161f2e; --rp-surface-2:#1e2938; --rp-border:#2a3648;
  --rp-t1:#e8eef7; --rp-t2:#9db0c8; --rp-t3:#6b7f99;
  --rp-primary:#5b86ff; --rp-primary-2:#83a8ff;
  --rp-success:#34d399; --rp-danger:#f87171; --rp-warning:#fbbf24;
  --rp-shadow:0 1px 2px rgba(0,0,0,.32),0 10px 28px rgba(0,0,0,.38);
}
html[data-theme="dark"] .stat{background:linear-gradient(180deg,var(--rp-surface),#18222f)}
html[data-theme="dark"] thead th{background:#1b2534}
html[data-theme="dark"] tbody tr:nth-child(even) td{background:rgba(255,255,255,.028)}
html[data-theme="dark"] .notice.is-warning{color:#fcd34d;background:rgba(245,158,11,.16)}
html[data-theme="dark"] .notice.is-danger{color:#fca5a5;background:rgba(239,68,68,.16)}
html[data-theme="dark"] .notice.is-success{color:#6ee7b7;background:rgba(22,163,74,.16)}
html[data-theme="dark"] .notice.is-info{color:#93b4ff;background:rgba(79,124,255,.16)}
html[data-theme="dark"] .badge.is-success{color:#6ee7b7;background:rgba(22,163,74,.2);border-color:rgba(52,211,153,.28)}
html[data-theme="dark"] .badge.is-warning{color:#fcd34d;background:rgba(245,158,11,.2);border-color:rgba(251,191,36,.28)}
html[data-theme="dark"] .badge.is-danger{color:#fca5a5;background:rgba(239,68,68,.2);border-color:rgba(248,113,113,.28)}
html[data-theme="dark"] .badge.is-info{color:#93b4ff;background:rgba(79,124,255,.2);border-color:rgba(91,134,255,.28)}
html[data-theme="dark"] .risk-item.is-success,html[data-theme="dark"] .risk-item.is-danger,html[data-theme="dark"] .risk-item.is-warning,html[data-theme="dark"] .risk-item.is-info{background:rgba(255,255,255,.03)}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:var(--rp-font);
  font-size:13px;line-height:1.6;color:var(--rp-t1);background:var(--rp-bg);padding:20px 22px 40px;
}
.report{max-width:var(--rp-content-width);margin:0 auto}
h1,h2,h3{margin:0;font-weight:700;color:var(--rp-t1);font-family:var(--rp-font-heading)}
a{color:var(--rp-primary)}
img{max-width:100%}
.report-header{margin-bottom:16px}
.report-title{font-size:22px;letter-spacing:-.01em}
.report-sub{margin-top:4px;font-size:12px;color:var(--rp-t2)}
.report-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.meta-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:var(--rp-surface);border:1px solid var(--rp-border);font-size:11.5px;color:var(--rp-t2)}
.section{margin-top:22px}
.section-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.section-no{width:28px;max-width:56px;height:28px;flex:0 0 auto;overflow:hidden;white-space:nowrap;text-overflow:clip;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(135deg,var(--rp-primary),var(--rp-primary-2));box-shadow:0 4px 10px rgba(79,124,255,.3)}
.section-title{font-size:16px;font-weight:700;line-height:1.25}
.section-sub{margin-top:1px;font-size:11px;color:var(--rp-t3)}
.card{background:var(--rp-surface);border:1px solid var(--rp-border);border-radius:var(--rp-radius);box-shadow:var(--rp-shadow);padding:14px 16px;margin-top:var(--rp-gap)}
.card-title{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;margin-bottom:10px}
.card-title::before{content:"";width:3px;height:13px;border-radius:2px;background:linear-gradient(180deg,var(--rp-primary),var(--rp-primary-2))}
.card-sub{font-size:11px;font-weight:400;color:var(--rp-t3)}
.grid{display:grid;gap:var(--rp-gap);margin-top:var(--rp-gap)}
.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-3{grid-template-columns:repeat(3,minmax(0,1fr))}
@media(max-width:820px){.grid-2,.grid-3{grid-template-columns:1fr}}
.callout{position:relative;background:var(--rp-surface);border:1px solid var(--rp-border);border-left:3px solid var(--rp-primary);border-radius:var(--rp-radius-sm);padding:12px 14px 12px 16px;margin-top:var(--rp-gap)}
.callout-title{font-size:12px;font-weight:600;color:var(--rp-t2);margin-bottom:6px}
.callout p{margin:0;font-size:12.5px;line-height:1.8}
.notice{display:flex;gap:8px;align-items:flex-start;padding:9px 12px;border-radius:10px;font-size:12px;margin-top:var(--rp-gap)}
.notice.is-warning{color:var(--rp-warning);background:rgba(245,158,11,.12)}
.notice.is-danger{color:var(--rp-danger);background:rgba(239,68,68,.12)}
.notice.is-success{color:var(--rp-success);background:rgba(22,163,74,.12)}
.notice.is-info{color:var(--rp-primary);background:rgba(79,124,255,.1)}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:var(--rp-gap)}
.kpi{position:relative;overflow:hidden;background:var(--rp-surface);border:1px solid var(--rp-border);border-radius:var(--rp-radius-sm);padding:14px}
.kpi::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--rp-primary);opacity:.85}
.kpi-label{font-size:12px;color:var(--rp-t2)}
.kpi-value{font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:28px;font-weight:700;line-height:1.12;letter-spacing:-.03em;margin-top:3px}
.kpi-unit{font-size:12px;font-weight:500;color:var(--rp-t2);margin-left:2px}
.kpi-delta{display:inline-flex;align-items:center;gap:3px;margin-top:5px;font-size:11.5px}
.kpi-delta.up{color:var(--rp-success)}
.kpi-delta.down{color:var(--rp-danger)}
.kpi-note{margin-top:7px;padding-top:6px;border-top:1px dashed var(--rp-border);font-size:11px;color:var(--rp-t3);font-weight:400}
.bar-row{display:grid;grid-template-columns:74px 1fr auto;align-items:center;gap:10px;margin:9px 0}
.bar-label{font-size:12px;color:var(--rp-t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bar-track{height:9px;border-radius:999px;background:var(--rp-surface-2);overflow:hidden}
.bar-fill{height:100%;border-radius:999px;background:var(--rp-primary)}
.bar-value{font-family:var(--rp-num);font-size:12.5px;font-weight:600;min-width:52px;text-align:right}
.progress-row{margin:11px 0}
.progress-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;font-size:12.5px;color:var(--rp-t2)}
.progress-top b{font-family:var(--rp-num);font-size:15px;color:var(--rp-t1)}
.progress-track{height:8px;border-radius:999px;background:var(--rp-surface-2);overflow:hidden}
.progress-fill{height:100%;border-radius:999px;background:var(--rp-primary)}
.progress-status{margin-top:4px;font-size:11px;color:var(--rp-t3)}
.chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-top:var(--rp-gap)}
.chip{padding:10px 12px;border-radius:10px;background:var(--rp-surface);border:1px solid var(--rp-border)}
.chip-value{font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:19px;font-weight:700;line-height:1.2}
.chip-value small{font-size:11px;font-weight:500;margin-left:2px;color:var(--rp-t3)}
.chip-label{margin-top:2px;font-size:11px;color:var(--rp-t2)}
.chip-delta{font-size:11px;margin-top:3px}
.chip-delta.up{color:var(--rp-success)}
.chip-delta.down{color:var(--rp-danger)}
.dist-bar{display:flex;height:24px;border-radius:9px;overflow:hidden;background:var(--rp-surface-2);margin-top:4px}
.dist-seg{display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600;min-width:0}
.dist-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:10px}
.dist-legend span{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--rp-t2)}
.dist-legend i{width:8px;height:8px;border-radius:2px;font-style:normal}
.dist-legend b{color:var(--rp-t1)}
table{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--rp-surface);border-radius:var(--rp-radius-sm);overflow:hidden;margin-top:var(--rp-gap);table-layout:auto}
.table-wrap,.card table{margin-top:0}
.table-wrap{overflow-x:auto}
th{padding:9px 12px;text-align:right;font-weight:600;color:var(--rp-t2);background:var(--rp-surface-2);border-bottom:1px solid var(--rp-border);white-space:nowrap;vertical-align:middle}
td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--rp-border);color:var(--rp-t1);vertical-align:middle}
tbody tr:nth-child(even) td{background:var(--rp-surface-2)}
th:first-child,td:first-child{text-align:left}
th.txt,td.txt{text-align:left}
th.num,td.num{font-family:var(--rp-num);font-variant-numeric:tabular-nums;white-space:nowrap}
th:last-child,td:last-child{padding-right:14px}
tr:last-child td{border-bottom:none}
.risk-list{display:flex;flex-direction:column;gap:8px;margin-top:var(--rp-gap)}
.risk-item{padding:10px 12px;border-radius:10px;border-left:3px solid var(--rp-t3);background:var(--rp-surface-2)}
.risk-title{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;font-weight:600}
.risk-text{margin-top:3px;font-size:12px;color:var(--rp-t2);line-height:1.65}
.risk-impact{margin-top:4px;font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:11px;font-weight:600;color:#b45309}
.risk-action{margin-top:3px;font-size:11.5px;color:var(--rp-t2)}
.risk-action::before{content:"→ ";color:var(--rp-primary);font-weight:700}
.risk-item.is-danger{border-left-color:var(--rp-danger);background:rgba(239,68,68,.07)}
.risk-item.is-warning{border-left-color:var(--rp-warning);background:rgba(245,158,11,.08)}
.risk-item.is-success{border-left-color:var(--rp-success);background:rgba(22,163,74,.07)}
.risk-item.is-info{border-left-color:var(--rp-primary);background:rgba(79,124,255,.06)}
.tag{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;background:var(--rp-surface-2);border:1px solid var(--rp-border);color:var(--rp-t2)}
/* ===== 数字通用 ===== */
.num{font-family:var(--rp-num);font-variant-numeric:tabular-nums}
.muted{color:var(--rp-t3)}
.unit{font-weight:600;color:var(--rp-t2)}
.delta{display:inline-flex;align-items:center;gap:3px;font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:11.5px;font-weight:700}
.delta.up{color:var(--rp-success)}
.delta.down{color:var(--rp-danger)}
.delta.flat{color:var(--rp-t3)}
/* ===== 状态徽章 .badge ===== */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;line-height:1.5;white-space:nowrap;color:var(--rp-t2);background:var(--rp-surface-2);border:1px solid var(--rp-border)}
.badge.is-success{color:#15803d;background:rgba(22,163,74,.12);border-color:rgba(22,163,74,.24)}
.badge.is-warning{color:#b45309;background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.28)}
.badge.is-danger{color:#dc2626;background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.24)}
.badge.is-info{color:var(--rp-primary);background:rgba(79,124,255,.12);border-color:rgba(79,124,255,.24)}
/* ===== 英雄数字卡 .stat ===== */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(184px,1fr));gap:12px;margin-top:var(--rp-gap)}
.stat{position:relative;overflow:hidden;background:linear-gradient(180deg,#fff,#fbfcff);border:1px solid var(--rp-border);border-radius:var(--rp-radius);box-shadow:var(--rp-shadow);padding:15px 18px}
.stat::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--rp-primary),var(--rp-primary-2))}
.stat.is-success::before{background:linear-gradient(180deg,#34d399,var(--rp-success))}
.stat.is-warning::before{background:linear-gradient(180deg,#fbbf24,var(--rp-warning))}
.stat.is-danger::before{background:linear-gradient(180deg,#fb7185,var(--rp-danger))}
.stat-label{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px;color:var(--rp-t2)}
.stat-value{font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:34px;font-weight:800;line-height:1.08;letter-spacing:-.035em;margin-top:5px}
.stat-value .unit{font-size:13px;margin-left:3px}
.stat-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.stat-note{margin-top:8px;padding-top:7px;border-top:1px dashed var(--rp-border);font-size:11px;color:var(--rp-t3)}
.stat-target{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:11px;color:var(--rp-t3)}
.stat-target span{white-space:nowrap}
.stat-track{position:relative;height:6px;border-radius:999px;background:var(--rp-surface-2);overflow:hidden;margin-top:8px}
.stat-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--rp-primary),var(--rp-primary-2))}
.stat-track i.is-warning{background:linear-gradient(90deg,#fbbf24,var(--rp-warning))}
.stat-track i.is-danger{background:linear-gradient(90deg,#fb7185,var(--rp-danger))}
/* ===== 迷你趋势 .spark ===== */
.spark{display:flex;align-items:flex-end;gap:2px;height:26px;margin-top:9px}
.spark i{flex:1;min-width:2px;border-radius:2px 2px 0 0;background:rgba(79,124,255,.32)}
.spark i.is-hi{background:rgba(79,124,255,.62)}
.spark i.is-last{background:var(--rp-primary)}
/* ===== 同比/环比对比 .compare ===== */
.compare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(176px,1fr));gap:12px;margin-top:var(--rp-gap)}
.compare{background:var(--rp-surface);border:1px solid var(--rp-border);border-radius:var(--rp-radius);box-shadow:var(--rp-shadow);padding:15px 16px}
.compare-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--rp-t2)}
.compare-now{font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:26px;font-weight:800;letter-spacing:-.03em;line-height:1.14;margin-top:6px}
.compare-now .unit{font-size:12px;margin-left:2px}
.compare-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding-top:7px;border-top:1px dashed var(--rp-border);font-size:11px;color:var(--rp-t3)}
.compare-prev{font-family:var(--rp-num);font-variant-numeric:tabular-nums;color:var(--rp-t2)}
/* ===== 达成率环 .ring ===== */
.ring-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:var(--rp-gap)}
.ring{display:flex;flex-direction:column;align-items:center;gap:9px;background:var(--rp-surface);border:1px solid var(--rp-border);border-radius:var(--rp-radius);box-shadow:var(--rp-shadow);padding:16px 14px}
.ring-dial{position:relative;width:98px;height:98px;border-radius:50%;background:conic-gradient(var(--rp-primary) calc(var(--v,0) * 1%),var(--rp-surface-2) 0)}
.ring-dial::before{content:"";position:absolute;inset:9px;border-radius:50%;background:var(--rp-surface)}
.ring-center{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring-value{font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:22px;font-weight:800;letter-spacing:-.03em;line-height:1.1}
.ring-unit{font-size:10px;font-weight:600;color:var(--rp-t3)}
.ring-label{font-size:12px;color:var(--rp-t2);text-align:center;line-height:1.4}
.ring.is-success .ring-dial{background:conic-gradient(var(--rp-success) calc(var(--v,0) * 1%),var(--rp-surface-2) 0)}
.ring.is-warning .ring-dial{background:conic-gradient(var(--rp-warning) calc(var(--v,0) * 1%),var(--rp-surface-2) 0)}
.ring.is-danger .ring-dial{background:conic-gradient(var(--rp-danger) calc(var(--v,0) * 1%),var(--rp-surface-2) 0)}
/* ===== 排行榜 .rank-list ===== */
.rank-list{display:flex;flex-direction:column;gap:6px;margin-top:var(--rp-gap)}
.rank-row{display:flex;align-items:center;gap:10px;padding:7px 11px;border-radius:10px;background:var(--rp-surface);border:1px solid var(--rp-border)}
.rank-no{flex:0 0 22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:var(--rp-num);font-size:12px;font-weight:700;color:var(--rp-t2);background:var(--rp-surface-2)}
.rank-row:nth-child(1) .rank-no{color:#7c5300;background:linear-gradient(135deg,#ffe9a8,#f3bf45)}
.rank-row:nth-child(2) .rank-no{color:#55606f;background:linear-gradient(135deg,#eef1f6,#ccd4e0)}
.rank-row:nth-child(3) .rank-no{color:#8a4b1f;background:linear-gradient(135deg,#ffdec2,#e5a271)}
.rank-name{flex:0 0 106px;font-size:12.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rank-bar{flex:1;min-width:36px;height:8px;border-radius:999px;background:var(--rp-surface-2);overflow:hidden}
.rank-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--rp-primary),var(--rp-primary-2))}
.rank-value{flex:0 0 auto;min-width:64px;text-align:right;font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:13px;font-weight:700}
.rank-value small{font-size:11px;font-weight:500;color:var(--rp-t3);margin-left:1px}
.rank-share{flex:0 0 50px;text-align:right;font-family:var(--rp-num);font-size:11.5px;color:var(--rp-t2)}
.rank-delta{flex:0 0 46px;text-align:right;font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:11px;font-weight:600;color:var(--rp-t3)}
.rank-delta.up{color:var(--rp-success)}
.rank-delta.down{color:var(--rp-danger)}
.rank-cum{flex:0 0 62px;text-align:right;font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:11px;color:var(--rp-t3)}
/* ===== 报告叙事元素（模型可自由覆盖） ===== */
.report-cover{position:relative;overflow:hidden;margin-top:var(--rp-gap);padding:26px 28px;border:1px solid var(--rp-border);border-radius:var(--rp-radius);background:linear-gradient(135deg,var(--rp-surface),var(--rp-surface-2));box-shadow:var(--rp-shadow)}
.report-cover::after{content:"";position:absolute;right:-60px;top:-70px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(79,124,255,.22),transparent 68%);pointer-events:none}
.cover-kicker{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rp-primary)}
.cover-title{margin-top:8px;font-family:var(--rp-font-heading);font-size:34px;line-height:1.16;letter-spacing:-.02em}
.cover-sub{margin-top:7px;font-size:12.5px;color:var(--rp-t2)}
.cover-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.cover-metric{margin-top:16px;padding-top:12px;border-top:1px dashed var(--rp-border);font-family:var(--rp-num);font-size:20px;font-weight:800;color:var(--rp-primary)}
.section-divider{display:flex;align-items:center;gap:14px;margin:26px 0 14px;padding:16px 18px;border-left:4px solid var(--rp-primary);border-radius:0 var(--rp-radius-sm) var(--rp-radius-sm) 0;background:linear-gradient(90deg,rgba(79,124,255,.12),transparent 78%)}
.section-divider__no{font-family:var(--rp-num);font-size:34px;font-weight:800;line-height:1;color:var(--rp-primary);opacity:.55}
.section-divider__title{font-size:18px;font-weight:800;letter-spacing:-.01em}
.section-divider__text{margin-top:2px;font-size:12px;color:var(--rp-t2)}
.finding-list{display:flex;flex-direction:column;gap:9px;margin-top:var(--rp-gap)}
.finding{display:flex;gap:12px;padding:12px 14px;border:1px solid var(--rp-border);border-radius:var(--rp-radius-sm);background:var(--rp-surface)}
.finding-no{flex:0 0 30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:linear-gradient(135deg,var(--rp-primary),var(--rp-primary-2));color:#fff;font-family:var(--rp-num);font-size:12px;font-weight:800}
.finding-body{min-width:0}
.finding-title{font-size:13.5px;font-weight:700}
.finding-text{margin-top:3px;font-size:12.5px;line-height:1.7;color:var(--rp-t2)}
.finding-impact{margin-top:5px;font-size:11.5px;font-weight:700;color:var(--rp-warning)}
.so-what{display:flex;gap:10px;margin-top:10px;padding:10px 12px;border-left:3px solid var(--rp-primary);border-radius:8px;background:rgba(79,124,255,.06);font-size:12.5px;line-height:1.7}
.so-what__label{flex:0 0 auto;font-weight:800;color:var(--rp-primary)}
.so-what p{margin:0}
.pull-quote{margin:22px 0;padding:18px 22px;border-left:4px solid var(--rp-primary);border-radius:0 var(--rp-radius) var(--rp-radius) 0;background:var(--rp-surface-2)}
.pull-quote__text{margin:0;font-family:var(--rp-font-heading);font-size:20px;font-weight:600;line-height:1.6;letter-spacing:-.01em}
.pull-quote__by{margin-top:9px;text-align:right;font-size:11.5px;color:var(--rp-t3)}
.timeline{position:relative;margin-top:var(--rp-gap);padding-left:24px}
.timeline::before{content:"";position:absolute;left:7px;top:5px;bottom:5px;width:2px;background:var(--rp-border)}
.timeline-item{position:relative;margin-bottom:16px}
.timeline-item::before{content:"";position:absolute;left:-22px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--rp-primary);box-shadow:0 0 0 3px var(--rp-surface)}
.timeline-date{margin-bottom:4px;font-family:var(--rp-num);font-size:11px;font-weight:800;color:var(--rp-primary)}
.timeline-card{padding:10px 12px;border:1px solid var(--rp-border);border-radius:10px;background:var(--rp-surface)}
.timeline-card b{font-size:12.5px}
.timeline-card p{margin:3px 0 0;font-size:12px;line-height:1.65;color:var(--rp-t2)}
.action-list{display:flex;flex-direction:column;gap:8px;margin-top:var(--rp-gap)}
.action-item{display:grid;grid-template-columns:auto 1fr;gap:7px 10px;padding:10px 12px;border:1px solid var(--rp-border);border-radius:10px;background:var(--rp-surface)}
.action-priority{align-self:start;padding:1px 8px;border-radius:999px;font-size:10.5px;font-weight:800;line-height:1.7;color:#fff;background:var(--rp-t3)}
.action-priority.is-high{background:var(--rp-danger)}
.action-priority.is-mid{background:var(--rp-warning)}
.action-priority.is-low{background:var(--rp-success)}
.action-title{font-size:12.5px;font-weight:700}
.action-meta{grid-column:2;display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:var(--rp-t3)}
.action-status{color:var(--rp-primary);font-weight:700}
.risk-matrix{display:grid;grid-template-columns:26px repeat(3,minmax(0,1fr));grid-auto-rows:minmax(48px,auto);gap:6px;margin-top:var(--rp-gap)}
.risk-matrix__axis{display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--rp-t3)}
.risk-matrix__axis--y{grid-row:1 / span 3;writing-mode:vertical-rl;letter-spacing:.12em}
.risk-matrix__axis--x{grid-column:2 / -1}
.risk-cell{min-height:52px;padding:6px;border:1px dashed var(--rp-border);border-radius:8px;background:var(--rp-surface);font-size:11px}
.risk-cell.is-high{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.28)}
.risk-cell.is-mid{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.28)}
.risk-dot{display:inline-flex;align-items:center;padding:1px 6px;margin:2px 2px 0 0;border-radius:999px;font-size:10.5px;font-weight:700;color:#fff;background:var(--rp-primary)}
.risk-dot.is-danger{background:var(--rp-danger)}
.risk-dot.is-warning{background:var(--rp-warning)}
.risk-dot.is-success{background:var(--rp-success)}
.report-appendix{margin-top:28px;padding-top:14px;border-top:1px dashed var(--rp-border);font-size:12px;color:var(--rp-t2)}
.appendix-title{margin-bottom:8px;font-size:14px;font-weight:800;color:var(--rp-t1)}
.method-list{display:flex;flex-direction:column;gap:4px}
.method-list b{color:var(--rp-t1)}
.glossary{margin-top:10px}
.glossary-row{display:flex;gap:10px;padding:3px 0}
.glossary-row b{flex:0 0 92px;color:var(--rp-t1)}
.hero-kpi{position:relative;overflow:hidden;margin-top:var(--rp-gap);padding:20px 22px;border:1px solid var(--rp-border);border-radius:var(--rp-radius);background:linear-gradient(135deg,var(--rp-surface),var(--rp-surface-2));box-shadow:var(--rp-shadow)}
.hero-kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,var(--rp-primary),var(--rp-primary-2))}
.hero-kpi__label{font-size:12px;font-weight:600;color:var(--rp-t2)}
.hero-kpi__value{margin-top:4px;font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:52px;font-weight:800;line-height:1.02;letter-spacing:-.045em}
.hero-kpi__value .unit{font-size:14px;margin-left:4px}
.hero-kpi__target{margin-top:5px;font-size:11.5px;color:var(--rp-t3)}
.hero-kpi__spark{display:flex;align-items:flex-end;gap:2px;height:34px;margin-top:10px}
.hero-kpi__spark i{flex:1;min-width:2px;border-radius:2px 2px 0 0;background:rgba(79,124,255,.35)}
.hero-kpi__spark i:last-child{background:var(--rp-primary)}
.bullet-row{display:grid;grid-template-columns:104px 1fr auto;align-items:center;gap:10px;margin:9px 0}
.bullet-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--rp-t2)}
.bullet-track{position:relative;height:10px;border-radius:999px;background:var(--rp-surface-2)}
.bullet-range{position:absolute;left:0;right:22%;top:0;bottom:0;border-radius:999px;background:rgba(79,124,255,.16)}
.bullet-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--rp-primary),var(--rp-primary-2))}
.bullet-target{position:absolute;top:-3px;bottom:-3px;width:2px;border-radius:2px;background:var(--rp-t1)}
.bullet-value{min-width:52px;text-align:right;font-family:var(--rp-num);font-size:12.5px;font-weight:700}
.small-multiples{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:var(--rp-gap)}
.mini-chart{padding:10px;border:1px solid var(--rp-border);border-radius:10px;background:var(--rp-surface)}
.mini-chart__title{margin-bottom:6px;font-size:12px;font-weight:700;color:var(--rp-t2)}
.heat-table td{text-align:center;font-family:var(--rp-num);font-variant-numeric:tabular-nums}
.heat-table td.heat-4,.heat-table td.heat-5{font-weight:700}
.heat-1{background:rgba(79,124,255,.06)}
.heat-2{background:rgba(79,124,255,.14)}
.heat-3{background:rgba(79,124,255,.24)}
.heat-4{background:rgba(79,124,255,.36)}
.heat-5{background:rgba(79,124,255,.52);color:#fff}
.top-bottom{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:var(--rp-gap)}
.top-bottom__col{padding:12px;border:1px solid var(--rp-border);border-radius:var(--rp-radius-sm);background:var(--rp-surface)}
.top-bottom__title{margin-bottom:8px;font-size:12.5px;font-weight:800}
.top-bottom__col.is-up .top-bottom__title{color:var(--rp-success)}
.top-bottom__col.is-down .top-bottom__title{color:var(--rp-danger)}
.comparison-matrix{margin-top:var(--rp-gap);border:1px solid var(--rp-border);border-radius:var(--rp-radius-sm);overflow:hidden;background:var(--rp-surface);font-size:12px}
.matrix-head,.matrix-row{display:flex}
.matrix-head{font-weight:700;color:var(--rp-t2);background:var(--rp-surface-2)}
.matrix-head>span,.matrix-row>span{flex:1;min-width:0;padding:8px 10px;border-bottom:1px solid var(--rp-border);text-align:center}
.matrix-head>span:first-child,.matrix-row>span:first-child{flex:1.4;text-align:left;font-weight:600}
.matrix-row:nth-child(even)>span{background:var(--rp-surface-2)}
.matrix-row:last-child>span{border-bottom:none}
.matrix-cell.is-good{color:var(--rp-success);font-weight:700;background:rgba(22,163,74,.07)}
.matrix-cell.is-bad{color:var(--rp-danger);font-weight:700;background:rgba(239,68,68,.07)}
.matrix-cell.is-warn{color:var(--rp-warning);font-weight:700;background:rgba(245,158,11,.08)}
.annotation{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:11.5px;color:var(--rp-t2)}
.annotation__dot{flex:0 0 7px;width:7px;height:7px;border-radius:50%;background:var(--rp-primary)}
.margin-note{float:right;width:180px;margin:0 0 10px 14px;padding:8px 10px;border-left:2px solid var(--rp-border);font-size:11.5px;line-height:1.6;color:var(--rp-t3)}
.full-bleed{margin:22px calc(50% - 50vw);padding:18px max(22px,calc(50vw - 50% + 22px));background:linear-gradient(90deg,rgba(79,124,255,.10),rgba(34,193,195,.08));border-top:1px solid var(--rp-border);border-bottom:1px solid var(--rp-border)}
.drop-cap::first-letter{float:left;padding:2px 7px 0 0;font-family:var(--rp-font-heading);font-size:46px;font-weight:800;line-height:.9;color:var(--rp-primary)}
.hero-number{font-family:var(--rp-num);font-variant-numeric:tabular-nums;font-size:56px;font-weight:800;line-height:1;letter-spacing:-.04em;color:var(--rp-primary)}
.section-progress{display:flex;align-items:center;gap:4px;margin:8px 0}
.section-progress span{flex:1;height:3px;border-radius:999px;background:var(--rp-surface-2)}
.section-progress span.is-done{background:var(--rp-primary)}
.arrow-flow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:var(--rp-gap)}
.arrow-flow__item{padding:6px 10px;border:1px solid var(--rp-border);border-radius:999px;background:var(--rp-surface);font-size:11.5px}
.arrow-flow__item:not(:last-child)::after{content:"→";margin-left:8px;color:var(--rp-t3)}
.finding,.action-item,.risk-cell,.mini-chart,.rank-row,.timeline-card{transition:transform .15s ease,border-color .15s ease}
.finding:hover,.action-item:hover,.risk-cell:hover,.mini-chart:hover,.rank-row:hover,.timeline-card:hover{transform:translateY(-1px);border-color:rgba(79,124,255,.4)}
@media(max-width:820px){
  .stat-value{font-size:28px}.compare-now{font-size:22px}.rank-name{flex-basis:76px}
  .cover-title{font-size:26px}.hero-kpi__value{font-size:36px}.hero-number{font-size:42px}
  .bullet-row{grid-template-columns:84px 1fr auto}
  .risk-matrix{grid-template-columns:20px repeat(3,minmax(0,1fr))}
  .margin-note{float:none;width:auto;margin:10px 0;padding:8px 10px}
  .full-bleed{margin-left:0;margin-right:0;padding:14px 0;border-radius:10px}
}
.ol-chart{width:100%;height:320px;min-height:200px}
.ol-chart:not([data-ol-ready]):empty::after{content:"图表加载中…";display:flex;align-items:center;justify-content:center;height:100%;color:var(--rp-t3);font-size:12px}
.ol-chart[data-ol-empty]:empty::after{content:"（图表数据为空）"}
p{margin:0 0 8px}
.section{scroll-margin-top:14px}
/* ===== 页脚 / 水印 ===== */
.report-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:28px 0 0;padding-top:12px;border-top:1px dashed var(--rp-border);font-size:11px;color:var(--rp-t3)}
.report-print-footer{display:none}
/* ===== 数据质量提示（warnings） ===== */
.data-quality{display:flex;align-items:flex-start;gap:10px;margin-top:var(--rp-gap);padding:9px 12px;border-radius:10px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.28);font-size:11.5px;color:#b45309}
.data-quality__title{flex:0 0 auto;font-weight:700;white-space:nowrap}
.data-quality ul{margin:0;padding-left:16px;color:var(--rp-t2)}
.data-quality li{margin:1px 0;line-height:1.6}
html[data-theme="dark"] .data-quality{background:rgba(245,158,11,.14);border-color:rgba(251,191,36,.32);color:#fcd34d}
.report-watermark{position:fixed;inset:0;z-index:5;pointer-events:none;opacity:.07;background-repeat:repeat}
/* ===== 表格：吸顶表头 + 长表折叠 ===== */
thead th{position:sticky;top:0;z-index:2}
.table-wrap>.table-toggle{margin-top:0}
.table-toggle{display:block;width:100%;margin-top:8px;padding:6px;border:1px dashed var(--rp-border);border-radius:8px;background:var(--rp-surface);color:var(--rp-t2);font-size:11.5px;font-family:inherit;cursor:pointer}
.table-toggle:hover{border-color:var(--rp-primary);color:var(--rp-primary)}
.table-note{margin-top:8px;padding:5px 10px;border-radius:8px;font-size:11px;color:#b45309;background:rgba(245,158,11,.12)}
.is-clamped tr.is-hide{display:none}
.table-wrap.is-clamped{overflow:auto}
/* 导出长图/PDF 时（html2canvas 不套用 @media print）也要展开所有内容 */
html.is-export .table-wrap.is-clamped{max-height:none!important;overflow:visible!important}
html.is-export .is-clamped tr.is-hide{display:table-row!important}
html.is-export .table-toggle{display:none!important}
html.is-export .full-bleed{margin-left:0;margin-right:0;padding:14px 0}
html.is-export .margin-note{float:none;width:auto;margin:8px 0}
/* ===== 打印 / 另存为 PDF ===== */
@media print{
  html[data-theme="dark"]{
    --rp-bg:#fff; --rp-surface:#fff; --rp-surface-2:#f7f9fc; --rp-border:#e8edf5;
    --rp-t1:#1f2937; --rp-t2:#64748b; --rp-t3:#94a3b8;
    --rp-shadow:none;
  }
  html,body{background:#fff}
  body{padding:0 2px}
  .report{max-width:none}
  .report-watermark,.table-toggle,.ol-html-report__mask{display:none!important}
  .report-print-footer{display:block;position:fixed;left:0;right:0;bottom:0;padding:2px 0 0;font-size:9.5px;color:#a3aec0;text-align:center;border-top:1px solid #eef2f7}
  .data-quality{background:#fffbeb;border-color:#fcd34d;color:#92400e}
  .card,.kpi,.stat,.ring,.compare,.callout,.risk-item,.section,.ol-chart-block,
  .report-cover,.hero-kpi,.finding,.timeline-item,.action-item,.risk-cell,.mini-chart,
  .top-bottom__col,.comparison-matrix,.report-appendix,.pull-quote{box-shadow:none;break-inside:avoid;page-break-inside:avoid}
  .section-head{break-after:avoid;page-break-after:avoid}
  .full-bleed{margin-left:0;margin-right:0;padding:12px 0}
  .margin-note{float:none;width:auto;margin:8px 0}
  .ol-chart{break-inside:avoid;page-break-inside:avoid}
  table{break-inside:auto;page-break-inside:auto}
  thead{display:table-header-group}
  tr{break-inside:avoid;page-break-inside:avoid}
  .is-clamped tr.is-hide{display:table-row!important}
  .table-wrap.is-clamped{max-height:none!important;overflow:visible!important}
  .ol-chart:not([data-ol-ready]):empty::after{content:""}
  @page{size:A4;margin:12mm 10mm 14mm}
}
`;

/**
 * 旧报告兜底 CSS（注入在模型 CSS 之后）：
 * - 模型可能把 "01 / OVERVIEW" 写进 .section-no，导致编号溢出盖住标题
 * - 模型可能给章节标题/编号加绝对定位，窄屏直接叠字
 * 这里只做最小保护，不改变正常布局。
 */
export const REPORT_SAFETY_CSS = `
.section-no{max-width:56px;overflow:hidden!important;white-space:nowrap!important;text-overflow:clip!important}
.section-divider__no{max-width:120px;overflow:hidden!important;white-space:nowrap!important}
.section-no,.section-divider__no,.section-head,.section-title,.section-sub{position:static!important}
`;
