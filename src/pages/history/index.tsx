import React, { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import './index.scss'

interface HistoryItem {
    _id: string;
    date: string;
    english: string;
    backgroundImage: string;
}

export default function HistoryPage() {
    const [list, setList] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        const db = Taro.cloud.database()
        try {
            // 获取列表，按日期倒序，限制 20 条
            const res = await db.collection('daily_sentences')
                .orderBy('created_at', 'desc')
                .limit(20)
                .field({
                    _id: true,
                    date: true,
                    english: true,
                    backgroundImage: true
                }) // 只取需要的字段，节省流量
                .get()

            setList(res.data as HistoryItem[])
        } catch (err) {
            console.error(err)
            Taro.showToast({ title: '加载失败', icon: 'none' })
        } finally {
            setLoading(false)
        }
    }

    const goDetail = (id: string) => {
        // 跳转回首页，带上 id 参数
        Taro.navigateTo({
            url: `/pages/index/index?id=${id}`
        })
    }

    return (
        <View className='history-container'>
            <View className='header'>
                <Text className='title'>Past Quotes</Text>
            </View>

            {list.map(item => (
                <View key={item._id} className='card' onClick={() => goDetail(item._id)}>
                    {/* 左侧小图 */}
                    <Image className='thumb' src={item.backgroundImage} mode='aspectFill' />

                    {/* 右侧文字 */}
                    <View className='info'>
                        <Text className='date'>{item.date}</Text>
                        <Text className='english-preview'>{item.english}</Text>
                    </View>
                </View>
            ))}

            {list.length === 0 && !loading && (
                <View className='empty'>暂无历史记录</View>
            )}
        </View>
    )
}