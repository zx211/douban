const ALLOWED_IPS = [
  '你的服务器公网IP'  // 只有这个 IP 可以访问
];

const NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

export default {
  async fetch(request) {
    const clientIP = request.headers.get('CF-Connecting-IP');
    if (!ALLOWED_IPS.includes(clientIP)) {
      return new Response('禁止访问', { status: 403 });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) return new Response('缺少 url 参数', { status: 400 });

    // 随机节点顺序，保证轮换
    const nodes = [...NODES].sort(() => Math.random() - 0.5);

    for (const node of nodes) {
      try {
        const newUrl = targetUrl.replace(/^https:\/\/img\d\.doubanio\.com/, node);

        // 使用 Cloudflare 图像优化
        const cfOptions = {
          cf: {
            image: {
              width: 600,       // 压缩宽度，可按需调整
              quality: 75       // 压缩质量
            }
          }
        };

        const res = await fetch(newUrl, cfOptions);
        if (!res.ok) continue;

        // 设置缓存
        const headers = new Headers(res.headers);
        headers.set('Cache-Control', 'public, max-age=31536000'); // 1年缓存

        const body = await res.arrayBuffer();
        return new Response(body, { status: 200, headers });
      } catch (e) {
        continue;
      }
    }

    return new Response('所有节点请求失败', { status: 502 });
  }
};
