// Dev-only: 把 images/originals/*.jpg 压成 ~1920px 的 WebP(主)+ JPG(兜底),输出到 images/。
// 用法:cd tools && npm install && npm run optimize
import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../assets/photos/freetown_web/images/originals");
const OUT = path.resolve(__dirname, "../assets/photos/freetown_web/images");
const MAX = 1920;          // 长边上限
const WEBP_Q = 78;
const JPG_Q = 82;

const kb = (n) => (n / 1024).toFixed(0) + "KB";

async function run() {
  if (!existsSync(SRC)) {
    console.error("找不到原图目录:", SRC);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (!files.length) {
    console.error("originals/ 下没有图片");
    process.exit(1);
  }

  for (const f of files) {
    const base = f.replace(/\.[^.]+$/, "");
    const inPath = path.join(SRC, f);
    const meta = await sharp(inPath).metadata();
    const resize = { width: MAX, height: MAX, fit: "inside", withoutEnlargement: true };

    const webpPath = path.join(OUT, base + ".webp");
    const jpgPath = path.join(OUT, base + ".jpg");

    await sharp(inPath).rotate().resize(resize)
      .webp({ quality: WEBP_Q, effort: 5 }).toFile(webpPath);
    await sharp(inPath).rotate().resize(resize)
      .jpeg({ quality: JPG_Q, mozjpeg: true, progressive: true }).toFile(jpgPath);

    const inSize = (await stat(inPath)).size;
    const wSize = (await stat(webpPath)).size;
    const jSize = (await stat(jpgPath)).size;
    console.log(
      `${base.padEnd(16)} ${meta.width}x${meta.height} ${kb(inSize).padStart(7)}` +
      `  ->  webp ${kb(wSize).padStart(6)} | jpg ${kb(jSize).padStart(6)}`
    );
  }
  console.log("\n完成。输出在 images/(.webp 主用,.jpg 兜底)。");
}
run().catch((e) => { console.error(e); process.exit(1); });
