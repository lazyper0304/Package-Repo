import { useRequest } from 'ahooks';
import { notify } from '@/utils/notify';

type ApiResult = {
  success: boolean;
  message?: string;
  [key: string]: any;
};

type Options<T extends ApiResult> = {
  onSuccess?: (res: T) => void;
  onError?: (error: Error) => void;
  manual?: boolean;
  debounceWait?: number;
  [key: string]: any;
};

/**
 * 包装 ahooks useRequest，自动处理 res.success 判断和 notify 错误提示
 */
export function useApiRequest<T extends ApiResult>(
  apiFn: (...args: any[]) => Promise<T>,
  options: Options<T> = {}
) {
  const { onSuccess, onError, ...restOptions } = options;

  return useRequest(apiFn, {
    manual: true,
    ...restOptions,
    onSuccess(res) {
      if (res.success) {
        onSuccess?.(res);
      } else {
        notify(res.message || '操作失败');
      }
    },
    onError(error) {
      console.error('API Error:', error);
      notify('网络错误，请稍后重试');
      onError?.(error);
    },
  });
}
