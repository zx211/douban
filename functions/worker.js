// functions/worker.js
// 豆瓣图片代理 Worker

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const target = url.searchParams.get("url")
  
  if (!target) {
    return new Response("请提供 ?url= 目标图片地址", { status: 400 })
  }

  try {
    const res = await fetch(target)
    const headers = new Headers(res.headers)
    headers.set("Access-Control-Allow-Origin", "*") // 允许跨域
    return new Response(res.body, { status: res.status, headers })
  } catch (err) {
    return new Response("请求失败：" + err, { status: 500 })
  }
}
