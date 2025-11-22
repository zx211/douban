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

// 你的豆瓣 API 令牌
const ACCESS_TOKEN = '0b2bdeda43b5688921839c8ecb20399b';

// 允许访问的域名（你改这里）
const ALLOWED_REFERERS = [
  'guochanju.com',
  'www.leys.cc',
  'www.pianji.cc'
];

export default {
  async fetch(request, env, ctx) {
    // 域名限制
    const referer = request.headers.get("Referer") || "";
    if (!isAllowedReferer(referer)) {
      return new Response("Forbidden", { status: 403 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (/^\/view\/photo\/.*\/public\/.*\.(jpg|jpeg|png|webp|gif|avif)$/i.test(path)) {
      return handleImageRequest(path, request, ctx);
    }

    if (path.startsWith('/v2/movie/subject')) {
      return handleApiRequest(path, request, ctx);
    }

    return new Response("路径不支持", { status: 400 });
  }
};

// 判断域名是否允许
function isAllowedReferer(referer) {
  try {
    const domain = new URL(referer).hostname;
    return ALLOWED_REFERERS.includes(domain);
  } catch (e) {
    return false;
  }
}

// 处理图片请求
async function handleImageRequest(path, request, ctx) {
  const cache = caches.default;
  let cached = await cache.match(request);
  if (cached) return cached;

  let finalResp = null;
  const nodes = [...DOUBAN_NODES].sort(() => Math.random() - 0.5);

  for (const node of nodes) {
    try {
      const newUrl = node + path;
      const headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/*",
        "Referer": "https://movie.douban.com/",
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      };

      const resp = await fetch(newUrl, { headers });
      if (resp.ok) {
        finalResp = resp;
        break;
      }
    } catch (e) {}
  }

  if (!finalResp) return new Response("豆瓣节点请求失败", { status: 502 });

  const ext = path.split('.').pop().toLowerCase();
  const h = new Headers(finalResp.headers);
  h.set("Content-Type", MIME_MAP[ext] || "image/jpeg");
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Cache-Control", "public, max-age=31536000");
  h.delete("Accept-Ranges");

  const response = new Response(finalResp.body, { headers: h });
  ctx.waitUntil(cache.put(request, response.clone()));
  return response;
}

// 处理 API 请求
async function handleApiRequest(path, request, ctx) {
  const apiUrl = `https://api.douban.com${path}`;
  const headers = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://movie.douban.com/",
    "Authorization": `Bearer ${ACCESS_TOKEN}`
  };

  const finalResp = await fetch(apiUrl, { headers });

  if (!finalResp.ok) {
    return new Response("API 请求失败", { status: 502 });
  }

  const respHeaders = new Headers(finalResp.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(finalResp.body, { status: finalResp.status, headers: respHeaders });
}
