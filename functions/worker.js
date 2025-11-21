const DOUBAN_NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname; // 保留完整路径，如 /view/photo/s_ratio_poster/public/p2410569290.jpg

    if (!path) return new Response("缺少图片路径", { status: 400 });

    // 只允许常见图片格式
    const allowedExt = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
    if (!allowedExt.test(path)) return new Response("仅支持图片格式", { status: 400 });

    const respHeaders = new Headers();
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    respHeaders.set("Cache-Control", "public, max-age=31536000");

    // OPTIONS 预检请求直接返回
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: respHeaders });

    try {
      // 随机选择豆瓣节点请求图片
      const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
      let finalResp;
      for (const node of nodes) {
        const newUrl = `https://${node.replace(/^https?:\/\//, '')}${path}`;
        try {
          finalResp = await fetch(newUrl, { cf: { image: { width: 600, quality: 75 } } });
          if (finalResp.ok) break;
        } catch (e) {
          continue;
        }
      }
      if (!finalResp || !finalResp.ok) return new Response("豆瓣所有节点请求失败", { status: 502 });

      // Content-Type 设置
      const ext = path.split(".").pop().toLowerCase();
      const mimeTypes = { jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp", gif:"image/gif", avif:"image/avif" };
      respHeaders.set("Content-Type", mimeTypes[ext] || "application/octet-stream");
      respHeaders.set("Accept-Ranges", "bytes");

      return new Response(finalResp.body, { status: finalResp.status, headers: respHeaders });

    } catch (err) {
      return new Response("图片请求失败：" + err.message, { status: 500, headers: respHeaders });
    }
  }
};
