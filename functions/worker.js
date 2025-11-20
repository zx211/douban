export default {
    async fetch(request) {
        try {
            const url = new URL(request.url);
            const target = url.searchParams.get("url");

            if (!target) {
                return new Response("缺少 url 参数", { status: 400 });
            }

            // 仅允许现存的豆瓣图片域名
            const doubanHosts = [
                "img1.doubanio.com",
                "img2.doubanio.com",
                "img3.doubanio.com",
                "img9.doubanio.com",
                "img1.douban.com",
                "img2.douban.com",
                "img3.douban.com",
                "img9.douban.com"
            ];

            const host = new URL(target).hostname;

            if (!doubanHosts.includes(host)) {
                return new Response("禁止访问非豆瓣图片域名", { status: 403 });
            }

            // 请求真实豆瓣图片
            const res = await fetch(target, {
                headers: {
                    "Referer": "https://www.douban.com",
                    "User-Agent": "Mozilla/5.0"
                }
            });

            const newHeaders = new Headers(res.headers);
            newHeaders.set("Access-Control-Allow-Origin", "*");

            return new Response(res.body, {
                status: res.status,
                headers: newHeaders
            });

        } catch (err) {
            return new Response("Worker 错误: " + err.toString(), { status: 500 });
        }
    }
};
