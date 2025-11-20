export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    const resp = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Cloudflare Worker)",
        "Referer": "https://www.douban.com", // 豆瓣必须加
      }
    });

    if (!resp.ok) {
      return new Response("Failed to fetch target", { status: resp.status });
    }

    const contentType = resp.headers.get("content-type") || "application/octet-stream";

    return new Response(resp.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
