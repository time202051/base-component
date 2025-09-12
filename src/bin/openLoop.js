// open-close-loop.js
// 循环“打开→停留→关闭→间隔”的浏览器控制脚本（Windows）
// 优先使用指定的 Chrome 路径独立进程（只关闭本次打开窗口）；否则使用默认浏览器并通过进程名强关（会关闭该浏览器所有窗口）。

const { spawn, exec, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const COUNT = 0; // 循环次数；0 表示无限循环
const MODE = process.env.MODE || "headless"; // headless|minimized|default
// 支持多页面：同一轮“同时打开，同时关闭”
const URLS = ["https://juejin.cn/post/7496406694357516303"];
const OPEN_MS = 3000; // 打开停留时间
const CLOSE_MS = 1000; // 关闭后间隔
const BROWSER_PROC = "chrome.exe"; // 默认浏览器进程名（默认浏览器模式会强关所有该进程窗口）
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const isWin = process.platform === "win32";
if (!isWin) {
  console.error("当前脚本仅适配 Windows。");
  process.exit(1);
}

// 判断文件是否存在
function fileExists(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK | fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// 创建临时profile，避免复用已开 Chrome 实例
function makeTempProfile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-prof-"));
  return dir;
}

// 优雅关闭与清理（单实例变量）
let currentProc = null;
let currentProfile = null;

async function cleanup() {
  try {
    if (currentProc && !currentProc.killed) {
      try {
        currentProc.kill();
      } catch {}
      try {
        execSync(`taskkill /PID ${currentProc.pid} /T /F`, { stdio: "ignore" });
      } catch {}
    }
  } catch {}
  currentProc = null;

  if (currentProfile) {
    try {
      fs.rmSync(currentProfile, { recursive: true, force: true });
    } catch {}
    currentProfile = null;
  }
}

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

// Chrome 独立进程：同一轮“并发打开→停留→并发关闭并清理”
async function openWithChromeLoop() {
  const loops = COUNT > 0 ? COUNT : Infinity;
  for (let i = 0; i < loops; i++) {
    const procs = [];
    const profiles = [];

    for (const url of URLS) {
      const prof = makeTempProfile();
      profiles.push(prof);
      const args = [
        "--new-window",
        `--user-data-dir=${prof}`,
        "--no-first-run",
        "--no-default-browser-check",
        ...(MODE === "headless" ? ["--headless=new", "--disable-gpu", "--hide-scrollbars"] : []),
        ...(MODE === "minimized" ? ["--start-minimized", "--window-size=1,1"] : []),
        url,
      ];
      const p = spawn(CHROME_PATH, args, { stdio: "ignore" });
      procs.push(p);
    }

    await sleep(OPEN_MS);

    // 并发关闭刚打开的所有 Chrome 进程
    for (const p of procs) {
      try {
        p.kill();
      } catch {}
      try {
        execSync(`taskkill /PID ${p.pid} /T /F`, { stdio: "ignore" });
      } catch {}
    }
    // 清理对应临时 profile
    for (const prof of profiles) {
      try {
        fs.rmSync(prof, { recursive: true, force: true });
      } catch {}
    }

    await sleep(CLOSE_MS);
  }
  await cleanup();
  process.exit(0);
}

// 默认浏览器：同一轮“并发打开→停留→一次性强关该进程所有窗口”
async function openWithDefaultBrowserLoop() {
  const loops = COUNT > 0 ? COUNT : Infinity;
  for (let i = 0; i < loops; i++) {
    for (const url of URLS) {
      const startArgs =
        MODE === "minimized" ? ["/c", "start", "/min", "", url] : ["/c", "start", "", url];
      spawn("cmd", startArgs, { detached: true, stdio: "ignore" }).unref();
    }

    await sleep(OPEN_MS);

    // 一次性结束该浏览器所有窗口（注意：这会关闭同类浏览器的所有窗口）
    exec(`taskkill /IM ${BROWSER_PROC} /F`, () => {});
    await sleep(CLOSE_MS);
  }
  await cleanup();
  process.exit(0);
}

(async function main() {
  const useChrome = fileExists(CHROME_PATH);
  if (useChrome) {
    await openWithChromeLoop();
  } else {
    console.warn(
      `未找到 Chrome：${CHROME_PATH}，将使用默认浏览器并通过进程名(${BROWSER_PROC})强制关闭。`
    );
    await openWithDefaultBrowserLoop();
  }
})();
