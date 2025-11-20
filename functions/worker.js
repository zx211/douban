const NODE_LIST = [
  "img1.doubanio.com",
  "img2.doubanio.com",
  "img3.doubanio.com",
  "img9.doubanio.com"
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let target = url.searchParams.get("url");

    if (!target) {
      return new Response("请提供 ?url= 图片地址", { status: 400 });
    }

    let tried = 0;
    let lastErr = null;

    for (const node of NODE_LIST) {
      tried++;
      let proxyUrl = target.replace(/img\d\.doubanio\.com/, node);

      try {
        const res = await fetch(proxyUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
          }
        });

        if (res.status === 200) {
          const headers = new Headers(res.headers);
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Access-Control-Allow-Headers", "*");
          headers.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");

          return new Response(res.body, { status: res.status, headers });
        } else {
          lastErr = new Error(`节点 ${node} 返回状态 ${res.status}`);
        }
      } catch (err) {
        lastErr = err;
      }
    }

    return new Response(
      `所有豆瓣节点请求失败，总尝试次数 ${tried} 次，最后错误: ${lastErr}`,
      { status: 502 }
    );
  }
};
