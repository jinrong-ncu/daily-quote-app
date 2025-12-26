// 引入微信服务端 SDK
const cloud = require('wx-server-sdk')
const axios = require('axios') // 云函数里通常用 axios 比较稳，或者用 node-fetch

// 初始化云环境
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 你的配置
const ICIBA_URL = 'http://open.iciba.com/dsapi/';
const UNSPLASH_URL = 'https://api.unsplash.com/photos/random?query=nature,minimalism&orientation=portrait';
const UNSPLASH_ACCESS_KEY = 'GZFyasS5baDi8AMsrXYUFVf4QJ3sa41kh6HwcUhFzL4'; // 🔴 记得填

exports.main = async (event, context) => {
  try {
    // 1. 查重：先看看数据库里今天是不是已经存过了？防止重复运行
    // 我们用今天的日期作为标记，比如 '2023-10-27'
    // 获取当前日期字符串 (注意时区，云函数默认是 UTC+0，需要转成北京时间)
    const date = new Date()
    date.setHours(date.getHours() + 8) 
    const dateStr = date.toISOString().split('T')[0] // 2023-10-27

    const checkRes = await db.collection('daily_sentences')
      .where({ date: dateStr })
      .get()
    
    if (checkRes.data.length > 0) {
      return { msg: '今天的数据已经存在了，无需重复获取', data: checkRes.data[0] }
    }

    // 2. 并行请求 API (跟你的脚本逻辑一样)
    // 注意：云函数环境可能需要 npm install axios
    const [icibaRes, unsplashRes] = await Promise.all([
      axios.get(ICIBA_URL),
      axios.get(UNSPLASH_URL, { headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` } })
    ])

    const icibaData = icibaRes.data
    const unsplashData = unsplashRes.data

    // 3. 拼装数据
    const finalData = {
      date: icibaData.dateline, // 金山返回的日期 2023-10-27
      english: icibaData.content,
      chinese: icibaData.note,
      audio: icibaData.tts,
      backgroundImage: unsplashData.urls.regular,
      imageColor: unsplashData.color,
      photographer: unsplashData.user.name,
      photographerUrl: unsplashData.user.links.html,
      originalImage: icibaData.picture2,
      created_at: db.serverDate() // 加上入库时间
    }

    // 4. 存入数据库 (核心步骤)
    await db.collection('daily_sentences').add({
      data: finalData
    })

    return { msg: '抓取并存储成功', data: finalData }

  } catch (err) {
    console.error(err)
    return { error: err.message }
  }
}