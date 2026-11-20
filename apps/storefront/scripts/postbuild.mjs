// 构建后处理：
// 1) 把 Vite 产出的商城入口 index.html 移到 dist/shop/index.html（商城地址 /shop/）
// 2) 把品牌首页（homepage/ 静态文件）复制到 dist 根目录（首页地址 /）
// 这样同一个 Pages 项目同时承载「品牌门面」与「在线商城」。
import { cp, mkdir, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const home = join(root, 'homepage');
const entry = join(dist, 'index.html');
const shopDir = join(dist, 'shop');
const shopEntry = join(shopDir, 'index.html');

if (!existsSync(dist)) {
  console.error('[postbuild] dist 不存在，先执行 vite build');
  process.exit(1);
}

if (existsSync(entry)) {
  await mkdir(shopDir, { recursive: true });
  await rm(shopEntry, { force: true });
  await rename(entry, shopEntry);
  console.log('[postbuild] 商城入口 -> /shop/index.html');
}

if (existsSync(home)) {
  for (const name of ['assets', 'coffee.html', 'tea.html', 'truffle.html', 'oil.html', 'styles.css', 'main.js', 'favicon.svg', 'index.html']) {
    const src = join(home, name);
    if (!existsSync(src)) continue;
    await cp(src, join(dist, name), { recursive: true, force: true });
  }
  const info = await stat(join(dist, 'index.html'));
  console.log(`[postbuild] 品牌首页 -> /index.html (${info.size} bytes)`);
} else {
  console.warn('[postbuild] 未找到 homepage 目录，跳过首页复制');
}
