import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')

    if (!Taro.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      // 🟢 核心代码在这里：初始化云开发
      Taro.cloud.init({
        // env: '你的环境ID', // 如果有多个环境，这里填具体的环境ID，否则填 'test' 或不填默认取第一个
        traceUser: true,
      })
      console.log('✅ 云开发初始化成功')
    }
  })

  // children 是将要会渲染的页面
  return children
}



export default App
