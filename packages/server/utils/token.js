import axios from 'axios'

// 存储token
let token = null

export default class TokenUtil {
  static async getToken() {
    try {
      const response = await axios.get('https://app.mi.com', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      // 从响应中提取token
      const tokenMatch = response.data.match(/token:\s*["']([^"']+)["']/)
      if (tokenMatch) {
        token = tokenMatch[1]
        console.log('获取到token:', token)
      }
    } catch (error) {
      console.error('获取token失败:', error)
    }
  }
}
