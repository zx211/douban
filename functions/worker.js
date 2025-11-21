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

    if (!target) return new Response("缺少 ?url=", { status: 400 });

    const allowedExt = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
    const fileName = target.split("/").pop().split("?")[0];
    if (!allowedExt.test(fileName)) return new Response("仅支持图片格式", { status: 400 });

    const respHeaders = new Headers();
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    respHeaders.set("Cache-Control", "public, max-age=31536000");

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: respHeaders });

    try {
      let finalResp;
      if (/^https:\/\/img\d\.doubanio\.com/.test(target)) {
        const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
        for (const node of nodes) {
          const newUrl = target.replace(/^https:\/\/img\d\.doubanio\.com/, node);
          finalResp = await fetch(newUrl, { cf: { image: { width: 600, quality: 75 } } });
          if (finalResp.ok) break;
        }
        if (!finalResp || !finalResp.ok) return new Response("豆瓣所有节点请求失败", { status: 502 });
      } else {
        finalResp = await fetch(target);
      }

      const ext = fileName.split(".").pop().toLowerCase();
      const mimeTypes = { jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp", gif:"image/gif", avif:"image/avif" };
      respHeaders.set("Content-Type", mimeTypes[ext] || "application/octet-stream");
      respHeaders.set("Accept-Ranges", "bytes");

      return new Response(finalResp.body, { status: finalResp.status, headers: respHeaders });

    } catch (err) {
      return new Response("图片请求失败：" + err.message, { status: 500, headers: respHeaders });
    }
  }
};
