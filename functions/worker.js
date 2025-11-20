const NODES = [
  'https://img1.doubanio.com',
  'https://img2.doubanio.com',
  'https://img3.doubanio.com',
  'https://img9.doubanio.com'
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return new Response('缺少 url 参数', { status: 400 });
    }

    // 随机节点顺序，保证轮换
    const nodes = [...NODES].sort(() => Math.random() - 0.5);

    for (const node of nodes) {
      try {
        const newUrl = targetUrl.replace(/^https:\/\/img\d\.doubanio\.com/, node);

        // 使用 Cloudflare 图像优化
        const cfOptions = {
          cf: {
            image: {
              width: 600,       // 压缩宽度，可按需调整
              quality: 75       // 压缩质量，建议 70~80
            }
          }
        };

        const res = await fetch(newUrl, cfOptions);
        if (!res.ok) continue;

        // 设置 CORS + 缓存
        const headers = new Headers(res.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000'); // 1 年缓存

        const body = await res.arrayBuffer();
        return new Response(body, { status: 200, headers });
      } catch (e) {
        // 节点失败尝试下一个
        continue;
      }
    }

    return new Response('所有节点请求失败', { status: 502 });
  }
};
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
