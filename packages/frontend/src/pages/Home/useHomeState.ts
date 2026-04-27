import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useRequest, useSetState, useLocalStorageState } from 'ahooks';
import type { AppEntity } from '@/entities/app';
import type { PageEntity } from '@/entities/page';
import API from '@/services';
import { notify } from '@/utils/notify';
import { useAppType } from '@/contexts/AppTypeContext';

type IState = {
  keyword: string;
  apps: AppEntity.Item[];
  currentAppType?: string;
  currentApp?: AppEntity.Item;
  pagination: PageEntity.PagePagination;
  open: boolean;
  importJsonOpen: boolean;
  typeOpen: boolean;
  harmonyIconSingleOpen: boolean;
  harmonyIconFolderOpen: boolean;
  pngVectorizerOpen: boolean;
  logOpen: boolean;
  huaweiIconCheckerOpen: boolean;
  edit: boolean;
};

export function useHomeState() {
  const location = useLocation();
  const navigate = useNavigate();

  const [displayMode, setDisplayMode] = useLocalStorageState<
    'grid1' | 'grid2' | 'grid3' | 'grid4'
  >('app-display-mode', {
    defaultValue: 'grid1',
  });

  const pageSize = displayMode === 'grid3' || displayMode === 'grid4' ? 24 : 21;

  // 用 ref 保存 pageSize，避免 handler 依赖它导致频繁重建
  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  const [state, setState] = useSetState<IState>({
    keyword: '',
    apps: [],
    currentAppType: '全部',
    currentApp: undefined,
    pagination: {
      current: 1,
      pageSize: pageSize,
      total: 0,
      pages: 0,
    },
    open: false,
    importJsonOpen: false,
    typeOpen: false,
    harmonyIconSingleOpen: false,
    harmonyIconFolderOpen: false,
    pngVectorizerOpen: false,
    logOpen: false,
    huaweiIconCheckerOpen: false,
    edit: false,
  });

  const { state: appTypeState, refreshAppTypes } = useAppType();

  const appTypesWithAll = useMemo(() => {
    const sortedTypes = [...appTypeState.appTypes].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    );
    return sortedTypes.length > 0
      ? [{ type_name: '全部', id: '全部', sort: -1, app_count: 0 }, ...sortedTypes]
      : [{ type_name: '全部', id: '全部', sort: -1, app_count: 0 }];
  }, [appTypeState.appTypes]);

  // 用 ref 保存最新的 appTypesWithAll，避免 mutation
  const appTypesWithAllRef = useRef(appTypesWithAll);
  appTypesWithAllRef.current = appTypesWithAll;

  // 用 ref 保存最新 state，避免 handler 依赖 state 导致频繁重建
  const stateRef = useRef(state);
  stateRef.current = state;

  const searchAppsReq = useRequest(API.appSearch, {
    debounceWait: 600,
    onSuccess(res) {
      setState({
        apps: res.data,
        pagination: {
          current: res.current,
          pageSize: res.pageSize,
          total: res.total,
          pages: res.pages,
        },
      });
    },
  });

  // 用 ref 保存 searchAppsReq，避免 handler 依赖它
  const searchAppsReqRef = useRef(searchAppsReq);
  searchAppsReqRef.current = searchAppsReq;

  const deleteReq = useRequest(API.deleteApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        searchAppsReq.refresh();
        if (stateRef.current.open) {
          setState({ currentApp: undefined, open: false });
        }
      } else {
        notify(res.message);
      }
    },
  });

  const deleteReqRef = useRef(deleteReq);
  deleteReqRef.current = deleteReq;

  const prevSearchRef = useRef(location.search);

  // 从URL参数中读取搜索条件
  useEffect(() => {
    if (location.search !== prevSearchRef.current) {
      const params = new URLSearchParams(location.search);
      const keyword = params.get('keyword') || '';
      const type = params.get('type') || '全部';
      setState({ keyword, currentAppType: type });
      prevSearchRef.current = location.search;
    }
  }, [location.search]);

  // 当搜索条件变化时更新URL参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (state.keyword) params.set('keyword', state.keyword);
    if (state.currentAppType && state.currentAppType !== '全部') {
      params.set('type', state.currentAppType);
    }
    const searchString = params.toString();
    if (searchString !== prevSearchRef.current) {
      navigate({ search: searchString }, { replace: true });
      prevSearchRef.current = searchString;
    }
  }, [state.keyword, state.currentAppType, navigate]);

  // 当显示模式或搜索条件改变时，重新发起搜索请求
  useEffect(() => {
    searchAppsReq.run({
      keyword: state.keyword,
      typeName: state.currentAppType,
      pageSize: pageSize,
    });
  }, [displayMode, pageSize, state.keyword, state.currentAppType]);

  const handleSearch = useCallback((v: string) => {
    setState({ keyword: v });
    searchAppsReqRef.current.run({
      keyword: v,
      typeName: stateRef.current.currentAppType,
      pageSize: pageSizeRef.current,
    });
  }, [setState]);

  const handleOpenAppDetail = useCallback((app?: AppEntity.Item, edit?: boolean) => {
    setState({ currentApp: app, open: true, edit: edit || false });
  }, [setState]);

  const handleDeleteApp = useCallback((id: string) => {
    deleteReqRef.current.run({ id });
  }, []);

  const handleTypeChange = useCallback((v: string) => {
    setState({ currentAppType: v });
    searchAppsReqRef.current.run({
      keyword: stateRef.current.keyword,
      current: 1,
      typeName: v,
      pageSize: pageSizeRef.current,
    });
  }, [setState]);

  const handlePageChange = useCallback((current: number) => {
    searchAppsReqRef.current.run({
      keyword: stateRef.current.keyword,
      current,
      typeName: stateRef.current.currentAppType,
      pageSize: pageSizeRef.current,
    });
  }, []);

  const handleCloseAppDetail = useCallback(() => {
    setState({ currentApp: undefined, open: false });
  }, [setState]);

  const handleRefreshSearch = useCallback(() => {
    searchAppsReqRef.current.refresh();
  }, []);

  const handleRefreshAll = useCallback(() => {
    searchAppsReqRef.current.refresh();
    refreshAppTypes();
  }, [refreshAppTypes]);

  return {
    state,
    setState,
    displayMode,
    setDisplayMode,
    appTypesWithAll,
    searchAppsReq,
    handleSearch,
    handleOpenAppDetail,
    handleDeleteApp,
    handleTypeChange,
    handlePageChange,
    handleCloseAppDetail,
    handleRefreshSearch,
    handleRefreshAll,
    refreshAppTypes,
  };
}
