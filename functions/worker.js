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
          finalResp = await fetch(newUrl, { method: request.method, headers: reqHeaders });
          if (finalResp.ok) break;
        } catch (e) {
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
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Cache-Control", "public, max-age=31536000");
    respHeaders.delete("Accept-Ranges"); // 避免分段请求失败

    return new Response(finalResp.body, {
      status: finalResp.status,
      headers: respHeaders
    });
  }
};
