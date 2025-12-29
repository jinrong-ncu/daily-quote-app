import { useEffect, useState, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import './index.scss' // 样式还是用之前的那个 scss，不用变

// 1. 定义数据接口 (TypeScript 的灵魂)
interface DailyQuote {
  _id?: string;
  date: string;
  english: string;
  chinese: string;
  backgroundImage: string;
  imageColor?: string;
  photographer?: string;
  photographerUrl?: string;
  audio?: string;
  [key: string]: any; // 允许其他字段
}



export default function Index() {
  // 给 useState 加上泛型 <DailyQuote | null>
  const [daily, setDaily] = useState<DailyQuote | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  // 定义 useRef 的类型
  const audioCtx = useRef<Taro.InnerAudioContext | null>(null)

  // 获取路由参数
  const router = useRouter()

  useEffect(() => {
    // 初始化音频
    audioCtx.current = Taro.createInnerAudioContext()
    audioCtx.current.onEnded(() => setIsPlaying(false))
    audioCtx.current.onError((res) => console.error('播放报错', res))

    fetchData()

    return () => {
      audioCtx.current?.destroy()
    }
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const db = Taro.cloud.database()
    try {

      const { id } = router.params

      if (id) {
        // 这种情况是：从历史列表跳过来的
        console.log('正在查看往期内容:', id)
        const res = await db.collection('daily_sentences').doc(id).get({})
        setDaily(res.data as DailyQuote)
      } else {
        // 1. 获取今天的日期字符串 YYYY-MM-DD
        const now = new Date()
        const y = now.getFullYear()
        const m = (now.getMonth() + 1).toString().padStart(2, '0')
        const d = now.getDate().toString().padStart(2, '0')
        const todayStr = `${y}-${m}-${d}`

        // 2. 查数据库看看今天的是否已经存在
        const res = await db.collection('daily_sentences')
          .where({
            date: todayStr
          })
          .get()

        if (res.data.length > 0) {
          console.log('命中缓存，直接使用:', todayStr)
          setDaily(res.data[0] as DailyQuote)
        } else {
          console.log('今日暂无缓存，呼叫云函数抓取...')
          const callRes = await Taro.cloud.callFunction({
            name: 'getDailyQuote',
          })

          const resultData = (callRes.result as any)?.data
          if (resultData) {
            setDaily(resultData as DailyQuote)
          }
        }
      }
    } catch (err) {
      console.error('获取失败', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const playAudio = () => {
    if (!daily?.audio || !audioCtx.current) return

    if (isPlaying) {
      audioCtx.current.pause()
      setIsPlaying(false)
    } else {
      audioCtx.current.src = daily.audio
      audioCtx.current.play()
      setIsPlaying(true)
    }
  }

  if (loading) {
    return (
      <View className='container loading'>
        <Text>Loading inspiration...</Text>
      </View>
    )
  }

  if (!daily) return <View className='container'>暂无数据</View>

  return (
    <View className='container'>
      <View
        className='history-btn'
        onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}
      >
        <Text>📅 History</Text>
      </View>
      <Image
        className='bg-image'
        src={daily.backgroundImage}
        mode='aspectFill'
      />
      <View className='overlay' />

      <View className='content-wrapper'>
        <Text className='date'>{daily.date}</Text>
        <Text className='english'>{daily.english}</Text>
        <View className='chinese-box'>
          <Text className='chinese'>{daily.chinese}</Text>
        </View>

        <View className='actions'>
          <View className='play-btn' onClick={playAudio}>
            <Text className='icon'>{isPlaying ? '⏸' : '🔊'}</Text>
            <Text className='label'>Play Audio</Text>
          </View>
        </View>

        <View className='footer'>
          <Text className='photographer'>
            Photo by {daily.photographer || 'Unsplash'} on Unsplash
          </Text>
        </View>
      </View>
    </View>
  )
}
