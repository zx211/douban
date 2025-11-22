const DOUBAN_NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif'
};

const COOKIE = "bid=Q3fMtP9xyzY";  // ← 用你浏览器里的匿名 Cookie 替换

export default {
  async fetch(request, env, ctx) {

    const url = new URL(request.url);
    const path = url.pathname;

    if (!/^\/view\/photo\/.*\/public\/.*\.(jpg|jpeg|png|webp|gif|avif)$/i.test(path)) {
      return new Response("路径不支持", { status: 400 });
    }

    const cache = caches.default;
    let cached = await cache.match(request);
    if (cached) return cached;

    let finalResp = null;

    const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
    for (const node of nodes) {
      const newUrl = node + path;

      try {
        const headers = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://movie.douban.com/",
          "Cookie": COOKIE
        };

        const resp = await fetch(newUrl, { headers });

        if (resp.ok) {
          finalResp = resp;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!finalResp) return new Response("豆瓣请求失败", { status: 502 });

    const ext = path.split('.').pop().toLowerCase();
    const h = new Headers(finalResp.headers);
    h.set("Content-Type", MIME_MAP[ext] || "image/jpeg");
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Cache-Control", "public, max-age=31536000");
    h.delete("Accept-Ranges");

    const response = new Response(finalResp.body, { headers: h });
    ctx.waitUntil(cache.put(request, response.clone()));

    return response;
  }
};
