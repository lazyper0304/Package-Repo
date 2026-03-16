import type { AppEntity } from '@/entities/app'
import type { PageEntity } from '@/entities/page'

export default class API {
  /** 搜索应用 */
  static async searchApps(
    params?: {
      keyword: string
    } & PageEntity.PageParam,
  ): Promise<PageEntity.PageResponse<AppEntity.Item>> {
    try {
      const query = new URLSearchParams()

      query.append('keyword', params?.keyword ?? '')

      if (params?.current) {
        query.append('current', params.current.toString())
      }

      if (params?.pageSize) {
        query.append('pageSize', params.pageSize.toString())
      }

      const response = await fetch(`/api/search-apps?${query}`)

      // 检查响应是否成功
      if (!response.ok) {
        console.error('搜索失败:', response.status)
        return {
          current: 1,
          data: [],
          pageSize: 0,
          total: 0,
          pages: 0,
        }
      }

      // 尝试解析JSON
      let res
      try {
        res = await response.json()
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError)
        return {
          current: res.current,
          data: [],
          pageSize: res.pageSize,
          total: res.total,
          pages: res.pages,
        }
      }

      if (res.success) {
        return {
          current: res.current,
          data: res.data.map((item) => ({
            id: item.id,
            appName: item.app_name,
            androidPackageName: item.android_package,
            harmonyPackageName: item.harmony_package,
            iconUrl: item.icon_url,
            type: item.type,
          })),
          pageSize: res.pageSize,
          total: res.total,
          pages: res.pages,
        }
      } else {
        console.error('搜索失败:', res.error)
        return {
          current: res.current,
          data: [],
          pageSize: res.pageSize,
          total: res.total,
          pages: res.pages,
        }
      }
    } catch (error) {
      console.error('搜索错误:', error)
      return {
        current: 1,
        data: [],
        pageSize: 0,
        total: 0,
        pages: 0,
      }
    }
  }

  static async getAppleStoreIcon(params: { appName: string }): Promise<string | null> {
    try {
      if (!params.appName) {
        console.error('获取苹果应用商店图标失败: 应用名称为空')
        return null
      }

      const query = new URLSearchParams()

      query.append('appName', params.appName)

      const response = await fetch(`/api/apple-store-icon?${query}`)

      // 检查响应是否成功
      if (!response.ok) {
        console.error('获取苹果应用商店图标失败:', response.status)
        return null
      }

      // 尝试解析JSON
      let result
      try {
        result = await response.json()
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError)
        return null
      }

      if (result.success) {
        return result.iconUrl
      } else {
        console.error('获取苹果应用商店图标失败:', result.error)
      }
    } catch (error) {
      console.error('获取苹果应用商店图标失败:', error)
    }
    return null
  }

  // 加载应用列表
  static async loadAppsFromDatabase() {
    try {
      const response = await fetch('/api/apps')
      const result = await response.json()

      if (result.success) {
        return result.data.map((item) => ({
          id: item.id,
          name: item.app_name,
          harmonyPackage: item.harmony_package,
          androidPackage: item.android_package,
          createdAt: item.created_at,
        }))
      } else {
        console.error('加载应用列表失败:', result.error)
        return []
      }
    } catch (error) {
      console.error('加载应用列表失败:', error)
      return []
    }
  }

  // 添加应用
  static async addApp(params: {
    appName: string
    harmonyPackageName?: string
    androidPackageName?: string
    iconUrl?: string
  }) {
    try {
      const response = await fetch('/api/app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return { success: true, message: result.message }
      } else {
        return { success: false, message: result.error || '添加失败' }
      }
    } catch (error) {
      console.error('Error adding app:', error)
      return { success: false, message: '网络错误，无法连接到服务器' }
    }
  }

  // 删除应用
  static async deleteApp(params: { id: string }) {
    try {
      const response = await fetch(`/api/app`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return { success: true, message: result.message }
      } else {
        return { success: false, message: result.error || '删除失败' }
      }
    } catch (error) {
      console.error('Error deleting app:', error)
      return { success: false, message: '网络错误，无法连接到服务器' }
    }
  }

  static async updateApp(params: {
    id: string
    appName?: string
    iconUrl?: string
    androidPageName?: string
    harmonyPackageName?: string
    type?: string
  }) {
    try {
      const response = await fetch(`/api/app`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return { success: true, message: result.message }
      } else {
        return { success: false, message: result.error || 'app更新失败' }
      }
    } catch (error) {
      console.error('Error Updating icon:', error)
      return { success: false, message: '网络错误，无法连接到服务器' }
    }
  }

  static async uploadExcel(params: FormData) {
    try {
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: params,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return {
          success: true,
          successCount: result.successCount,
          errorCount: result.errorCount,
          duplicateCount: result.duplicateCount,
          message: result.message,
        }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      return { success: false, message: error }
    }
  }

  static async harmonyIcon(params: FormData) {
    const response = await fetch('/api/harmony-icon', {
      method: 'POST',
      body: params,
    })

    if (response.ok) {
      const result = await response.json()

      if (result.success) {
        return { success: true, bgUrl: result.bgUrl, fgUrl: result.fgUrl }
      } else {
        return { success: false }
      }
    } else {
      try {
        const result = await response.json()

        return { success: false, message: result.error }
      } catch (e) {
        return { success: false, message: e }
      }
    }
  }
}
