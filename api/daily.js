// api/daily.js
import axios from 'axios';

// 配置常量
const ICIBA_URL = 'http://open.iciba.com/dsapi/';
// 这里的 query 可以根据喜好改，比如 nature,city,architecture
const UNSPLASH_URL = 'https://api.unsplash.com/photos/random?query=nature,minimalism&orientation=portrait';

export default async function handler(req, res) {
  // 1. 设置 CORS (允许你的小程序跨域调用)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 生产环境建议改成你的域名
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 如果是预检请求 (OPTIONS)，直接返回
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 2. 获取 Unsplash Key (从环境变量中读取，安全！)
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      throw new Error('缺少环境变量 UNSPLASH_ACCESS_KEY');
    }

    console.log('🚀 开始抓取数据...');

    // 3. 并行请求金山词霸和 Unsplash
    const [icibaRes, unsplashRes] = await Promise.allSettled([
      axios.get(ICIBA_URL),
      axios.get(UNSPLASH_URL, {
        headers: { Authorization: `Client-ID ${accessKey}` }
      })
    ]);

    // 4. 数据处理 (使用 Promise.allSettled 防止一方挂了导致整个接口崩溃)
    let icibaData = {};
    let unsplashData = null;

    // 处理金山数据
    if (icibaRes.status === 'fulfilled') {
      icibaData = icibaRes.value.data;
    } else {
      console.error('金山接口失败:', icibaRes.reason);
    }

    // 处理 Unsplash 数据
    if (unsplashRes.status === 'fulfilled') {
      unsplashData = unsplashRes.value.data;
    } else {
      console.error('Unsplash 接口失败:', unsplashRes.reason);
      // 如果 Unsplash 挂了，使用金山的图作为兜底，或者一个默认图
    }

    // 5. 组装最终 JSON
    const finalData = {
      date: icibaData.dateline || new Date().toISOString().split('T')[0],
      english: icibaData.content || 'No content today.',
      chinese: icibaData.note || '今日无内容。',
      audio: icibaData.tts,
      // 优先用 Unsplash，没有就用金山原图
      backgroundImage: unsplashData ? unsplashData.urls.regular : icibaData.picture2,
      // 附加信息
      photographer: unsplashData ? unsplashData.user.name : 'Iciba',
      photographerUrl: unsplashData ? unsplashData.user.links.html : '',
      updateTime: new Date().toISOString()
    };

    // 6. 设置缓存 (非常重要！Vercel 是按次计费的)
    // s-maxage=3600 表示 CDN 缓存 1 小时，stale-while-revalidate 表示后台更新时允许先发旧数据
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    // 7. 返回结果
    res.status(200).json(finalData);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
