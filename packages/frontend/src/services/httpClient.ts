export class HttpClient {
  /**
   * 基础请求方法
   */
  static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      // 检查响应是否成功
      if (!response.ok) {
        console.error('请求失败:', response.status);
        throw new Error(`请求失败: ${response.status}`);
      }

      // 尝试解析JSON
      try {
        const data = await response.json();
        return data as T;
      } catch (jsonError) {
        console.error('JSON解析错误:', jsonError);
        throw new Error('JSON解析错误');
      }
    } catch (error) {
      console.error('网络错误:', error);
      throw error;
    }
  }

  /**
   * GET请求
   */
  static async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    let finalUrl = url;
    
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        finalUrl += `?${queryString}`;
      }
    }

    return this.request<T>(finalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * POST请求
   */
  static async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT请求
   */
  static async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  static async delete<T>(url: string, data?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 处理响应结果
   */
  static handleResponse<T>(response: any, defaultData: T): T {
    if (response && response.success) {
      return response.data || defaultData;
    } else {
      console.error('请求失败:', response?.error || '未知错误');
      return defaultData;
    }
  }
}
