const DOUBAN_NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname; // /view/photo/.../public/xxx.jpg
    if (!path) {
      return new Response("缺少路径", { status: 400 });
    }

    const ENABLE_RANGE = true;
    const reqHeaders = new Headers(request.headers);
    if (!ENABLE_RANGE) reqHeaders.delete("Range");

    let finalResp;

    // 豆瓣图片节点轮换
    if (/^\/view\/photo\/.*\/public\/.*\.(jpg|jpeg|png|webp|gif|avif)$/i.test(path)) {
      const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
      for (const node of nodes) {
        try {
          const newUrl = node + path;
          finalResp = await fetch(newUrl, {
            method: request.method,
            headers: reqHeaders,
            cf: {
              image: { width: 600, quality: 75 } // 可调整压缩
            }
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

    const respHeaders = new Headers(finalResp.headers);
    if (ENABLE_RANGE) respHeaders.set("Accept-Ranges", "bytes");
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Content-Type", "image/*");
    respHeaders.set("Cache-Control", "public, max-age=31536000"); // 缓存 1 年

    return new Response(finalResp.body, {
      status: finalResp.status,
      headers: respHeaders
    });
  }
};
