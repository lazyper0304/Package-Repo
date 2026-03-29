import React, { createContext, useContext, useReducer, useEffect } from 'react';
import API from '@/services';
import type { AppTypeEntity } from '@/entities/appType';

// 定义状态类型
interface AppTypeState {
  appTypes: AppTypeEntity.ListItem[];
  loading: boolean;
  error: string | null;
}

// 定义动作类型
type AppTypeAction =
  | { type: 'FETCH_APP_TYPES_START' }
  | { type: 'FETCH_APP_TYPES_SUCCESS'; payload: AppTypeEntity.ListItem[] }
  | { type: 'FETCH_APP_TYPES_FAILURE'; payload: string }
  | { type: 'UPDATE_APP_TYPES'; payload: AppTypeEntity.ListItem[] };

// 初始状态
const initialState: AppTypeState = {
  appTypes: [],
  loading: false,
  error: null,
};

// Reducer 函数
function appTypeReducer(
  state: AppTypeState,
  action: AppTypeAction
): AppTypeState {
  switch (action.type) {
    case 'FETCH_APP_TYPES_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_APP_TYPES_SUCCESS':
      return { ...state, loading: false, appTypes: action.payload };
    case 'FETCH_APP_TYPES_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_APP_TYPES':
      return { ...state, appTypes: action.payload };
    default:
      return state;
  }
}

// 定义 Context 类型
interface AppTypeContextType {
  state: AppTypeState;
  refreshAppTypes: () => Promise<void>;
}

// 创建 Context
const AppTypeContext = createContext<AppTypeContextType | undefined>(undefined);

// Provider 组件
interface AppTypeProviderProps {
  children: React.ReactNode;
}

export function AppTypeProvider({ children }: AppTypeProviderProps) {
  const [state, dispatch] = useReducer(appTypeReducer, initialState);

  // 刷新应用类型列表
  const refreshAppTypes = async () => {
    dispatch({ type: 'FETCH_APP_TYPES_START' });
    try {
      const response = await API.appTypeList();
      if (response.success) {
        dispatch({ type: 'FETCH_APP_TYPES_SUCCESS', payload: response.data });
      } else {
        dispatch({
          type: 'FETCH_APP_TYPES_FAILURE',
          payload: '获取应用类型失败',
        });
      }
    } catch {
      dispatch({ type: 'FETCH_APP_TYPES_FAILURE', payload: '网络错误' });
    }
  };

  // 初始加载
  useEffect(() => {
    refreshAppTypes();
  }, []);

  const value = {
    state,
    refreshAppTypes,
  };

  return (
    <AppTypeContext.Provider value={value}>{children}</AppTypeContext.Provider>
  );
}

// 自定义 Hook
export function useAppType() {
  const context = useContext(AppTypeContext);
  if (context === undefined) {
    throw new Error('useAppType must be used within an AppTypeProvider');
  }
  return context;
}
