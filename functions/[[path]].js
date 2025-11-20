addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  let target = url.searchParams.get("url")

  if (!target) {
    return new Response("Missing 'url' parameter", { status: 400 })
  }

  // 自动编码 URL
  try {
    target = decodeURIComponent(target)
  } catch (e) {
    // 如果不是编码过的也没关系
  }

  async function tryFetch(url, attempt = 1) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
          "Referer": "https://movie.douban.com/"
        }
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const newHeaders = new Headers(res.headers)
      newHeaders.set("Access-Control-Allow-Origin", "*")
      newHeaders.set("Cache-Control", "max-age=3600")
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      })
    } catch (err) {
      if (attempt < 2) {
        return tryFetch(url, attempt + 1)
      } else {
        return new Response(
          `Failed to fetch after 2 attempts: ${err.message}`,
          { status: 500 }
        )
      }
    }
  }

  return tryFetch(target)
}
