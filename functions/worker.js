const DOUBAN_NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif'
};

// 使用你提供的第二个令牌
const ACCESS_TOKEN = '0b2bdeda43b5688921839c8ecb20399b';  // 直接使用这个令牌

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 判断是否是图片请求路径
    if (/^\/view\/photo\/.*\/public\/.*\.(jpg|jpeg|png|webp|gif|avif)$/i.test(path)) {
      return handleImageRequest(path, request, ctx);
    }

    // 判断是否是 API 请求
    if (path.startsWith('/v2/movie/subject')) {
      return handleApiRequest(path, request, ctx);
    }

    return new Response("路径不支持", { status: 400 });
  }
};

// 处理图片请求
async function handleImageRequest(path, request, ctx) {
  const cache = caches.default;
  let cached = await cache.match(request);
  if (cached) return cached;  // 返回缓存

  let finalResp = null;

  const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);
  for (const node of nodes) {
    const newUrl = node + path;

    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://movie.douban.com/",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,  // 加入 API 令牌
      };

      const resp = await fetch(newUrl, { headers });

      if (resp.ok) {
        finalResp = resp;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!finalResp) return new Response("豆瓣图片请求失败", { status: 502 });

  const ext = path.split('.').pop().toLowerCase();
  const h = new Headers(finalResp.headers);
  h.set("Content-Type", MIME_MAP[ext] || "image/jpeg");
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Cache-Control", "public, max-age=31536000");  // 缓存1年
  h.delete("Accept-Ranges");

  const response = new Response(finalResp.body, { headers: h });
  ctx.waitUntil(cache.put(request, response.clone()));  // 缓存图片

  return response;
}

// 处理 API 请求
async function handleApiRequest(path, request, ctx) {
  const apiUrl = `https://api.douban.com${path}`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://movie.douban.com/",
    "Authorization": `Bearer ${ACCESS_TOKEN}`,  // 加入 API 令牌
  };

  const finalResp = await fetch(apiUrl, { method: 'GET', headers });
  if (!finalResp.ok) {
    return new Response("API 请求失败", { status: 502 });
  }

  const respHeaders = new Headers(finalResp.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(finalResp.body, { status: finalResp.status, headers: respHeaders });
}
