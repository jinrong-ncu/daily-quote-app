// api/daily.js

// 1. 使用 require 引入依赖 (最稳妥的方式)
const axios = require('axios');
const { sql } = require('@vercel/postgres');

// --- 配置区域 ---
const ICIBA_URL = 'http://open.iciba.com/dsapi/';
const UNSPLASH_URL = 'https://api.unsplash.com/photos/random?query=nature,minimalism&orientation=portrait';

// 2. 使用 module.exports 导出函数
module.exports = async function handler(req, res) {
  // CORS 设置
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let targetDate = req.query.date;
    if (!targetDate) {
      const now = new Date();
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      targetDate = beijingTime.toISOString().split('T')[0];
    }

    console.log(`🔍 查询日期: ${targetDate}`);

    // 【查库】
    const { rows } = await sql`SELECT data FROM quotes WHERE date = ${targetDate};`;

    if (rows.length > 0) {
      console.log('✅ 命中数据库！');
      return res.status(200).json(rows[0].data);
    }

    // 【抓取】
    console.log('⚡️ 数据库无数据，抓取第三方...');
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // 检查 Key 是否存在，方便调试
    if (!accessKey) {
      throw new Error('Missing UNSPLASH_ACCESS_KEY');
    }

    const icibaUrlWithDate = req.query.date ? `${ICIBA_URL}?date=${targetDate}` : ICIBA_URL;

    const [icibaRes, unsplashRes] = await Promise.allSettled([
      axios.get(icibaUrlWithDate),
      axios.get(UNSPLASH_URL, { headers: { Authorization: `Client-ID ${accessKey}` } })
    ]);

    let icibaData = {};
    let unsplashData = null;

    if (icibaRes.status === 'fulfilled') icibaData = icibaRes.value.data;
    if (unsplashRes.status === 'fulfilled') unsplashData = unsplashRes.value.data;

    const finalData = {
      date: targetDate,
      english: icibaData.content || 'No content.',
      chinese: icibaData.note || '暂无内容',
      audio: icibaData.tts,
      backgroundImage: unsplashData ? unsplashData.urls.regular : icibaData.picture2,
      photographer: unsplashData ? unsplashData.user.name : '',
      photographerUrl: unsplashData ? unsplashData.user.links.html : '',
      updateTime: new Date().toISOString()
    };

    // 【入库】
    await sql`
      INSERT INTO quotes (date, data)
      VALUES (${targetDate}, ${finalData})
      ON CONFLICT (date)
      DO UPDATE SET data = ${finalData};
    `;

    res.status(200).json(finalData);

  } catch (error) {
    console.error('Server Error:', error);
    // 返回详细错误堆栈，方便你在网页上直接看报错
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};
