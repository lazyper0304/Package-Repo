import type { AppEntity } from '@/entities/app'
import type { PageEntity } from '@/entities/page'

export default class API {
  /** 搜索应用 */
  static async appSearch(
    params?: {
      typeName?: string
      keyword: string
    } & PageEntity.PageParam,
  ): Promise<PageEntity.PageResponse<AppEntity.Item>> {
    try {
      const query = new URLSearchParams()

      query.append('keyword', params?.keyword ?? '')

      if (params?.typeName && params.typeName !== '全部') {
        query.append('typeName', params.typeName.toString())
      }

      if (params?.current) {
        query.append('current', params.current.toString())
      }

      if (params?.pageSize) {
        query.append('pageSize', params.pageSize.toString())
      }

      const response = await fetch(`/api/app/search?${query}`)

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

      const response = await fetch(`/api/app/apple-store-icon?${query}`)

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

  // 添加应用
  static async addApp(params: {
    appName: string
    harmonyPackageName?: string
    androidPackageName?: string
    iconUrl?: string
    type?: string
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

  static async excelUpload(params: FormData) {
    try {
      const response = await fetch('/api/excel/upload', {
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
    const response = await fetch('/api/excel/harmony-icon', {
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

  static async appTypeList() {
    const response = await fetch('/api/app-types/list', {
      method: 'GET',
    })

    if (response.ok) {
      const result = await response.json()

      if (result.success) {
        return { success: true, data: result.data }
      } else {
        return { success: false, data: [] }
      }
    } else {
      try {
        const result = await response.json()

        return { success: false, data: [], message: result.error }
      } catch (e) {
        return { success: false, data: [], message: e }
      }
    }
  }

  static async addAppType(params: { typeName: string }) {
    try {
      const response = await fetch(`/api/app-types`, {
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
        return { success: false, message: result.error || '分类创建失败' }
      }
    } catch (error) {
      console.error('Error Updating icon:', error)
      return { success: false, message: '网络错误，无法连接到服务器' }
    }
  }

  static async deleteAppType(params: { id: string }) {
    try {
      const response = await fetch(`/api/app-types`, {
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
        return { success: false, message: result.error || '分类更新失败' }
      }
    } catch (error) {
      console.error('Error Updating icon:', error)
      return { success: false, message: '网络错误，无法连接到服务器' }
    }
  }

  static async updateAppType(params: {
    id: string
    appName?: string
    iconUrl?: string
    androidPageName?: string
    harmonyPackageName?: string
    type?: string
  }) {
    try {
      const response = await fetch(`/api/app-types`, {
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
        return { success: false, message: result.error || '分类删除失败' }
      }
    } catch (error) {
      console.error('Error Updating icon:', error)
      return { success: false, message: '网络错误，无法连接到服务器' }
    }
  }
}
