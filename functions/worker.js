addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  let target = url.searchParams.get("url")

  if (!target) {
    return new Response("Missing 'url' parameter", { status: 400 })
  }

  // 自动处理 URL 特殊字符
  try {
    target = encodeURI(target)
  } catch (e) {}

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://movie.douban.com/"
      }
    })

    const newHeaders = new Headers(res.headers)
    newHeaders.set("Access-Control-Allow-Origin", "*") // 跨域

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders
    })
  } catch (err) {
    return new Response("Fetch failed: " + err.message, { status: 500 })
  }
}
