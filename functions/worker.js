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

    if (!path) {
      return new Response("缺少路径", { status: 400 });
    }

    const reqHeaders = new Headers(request.headers);
    // 删除 Range 避免前端分段请求失败
    reqHeaders.delete("Range");

    let finalResp;

    // 豆瓣图片节点轮换
    if (/^\/view\/photo\/.*\/public\/.*\.(jpg|jpeg|png|webp|gif|avif)$/i.test(path)) {
      const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
      for (const node of nodes) {
        try {
          const newUrl = node + path;
          finalResp = await fetch(newUrl, {
            method: request.method,
            headers: reqHeaders
            // 不再启用 Cloudflare image 压缩，保证第一次加载可用
          });
          if (finalResp.ok) break;
        } catch (e) {
          continue;
        }
      }
      if (!finalResp || !finalResp.ok) {
        return new Response("豆瓣所有节点请求失败", { status: 502 });
      }
    } else {
      // 非豆瓣图片直接转发
      const target = url.searchParams.get("url");
      if (!target) return new Response("缺少 ?url=", { status: 400 });
      finalResp = await fetch(target, {
        method: request.method,
        headers: reqHeaders
      });
    }

    // ================= 响应头优化 =================
    const respHeaders = new Headers(finalResp.headers);
    const ext = path.split('.').pop().toLowerCase();
    respHeaders.set("Content-Type", MIME_MAP[ext] || 'image/jpeg');
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Cache-Control", "public, max-age=31536000"); // 缓存 1 年
    respHeaders.delete("Accept-Ranges"); // 删除 Range 避免前端分段加载失败

    return new Response(finalResp.body, {
      status: finalResp.status,
      headers: respHeaders
    });
  }
};
