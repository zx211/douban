const ALLOWED_ORIGIN = "https://YOUR_DOMAIN.COM";  // ← 保留下来的，未启用

const NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";

    // 🔒 防盗链（当前禁用，只需取消注释即可启用）
    /*
    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }
    */

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return new Response("缺少 url 参数", { status: 400 });
    }

    const nodes = [...NODES].sort(() => Math.random() - 0.5);

    for (const node of nodes) {
      try {
        const newUrl = targetUrl.replace(/^https:\/\/img\d\.doubanio\.com/, node);

        const res = await fetch(newUrl, {
          cf: {
            image: {
              width: 600,   // ← 压缩宽度
              quality: 70   // ← 压缩质量
            }
          }
        });

        if (!res.ok) continue;

        // 重新写 headers 避免 Worker 报错
        const headers = new Headers();
        headers.set("Content-Type", res.headers.get("Content-Type") || "image/jpeg");
        headers.set("Access-Control-Allow-Origin", "*");   // 当前全开放
        headers.set("Cache-Control", "public, max-age=31536000");

        const body = await res.arrayBuffer();
        return new Response(body, { status: 200, headers });

      } catch (err) {
        continue;
      }
    }

    return new Response("所有节点都失败了", { status: 502 });
  }
};
