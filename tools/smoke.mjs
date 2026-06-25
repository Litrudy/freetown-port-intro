// Dev-only 冒烟测试:用系统 Chrome 无头加载页面,检查报错/库加载/标题拆行,并截图。
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
const URL = process.env.URL || "http://localhost:8123/index.html";
const SHOT = process.argv[2] || "../assets/photos/freetown_web/_smoke.png";

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("requestfailed", (r) => {
  const u = r.url();
  if (!u.endsWith(".map")) errors.push("requestfailed: " + u + " (" + r.failure()?.errorText + ")");
});

await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200)); // 让动效/懒加载跑一会

const probe = await page.evaluate(() => ({
  gsap: typeof window.gsap,
  scrolltrigger: typeof window.ScrollTrigger,
  lenis: typeof window.Lenis,
  h2lines: document.querySelectorAll("h2 .line").length,
  h1lines: document.querySelectorAll("h1 .line").length,
  visibleImg: getComputedStyle(document.querySelector(".media .layer.on")).backgroundImage.slice(0, 60),
  progressW: document.getElementById("progress").style.width,
}));

// 滚动到中段,验证换图/进度条推进
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
await new Promise((r) => setTimeout(r, 1200));
const mid = await page.evaluate(() => ({
  progressW: document.getElementById("progress").style.width,
  cap: document.getElementById("cap").textContent.trim().slice(0, 50),
  visibleImg: getComputedStyle(document.querySelector(".media .layer.on")).backgroundImage.slice(0, 60),
}));
await page.screenshot({ path: SHOT, fullPage: false });

await browser.close();

console.log("Chrome:", CHROME);
console.log("probe :", JSON.stringify(probe, null, 0));
console.log("mid   :", JSON.stringify(mid, null, 0));
console.log("errors:", errors.length ? "\n  - " + errors.join("\n  - ") : "none ✓");
console.log("shot  :", SHOT);
process.exit(errors.length ? 1 : 0);
