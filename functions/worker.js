const DOUBAN_NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("缺少 ?url=", { status: 400 });
    }

    // 只允许常见图片格式
    const allowedExt = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
    const fileName = target.split("/").pop().split("?")[0];
    if (!allowedExt.test(fileName)) {
      return new Response("仅支持图片格式（jpg/png/webp/avif/gif）", { status: 400 });
    }

    const reqHeaders = new Headers(request.headers);
    const ENABLE_RANGE = true;
    if (!ENABLE_RANGE) reqHeaders.delete("Range");

    let finalResp;
    try {
      if (/^https:\/\/img\d\.doubanio\.com/.test(target)) {
        // 豆瓣节点轮换 + Cloudflare 图片压缩
        const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
        for (const node of nodes) {
          const newUrl = target.replace(/^https:\/\/img\d\.doubanio\.com/, node);
          finalResp = await fetch(newUrl, {
            method: request.method,
            headers: reqHeaders,
            cf: { image: { width: 600, quality: 75 } } // 可根据需要调整
          });
          if (finalResp.ok) break;
        }
        if (!finalResp || !finalResp.ok) {
          return new Response("豆瓣所有节点请求失败", { status: 502 });
        }
      } else {
        // 其他源直接转发
        finalResp = await fetch(target, { method: request.method, headers: reqHeaders });
      }

      // 设置响应头
      const respHeaders = new Headers(finalResp.headers);
      if (ENABLE_RANGE) respHeaders.set("Accept-Ranges", "bytes");
      respHeaders.set("Access-Control-Allow-Origin", "*");

      // 强制 Content-Type
      const ext = fileName.split(".").pop().toLowerCase();
      const mimeTypes = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        avif: "image/avif"
      };
      respHeaders.set("Content-Type", mimeTypes[ext] || "application/octet-stream");

      respHeaders.set("Cache-Control", "public, max-age=31536000"); // 缓存 1 年

      return new Response(finalResp.body, { status: finalResp.status, headers: respHeaders });

    } catch (err) {
      return new Response("图片请求失败：" + err.message, { status: 500 });
    }
  }
};
