export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 默认占位图 URL（你可以换成你的 CDN 图片）
    const PLACEHOLDER = "https://img.yourdomain.com/static/placeholder.jpg";

    // ---- ① 获取目标 URL（支持两种格式） ----
    let target = url.searchParams.get("url");
    if (!target) {
      const path = url.pathname.slice(1);
      if (path.startsWith("http")) {
        target = decodeURIComponent(path);
      }
    }

    if (!target) {
      return Response.redirect(PLACEHOLDER, 302);
    }

    // ---- ② 豆瓣可用节点 ----
    const DOUBAN_NODES = [
      "https://img1.doubanio.com",
      "https://img2.doubanio.com",
      "https://img3.doubanio.com",
      "https://img9.doubanio.com"
    ];

    // ---- ③ 替换节点 (自动生成多个候选 URL) ----
    let candidateUrls = [];
    try {
      const path = target.replace(/^https?:\/\/[^/]+/, "");
      candidateUrls = DOUBAN_NODES.map(node => node + path);
    } catch (e) {
      return Response.redirect(PLACEHOLDER, 302);
    }

    // 如果 target 已经是某个 node，加入第一候选
    candidateUrls.unshift(target);

    // ---- ④ 尝试逐节点请求 ----
    for (const tryUrl of candidateUrls) {
      try {
        const res = await fetch(tryUrl, {
          method: "GET",
          cf: {
            cacheEverything: true,
            image: {
              format: "auto",
              quality: 75,
              fit: "cover",
              sharpen: 1,
            }
          }
        });

        // 200 才算成功
        if (res.status === 200 && res.headers.get("content-type")?.includes("image")) {
          return new Response(res.body, res);
        }

      } catch (e) {
        // 跳过继续试下一个
      }
    }

    // ---- ⑤ 全部失败 → 返回占位图 ----
    return fetch(PLACEHOLDER, {
      cf: { cacheEverything: true }
    });
  }
};
