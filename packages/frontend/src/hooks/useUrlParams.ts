import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

export function useUrlParams<T extends Record<string, string>>() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useState<T>({} as T);

  // 从URL读取参数
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const newParams = {} as T;
    
    urlParams.forEach((value, key) => {
      (newParams as any)[key] = value;
    });
    
    setParams(newParams);
  }, [location.search]);

  // 更新URL参数
  const updateParams = (newParams: Partial<T>) => {
    const urlParams = new URLSearchParams();
    
    // 保留现有参数，只更新指定的参数
    Object.entries({ ...params, ...newParams }).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value);
      }
    });
    
    navigate({ search: urlParams.toString() }, { replace: true });
  };

  return [params, updateParams] as const;
}