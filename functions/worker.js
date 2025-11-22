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

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname; // /view/photo/.../public/xxx.jpg

    if (!path) return new Response("缺少路径", { status: 400 });

    const reqHeaders = new Headers(request.headers);
    reqHeaders.delete("Range"); // 避免前端分段加载失败

    let finalResp;

    // 豆瓣图片节点轮换
    if (/^\/view\/photo\/.*\/public\/.*\.(jpg|jpeg|png|webp|gif|avif)$/i.test(path)) {
      const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
      for (const node of nodes) {
        try {
          const newUrl = node + path;
          // 模拟浏览器请求头，避免被豆瓣拦截
          finalResp = await fetch(newUrl, { 
            method: request.method,
            headers: reqHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36') 
          });

          if (finalResp.ok) break;
        } catch (e) {
          console.error('请求失败，尝试其他节点:', e);
          continue;
        }
      }
      if (!finalResp || !finalResp.ok) return new Response("豆瓣节点请求失败", { status: 502 });
    } else {
      return new Response("不支持的路径", { status: 400 });
    }

    const respHeaders = new Headers(finalResp.headers);
    const ext = path.split('.').pop().toLowerCase();
    respHeaders.set("Content-Type", MIME_MAP[ext] || 'image/jpeg');

    // 添加 CORS 头部，允许任何来源访问
    respHeaders.set("Access-Control-Allow-Origin", "*");

    // 设置缓存头部，缓存1年
    respHeaders.set("Cache-Control", "public, max-age=31536000"); // 1年缓存

    // 删除 Accept-Ranges，避免分段请求问题
    respHeaders.delete("Accept-Ranges");

    // 设置缓存策略（这里使用了 Cloudflare Worker 的缓存）
    const cache = caches.default;
    // 尝试从缓存中读取图片
    let cachedResponse = await cache.match(request);
    if (!cachedResponse) {
      // 如果缓存未命中，则缓存到 Cloudflare CDN
      cachedResponse = new Response(finalResp.body, { status: finalResp.status, headers: respHeaders });
      event.waitUntil(cache.put(request, cachedResponse.clone())); // 缓存图片
    }

    return cachedResponse;
  }
};
