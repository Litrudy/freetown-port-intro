# 弗里敦港 · 沉浸式介绍页 / Port of Freetown — Immersive Intro

参照 [lusion.co](https://lusion.co) 风格的弗里敦港(塞拉利昂)物流实务介绍页:深色电影感、左图右文、滚动驱动叙事。原生 HTML/CSS/JS 单文件,**零构建**,本地 vendored 库,可直接静态部署。

**🔗 在线预览:** https://litrudy.github.io/freetown-port-intro/

## 特性
- **惯性平滑滚动**(Lenis)+ GSAP/ScrollTrigger 统一动效编排
- **标题逐行遮罩揭示**、段落/数字/tag 错落入场(stagger)
- 左图**滚动视差** + **clip-path 遮罩擦除换图**
- **自定义磁吸光标**、数字 **count-up**(保留前后缀与千分位)
- **WebGL hero 流体噪点背景**(原生 shader,半分辨率 60fps)
- **区块级转场** + **中/英语言切换**
- 图片全部**本地自托管**(WebP 主 + JPG 兜底,懒加载),首屏 ~448KB
- 无障碍:`prefers-reduced-motion` / 触摸设备下全部强动效优雅降级

## 目录
```
assets/photos/freetown_web/   # 站点(部署到 gh-pages 分支根)
  ├─ index.html               # 主页面(单文件)
  ├─ images/                  # 优化图 + CREDITS.md(均 CC BY-SA 署名)
  └─ vendor/                  # 本地 vendored:gsap / ScrollTrigger / lenis
tools/                        # dev-only:图片优化(sharp)+ 无头冒烟测试(不部署)
```

## 本地预览
```bash
cd assets/photos/freetown_web
python -m http.server 8000   # 浏览器开 http://localhost:8000
```

## 托管说明
GitHub Pages 从 `gh-pages` 分支根托管(该分支由 `assets/photos/freetown_web/` 子目录经
`git subtree` 推送而来)。更新站点后重新发布:
```bash
git subtree push --prefix=assets/photos/freetown_web origin gh-pages
```

## 图片版权
所有图片来自 Wikimedia Commons,均为 **CC BY-SA**,作者与授权见
[`images/CREDITS.md`](assets/photos/freetown_web/images/CREDITS.md)。
