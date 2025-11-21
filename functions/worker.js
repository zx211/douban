export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("缺少 ?url=", { status: 400 });
    }

    // ========== (A) 防盗链：目前默认关闭 ==========
    const ENABLE_ANTIHOTLINK = false;  // 你要求“保留但不启用”
    const ALLOW_IP = [];               // 未来可加 IP 白名单
    if (ENABLE_ANTIHOTLINK) {
      const referer = request.headers.get("Referer") || "";
      let allowed = false;
      for (let ip of ALLOW_IP) {
        if (referer.includes(ip)) allowed = true;
      }
      if (!allowed) {
        return new Response("Hotlink blocked", { status: 403 });
      }
    }

    // ========== (B) 选项 2：强制爱奇艺只能代理图片 ==========
    if (target.includes("iqiyipic.com")) {

      // 检测是否是图片扩展名
      const imageExt = target.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/);

      if (!imageExt) {
        return new Response("仅允许代理爱奇艺图片文件", { status: 403 });
      }
    }

    // ========== (C) 选项 3：只允许常见图片格式 ==========

    const allowedExt = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
    const noExt = target.split("/").pop().split("?")[0];

    if (!allowedExt.test(noExt)) {
      return new Response("仅支持图片格式（jpg/png/webp/avif/gif）", { status: 400 });
    }

    // ========== (D) 选项 4：自动支持 Range（可开关） ==========
    const ENABLE_RANGE = true;

    const headers = new Headers(request.headers);
    if (!ENABLE_RANGE) {
      headers.delete("Range");
    }

    // 请求源图片
    const resp = await fetch(target, {
      method: request.method,
      headers,
    });

    // 自动添加 Accept-Ranges
    const newHeaders = new Headers(resp.headers);
    if (ENABLE_RANGE) {
      newHeaders.set("Accept-Ranges", "bytes");
    }

    return new Response(resp.body, {
      status: resp.status,
      headers: newHeaders
    });
  }
}
