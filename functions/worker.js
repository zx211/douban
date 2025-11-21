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

    // ========== (A) 防盗链：默认关闭 ==========
    const ENABLE_ANTIHOTLINK = false;
    const ALLOW_IP = []; // 可填你服务器 IP
    if (ENABLE_ANTIHOTLINK) {
      const referer = request.headers.get("Referer") || "";
      let allowed = false;
      for (let ip of ALLOW_IP) {
        if (referer.includes(ip)) allowed = true;
      }
      if (!allowed) return new Response("Hotlink blocked", { status: 403 });
    }

    // ========== (B) IQIYI 图片过滤 ==========
    if (target.includes("iqiyipic.com")) {
      const imageExt = target.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/);
      if (!imageExt) return new Response("仅允许代理爱奇艺图片文件", { status: 403 });
    }

    // ========== (C) 只允许常见图片格式 ==========
    const allowedExt = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
    const fileName = target.split("/").pop().split("?")[0];
    if (!allowedExt.test(fileName)) {
      return new Response("仅支持图片格式（jpg/png/webp/avif/gif）", { status: 400 });
    }

    // ========== (D) 自动支持 Range ==========
    const ENABLE_RANGE = true;
    const reqHeaders = new Headers(request.headers);
    if (!ENABLE_RANGE) reqHeaders.delete("Range");

    // ========== (E) 豆瓣节点轮换 + Cloudflare 压缩 ==========
    let finalResp;
    if (/^https:\/\/img\d\.doubanio\.com/.test(target)) {
      const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
      for (const node of nodes) {
        try {
          const newUrl = target.replace(/^https:\/\/img\d\.doubanio\.com/, node);
          finalResp = await fetch(newUrl, {
            method: request.method,
            headers: reqHeaders,
            cf: {
              image: { width: 600, quality: 75 } // 压缩，可调整
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
      // IQIYI 或其他源直接转发
      finalResp = await fetch(target, {
        method: request.method,
        headers: reqHeaders
      });
    }

    const respHeaders = new Headers(finalResp.headers);
    if (ENABLE_RANGE) respHeaders.set("Accept-Ranges", "bytes");
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Cache-Control", "public, max-age=31536000"); // 缓存 1 年

    return new Response(finalResp.body, {
      status: finalResp.status,
      headers: respHeaders
    });
  }
};
