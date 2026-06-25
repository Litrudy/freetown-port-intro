// Dev-only 冒烟测试:系统 Chrome 无头加载页面,验证 P1 动效不报错且行为正确,并截图。
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
const URL = process.env.URL || "http://localhost:8123/index.html";
const SHOT = process.env.SHOT || "C:/Users/张真/AppData/Local/Temp/claude/e--project-Freetown-introduce/58cbe6d8-ca7a-4bb9-bb38-7a361635f5ee/scratchpad";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--window-size=1440,900",
    "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
if (process.env.REDUCED) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("requestfailed", (r) => { const u = r.url();
  if (!u.endsWith(".map")) errors.push("requestfailed: " + u); });

await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });
await sleep(1000);

const init = await page.evaluate(() => ({
  libs: [typeof window.gsap, typeof window.ScrollTrigger, typeof window.Lenis].join(","),
  h2lines: document.querySelectorAll("h2 .line").length,
  hasCursor: document.body.classList.contains("has-cursor"),
  cursorEl: !!document.querySelector(".cursor") && !!document.querySelector(".cursor-ring"),
  leadOpacity: parseFloat(getComputedStyle(document.querySelector("p.lead")).opacity),
  img0: getComputedStyle(document.querySelector(".media .layer.on")).backgroundImage.slice(0, 55),
  bgfx: (() => { const c = document.getElementById("bgfx");
    return c ? { disp: getComputedStyle(c).display, w: c.width, h: c.height } : null; })(),
}));
await page.screenshot({ path: SHOT + "/smoke-hero.png" });

// 滚到“概况”(含 1,067m / ~10m / 6),触发 count-up
await page.evaluate(() => window.scrollTo(0, innerHeight * 1.2));
await sleep(2000);
const stat1 = await page.evaluate(() =>
  [...document.querySelectorAll("section .stat")][0]
    ? [...[...document.querySelectorAll("section .stat")][0].querySelectorAll(".v")].map(v => v.textContent.trim())
    : []);
await page.screenshot({ path: SHOT + "/smoke-stat.png" });

// 滚到底部“收费”($100 / $20 / 50%)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(2200);
const probe2 = await page.evaluate(() => {
  const stats = [...document.querySelectorAll("section .stat")];
  const last = stats[stats.length - 1];
  const layer = document.querySelector(".media .layer.on");
  return {
    tariff: last ? [...last.querySelectorAll(".v")].map(v => v.textContent.trim()) : [],
    bgPosY: getComputedStyle(layer).backgroundPositionY,
    img: getComputedStyle(layer).backgroundImage.slice(0, 55),
    progress: document.getElementById("progress").style.width,
  };
});
await page.screenshot({ path: SHOT + "/smoke-tariff.png" });
await browser.close();

// 断言:count-up 必须保留前缀/后缀/千分位
const expect1 = ["1,067m", "~10m", "6"];
const expectT = ["$100", "$20", "50%"];
const ok1 = JSON.stringify(stat1) === JSON.stringify(expect1);
const okT = JSON.stringify(probe2.tariff) === JSON.stringify(expectT);
const parallax = parseFloat(probe2.bgPosY) !== 50;

console.log("Chrome :", CHROME);
console.log("init   :", JSON.stringify(init));
console.log("stat#1 :", JSON.stringify(stat1), ok1 ? "✓" : "✗ EXPECT " + JSON.stringify(expect1));
console.log("tariff :", JSON.stringify(probe2.tariff), okT ? "✓" : "✗ EXPECT " + JSON.stringify(expectT));
console.log("parallax bgPosY:", probe2.bgPosY, parallax ? "✓ (moved)" : "✗ (still 50%)");
console.log("img@bottom:", probe2.img, "| progress:", probe2.progress);
console.log("errors :", errors.length ? "\n  - " + errors.join("\n  - ") : "none ✓");

let pass;
if (process.env.REDUCED) {
  // 降级模式:不拆行、不注入光标、内容静态可读(.lead 不被隐藏)、数值原样、零报错
  const reducedOk = !init.cursorEl && init.h2lines === 0 && init.leadOpacity > 0.9;
  console.log("REDUCED: cursor=", init.cursorEl, "h2lines=", init.h2lines, "leadOpacity=", init.leadOpacity, reducedOk ? "✓" : "✗");
  pass = !errors.length && ok1 && okT && reducedOk;
} else {
  pass = !errors.length && ok1 && okT && init.cursorEl && init.h2lines > 0;
}
console.log(pass ? "\nSMOKE PASS ✓ (" + (process.env.REDUCED ? "reduced-motion" : "full-motion") + ")" : "\nSMOKE FAIL ✗");
process.exit(pass ? 0 : 1);
