addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const target = url.searchParams.get("url")
  
  if (!target) return new Response("Missing 'url' parameter", { status: 400 })
  
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://movie.douban.com/"
      }
    })
    const newHeaders = new Headers(res.headers)
    newHeaders.set("Access-Control-Allow-Origin", "*")
    return new Response(res.body, { status: res.status, headers: newHeaders })
  } catch (err) {
    return new Response("Failed to fetch: " + err.message, { status: 500 })
  }
}
