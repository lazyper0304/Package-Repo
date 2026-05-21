import type { AppEntity } from '@/entities/app';
import type { PageEntity } from '@/entities/page';
import { HttpClient } from './httpClient';

export default class API {
  /** 搜索应用 */
  static async appSearch(
    params?: {
      typeName?: string;
      keyword: string;
    } & PageEntity.PageParam
  ): Promise<PageEntity.PageResponse<AppEntity.Item>> {
    try {
      // 过滤参数
      const filteredParams = {
        keyword: params?.keyword ?? '',
        current: params?.current,
        pageSize: params?.pageSize,
        typeName: params?.typeName && params.typeName !== '全部' ? params.typeName : undefined,
      };

      const res = await HttpClient.get<{
        success: boolean;
        data: any[];
        current: number;
        pageSize: number;
        total: number;
        pages: number;
        error?: string;
      }>('/api/app/search', filteredParams);

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
            desc: item.desc,
          })),
          pageSize: res.pageSize,
          total: res.total,
          pages: res.pages,
        };
      } else {
        console.error('搜索失败:', res.error);
        return {
          current: res.current || 1,
          data: [],
          pageSize: res.pageSize || 0,
          total: res.total || 0,
          pages: res.pages || 0,
        };
      }
    } catch (error) {
      console.error('搜索错误:', error);
      return {
        current: 1,
        data: [],
        pageSize: 0,
        total: 0,
        pages: 0,
      };
    }
  }

  static async getAppleStoreIcon(params: {
    appName: string;
  }): Promise<string | null> {
    try {
      if (!params.appName) {
        console.error('获取苹果应用商店图标失败: 应用名称为空');
        return null;
      }

      const result = await HttpClient.get<{
        success: boolean;
        iconUrl: string;
        error?: string;
      }>('/api/app/apple-store-icon', params);

      if (result.success) {
        return result.iconUrl;
      } else {
        console.error('获取苹果应用商店图标失败:', result.error);
      }
    } catch (error) {
      console.error('获取苹果应用商店图标失败:', error);
    }
    return null;
  }

  // 添加应用
  static async addApp(params: {
    appName: string;
    harmonyPackageName?: string;
    androidPackageName?: string;
    iconUrl?: string;
    type?: string;
  }) {
    try {
      const result = await HttpClient.post<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app', params);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || '添加失败' };
      }
    } catch (error) {
      console.error('Error adding app:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  // 删除应用
  static async deleteApp(params: { id: string }) {
    try {
      const result = await HttpClient.delete<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app', params);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || '删除失败' };
      }
    } catch (error) {
      console.error('Error deleting app:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  static async updateApp(params: {
    id: string;
    appName?: string;
    iconUrl?: string;
    androidPageName?: string;
    harmonyPackageName?: string;
    type?: string;
  }) {
    try {
      const result = await HttpClient.put<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app', params);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || 'app更新失败' };
      }
    } catch (error) {
      console.error('Error Updating icon:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  static async appTypeList() {
    try {
      const result = await HttpClient.get<{
        success: boolean;
        data: any[];
        error?: string;
      }>('/api/app-types/list');

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, data: [] };
      }
    } catch (error) {
      console.error('获取应用类型失败:', error);
      return { success: false, data: [], message: error };
    }
  }

  static async addAppType(params: { typeName: string; sort?: number }) {
    try {
      const result = await HttpClient.post<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app-types', params);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || '分类创建失败' };
      }
    } catch (error) {
      console.error('Error Updating icon:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  static async deleteAppType(params: { id: string }) {
    try {
      const result = await HttpClient.delete<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app-types', params);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || '分类更新失败' };
      }
    } catch (error) {
      console.error('Error Updating icon:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  static async updateAppType(params: {
    id: string;
    typeName: string;
    sort?: number;
  }) {
    try {
      const result = await HttpClient.put<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app-types', params);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || '分类删除失败' };
      }
    } catch (error) {
      console.error('Error Updating icon:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  // 根据类型获取应用
  static async getAppsByType(params: { typeName: string }) {
    try {
      const result = await HttpClient.get<{
        success: boolean;
        data: any[];
        error?: string;
      }>('/api/app/by-type', params);

      if (result.success) {
        return {
          success: true,
          data: result.data.map((item) => ({
            app_name: item.app_name,
            package_name: item.harmony_package || item.android_package || '',
          })),
        };
      } else {
        console.error('获取应用失败:', result.error);
        return { success: false, data: [] };
      }
    } catch (error) {
      console.error('获取应用错误:', error);
      return { success: false, data: [] };
    }
  }

  // 导入JSON数据
  static async importJson(params: FormData) {
    try {
      // 特殊处理FormData请求
      const response = await HttpClient.request<{
        success: boolean;
        message: string;
        error?: string;
      }>('/api/app/import-json', {
        method: 'POST',
        body: params,
      });

      if (response.success) {
        return {
          success: true,
          message: response.message,
        };
      } else {
        return { success: false, message: response.error || '上传失败' };
      }
    } catch (error) {
      console.error('导入JSON错误:', error);
      return { success: false, message: '网络错误，无法连接到服务器' };
    }
  }

  // 获取访问日志统计
  static async getVisitStats() {
    try {
      const result = await HttpClient.get<{
        success: boolean;
        total: number;
        todayCount: number;
        data: any[];
        error?: string;
        message?: string;
      }>('/api/visit/logs');

      if (result.success) {
        const total = result.total || 0;
        const today = result.todayCount || 0;

        return { success: true, total, today };
      } else {
        console.error('获取访问日志失败:', result.message || result.error);
        return { success: false, total: 0, today: 0 };
      }
    } catch (error) {
      console.error('获取访问日志错误:', error);
      return { success: false, total: 0, today: 0 };
    }
  }
}
