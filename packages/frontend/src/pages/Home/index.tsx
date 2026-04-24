import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import styles from './index.module.less';
import { Button, Flex, IconButton } from '@radix-ui/themes';
import type { AppEntity } from '@/entities/app';
import API from '@/services';
import { useRequest, useSetState, useLocalStorageState } from 'ahooks';
import AppDetail from '@/components/AppDetail';
import type { PageEntity } from '@/entities/page';
import HarmonyIconSingle from '@/components/HarmonyIconSingle';
import HarmonyIconFolder from '@/components/HarmonyIconFolder';
import ImageVectorizer from '@/components/ImageVectorizer';
import { GradientBackground } from 'react-gradient-animation';
import TypeManage from '@/components/TypeManage';
import LogViewer from '@/components/LogViewer';
import HuaweiIconChecker from '@/components/HuaweiIconChecker';
import ImportJson from '@/components/ImportJson';
import Footer from './Footer';
import { notify } from '@/utils/notify';
import { useAppType } from '@/contexts/AppTypeContext';
import useMobile from '@/hooks/useMobile';

import {
  MdBrightness2,
  MdBrightnessAuto,
  MdBrightnessHigh,
  MdChevronRight,
  MdFilterList,
} from 'react-icons/md';

const SearchResult = React.lazy(() => import('./SearchResult'));
const SearchForm = React.lazy(() => import('./SearchForm'));

type ThemeMode = 'light' | 'dark' | 'system';

type IProps = Readonly<{
  isAdmin?: boolean;
  themeMode?: ThemeMode;
  setThemeMode?: (value: ThemeMode) => void;
}>;

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

const Home: React.FC<IProps> = ({
  isAdmin = false,
  themeMode,
  setThemeMode,
}) => {
  const isMobile = useMobile();
  const location = useLocation();
  const navigate = useNavigate();

  // 显示模式：grid1（一行一个）、grid2（一行两个）、grid3（一行三个）、grid4（一行四个）
  const [displayMode, setDisplayMode] = useLocalStorageState<
    'grid1' | 'grid2' | 'grid3' | 'grid4'
  >('app-display-mode', {
    defaultValue: 'grid1',
  });

  // 功能展开状态
  const [functionsExpanded, setFunctionsExpanded] = useState(false);

  // 根据显示模式计算 pageSize
  const pageSize = displayMode === 'grid3' || displayMode === 'grid4' ? 24 : 21;

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

  // 获取带"全部"选项的应用类型列表，并按 sort 排序
  const appTypesWithAll = useMemo(() => {
    const sortedTypes = [...appTypeState.appTypes].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    );
    return sortedTypes.length > 0
      ? [{ type_name: '全部', id: '全部', sort: -1 }, ...sortedTypes]
      : [{ type_name: '全部', id: '全部', sort: -1 }];
  }, [appTypeState.appTypes]);

  const searchAppsReq = useRequest(API.appSearch, {
    debounceWait: 600,
    onSuccess(res) {
      const index = appTypesWithAll.findIndex((item) => item.id === '全部');

      if (index !== -1 && state.keyword === '') {
        appTypesWithAll[index].app_count = res.total;
      }

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

  // 用于跟踪上一次的搜索条件，避免循环更新
  const prevSearchRef = React.useRef<string>(location.search);

  // 从URL参数中读取搜索条件
  useEffect(() => {
    // 只有当URL参数真正变化时才处理，避免循环更新
    if (location.search !== prevSearchRef.current) {
      const params = new URLSearchParams(location.search);
      const keyword = params.get('keyword') || '';
      const type = params.get('type') || '全部';

      setState({
        keyword,
        currentAppType: type,
      });

      // 更新引用
      prevSearchRef.current = location.search;
    }
  }, [location.search]);

  // 当搜索条件变化时更新URL参数
  useEffect(() => {
    const params = new URLSearchParams();
    if (state.keyword) {
      params.set('keyword', state.keyword);
    }
    if (state.currentAppType && state.currentAppType !== '全部') {
      params.set('type', state.currentAppType);
    }

    const searchString = params.toString();

    // 只在搜索条件变化时更新URL，避免无限循环
    if (searchString !== prevSearchRef.current) {
      // 使用replace方法避免在浏览器历史中创建太多条目
      navigate({ search: searchString }, { replace: true });

      // 更新引用
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

  const deleteReq = useRequest(API.deleteApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        searchAppsReq.refresh();
        // 如果详情弹窗是打开的，关闭它
        if (state.open) {
          setState({ currentApp: undefined, open: false });
        }
      } else {
        notify(res.message);
      }
    },
  });

  async function handleSearch(v: string) {
    setState({ keyword: v });

    searchAppsReq.run({
      keyword: v,
      typeName: state.currentAppType,
      pageSize: pageSize,
    });
  }

  function handleOpenAppDetail(app?: AppEntity.Item, edit?: boolean) {
    setState({ currentApp: app, open: true, edit: edit || false });
  }

  function handleDeleteApp(id: string) {
    deleteReq.run({ id });
  }

  function handleOpenType() {
    setState({ typeOpen: true });
  }

  function handleTypeChange(v: string) {
    setState({ currentAppType: v });

    searchAppsReq.run({
      keyword: state.keyword,
      current: 1,
      typeName: v,
      pageSize: pageSize,
    });
  }

  function handleCloseAppDetail() {
    setState({ currentApp: undefined, open: false });
  }

  // 只刷新搜索列表（用于 AppDetail）
  function handleRefreshSearch() {
    searchAppsReq.refresh();
  }

  // 同时刷新搜索列表和 apptype（用于 TypeManage）
  function handleRefreshAll() {
    searchAppsReq.refresh();
    refreshAppTypes();
  }

  function handleCloseType() {
    setState({ typeOpen: false });
  }

  function handleTypeOk() {
    refreshAppTypes();
  }

  function handleCloseHarmonyIconSingle() {
    setState({ harmonyIconSingleOpen: false });
  }

  function handleCloseHarmonyIconFolder() {
    setState({ harmonyIconFolderOpen: false });
  }

  function handleClosePngVectorizer() {
    setState({ pngVectorizerOpen: false });
  }

  function handleCloseLog() {
    setState({ logOpen: false });
  }

  function handleCloseHuaweiIconChecker() {
    setState({ huaweiIconCheckerOpen: false });
  }

  function handleOpenImportJson() {
    setState({ importJsonOpen: true });
  }

  function handleCloseImportJson() {
    setState({ importJsonOpen: false });
  }

  function handlePageChange(current: number) {
    searchAppsReq.run({
      keyword: state.keyword,
      current,
      typeName: state.currentAppType,
      pageSize: pageSize,
    });
  }

  const background = useMemo(
    () => (
      <div className={styles.background}>
        <GradientBackground
          skew={0}
          blending="overlay"
          colors={{
            background: 'blue',
            particles: ['#00897b', '#7f00ff', '#3b82f6'],
          }}
          speed={{ x: { min: 0.5, max: 2 }, y: { min: 0.5, max: 2 } }}
        />
      </div>
    ),
    []
  );

  const header = useMemo(
    () => (
      <header className={styles.header}>
        <Flex align="center" gap="3">
          <img src="/logo.png" />
          <h1>Package Repo {isAdmin ? '(Admin)' : ''}</h1>
        </Flex>

        <div className={styles.header__functions}>
          <div
            className={styles.header__functions__buttons}
            style={{ display: functionsExpanded ? 'flex' : 'none' }}
          >
            <Button onClick={() => setState({ harmonyIconSingleOpen: true })}>
              单个图标转鸿蒙图标
            </Button>

            <Button onClick={() => setState({ harmonyIconFolderOpen: true })}>
              鸿蒙图标文件夹转 bgfg 图标
            </Button>

            <Button onClick={() => setState({ pngVectorizerOpen: true })}>
              图片矢量化
            </Button>

            <Button onClick={() => setState({ huaweiIconCheckerOpen: true })}>
              华为必做图标检查
            </Button>

            {isAdmin && (
              <>
                <Button onClick={handleOpenType}>类型管理</Button>
                <Button onClick={() => setState({ logOpen: true })}>
                  访问日志
                </Button>
              </>
            )}
          </div>

          <div className={styles.header__functions__controls}>
            <IconButton
              size="3"
              variant="soft"
              radius="full"
              onClick={() => setFunctionsExpanded(!functionsExpanded)}
              aria-label={functionsExpanded ? '收起功能' : '展开功能'}
            >
              {functionsExpanded ? <MdChevronRight /> : <MdFilterList />}
            </IconButton>

            <IconButton
              size="3"
              variant="soft"
              radius="full"
              onClick={() => {
                // 循环切换主题模式：light -> dark -> system
                if (themeMode === 'light') {
                  setThemeMode?.('dark');
                } else if (themeMode === 'dark') {
                  setThemeMode?.('system');
                } else {
                  setThemeMode?.('light');
                }
              }}
              aria-label={
                themeMode === 'light'
                  ? '切换到深色模式'
                  : themeMode === 'dark'
                    ? '切换到跟随系统'
                    : '切换到浅色模式'
              }
            >
              {themeMode === 'light' ? (
                <MdBrightnessHigh />
              ) : themeMode === 'dark' ? (
                <MdBrightness2 />
              ) : (
                <MdBrightnessAuto />
              )}
            </IconButton>
          </div>
        </div>
      </header>
    ),
    [
      handleOpenType,
      isAdmin,
      setState,
      functionsExpanded,
      setFunctionsExpanded,
      themeMode,
      setThemeMode,
    ]
  );

  return (
    <>
      {!isMobile && (
        <div className={styles.home}>
          {header}

          {background}

          <div className={styles.home__content}>
            <Flex direction="column" gap="3" style={{ maxHeight: '87vh' }}>
              <SearchForm
                loading={searchAppsReq.loading}
                onChange={handleSearch}
              />

              <SearchResult
                currentAppType={state.currentAppType}
                appTypes={appTypesWithAll}
                loading={searchAppsReq.loading}
                keyword={state.keyword}
                pagination={state.pagination}
                apps={state.apps}
                onClick={handleOpenAppDetail}
                onDelete={handleDeleteApp}
                onChange={handlePageChange}
                onUpload={handleOpenImportJson}
                onTypeChange={handleTypeChange}
                isAdmin={isAdmin}
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
              />
            </Flex>
          </div>

          <Footer />
        </div>
      )}

      {isMobile && (
        <div className={styles['home--mobile']}>
          {background}

          <div className={styles['home__content--mobile']}>
            {header}

            <section>
              <Flex direction="column" gap="3" style={{ height: '100%' }}>
                <SearchForm
                  loading={searchAppsReq.loading}
                  onChange={handleSearch}
                />

                <SearchResult
                  currentAppType={state.currentAppType}
                  appTypes={appTypesWithAll}
                  loading={searchAppsReq.loading}
                  keyword={state.keyword}
                  pagination={state.pagination}
                  apps={state.apps}
                  onClick={handleOpenAppDetail}
                  onDelete={handleDeleteApp}
                  onChange={handlePageChange}
                  onUpload={handleOpenImportJson}
                  onTypeChange={handleTypeChange}
                  isAdmin={isAdmin}
                  displayMode={displayMode}
                  setDisplayMode={setDisplayMode}
                />

                <Footer />
              </Flex>
            </section>
          </div>
        </div>
      )}

      {state.open && (
        <AppDetail
          isAdmin={isAdmin}
          edit={state.edit}
          open={state.open}
          app={state.currentApp}
          onClose={handleCloseAppDetail}
          onRefresh={handleRefreshSearch}
        />
      )}

      {state.typeOpen && (
        <TypeManage
          open={state.typeOpen}
          onOk={handleTypeOk}
          onRefresh={handleRefreshAll}
          onClose={handleCloseType}
        />
      )}

      {state.harmonyIconSingleOpen && (
        <HarmonyIconSingle
          open={state.harmonyIconSingleOpen}
          onClose={handleCloseHarmonyIconSingle}
        />
      )}

      {state.harmonyIconFolderOpen && (
        <HarmonyIconFolder
          open={state.harmonyIconFolderOpen}
          onClose={handleCloseHarmonyIconFolder}
        />
      )}

      {state.pngVectorizerOpen && (
        <ImageVectorizer
          open={state.pngVectorizerOpen}
          onClose={handleClosePngVectorizer}
        />
      )}

      {state.logOpen && (
        <LogViewer open={state.logOpen} onClose={handleCloseLog} />
      )}

      {state.huaweiIconCheckerOpen && (
        <HuaweiIconChecker
          open={state.huaweiIconCheckerOpen}
          onClose={handleCloseHuaweiIconChecker}
        />
      )}

      {state.importJsonOpen && (
        <ImportJson
          open={state.importJsonOpen}
          onClose={handleCloseImportJson}
          onUpload={() => {}}
        />
      )}
    </>
  );
};

export default React.memo(Home);
