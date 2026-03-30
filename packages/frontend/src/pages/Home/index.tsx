import React, { useMemo, useEffect } from 'react';
import styles from './index.module.less';
import { Button, Flex } from '@radix-ui/themes';
import type { AppEntity } from '@/entities/app';
import API from '@/services';
import { useRequest, useSetState, useLocalStorageState } from 'ahooks';
import AppDetail from '@/components/AppDetail';
import type { PageEntity } from '@/entities/page';
import UploadExcel from '@/components/UploadExcel';
import HarmonyIconSingle from '@/components/HarmonyIconSingle';
import HarmonyIconFolder from '@/components/HarmonyIconFolder';
import ImageVectorizer from '@/components/ImageVectorizer';
import { GradientBackground } from 'react-gradient-animation';
import TypeManage from '@/components/TypeManage';
import LogViewer from '@/components/LogViewer';
import { notify } from '@/utils/notify';
import { useAppType } from '@/contexts/AppTypeContext';
import useMobile from '@/hooks/useMobile';

const SearchResult = React.lazy(() => import('./SearchResult'));
const SearchForm = React.lazy(() => import('./SearchForm'));

type IProps = Readonly<{
  isAdmin?: boolean;
}>;

type IState = {
  keyword: string;
  apps: AppEntity.Item[];
  currentAppType?: string;
  currentApp?: AppEntity.Item;
  pagination: PageEntity.PagePagination;
  open: boolean;
  uploadOpen: boolean;
  typeOpen: boolean;
  harmonyIconSingleOpen: boolean;
  harmonyIconFolderOpen: boolean;
  pngVectorizerOpen: boolean;
  logOpen: boolean;
  edit: boolean;
};

const Home: React.FC<IProps> = ({ isAdmin = false }) => {
  const isMobile = useMobile();

  // 显示模式：grid1（一行一个）、grid2（一行两个）、grid3（一行三个）
  const [displayMode, setDisplayMode] = useLocalStorageState<
    'grid1' | 'grid2' | 'grid3'
  >('app-display-mode', {
    defaultValue: 'grid1',
  });

  // 根据显示模式计算 pageSize
  const pageSize = displayMode === 'grid3' ? 21 : 20;

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
    uploadOpen: false,
    typeOpen: false,
    harmonyIconSingleOpen: false,
    harmonyIconFolderOpen: false,
    pngVectorizerOpen: false,
    logOpen: false,
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

  // 当显示模式改变时，重新发起搜索请求，使用正确的 pageSize
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

  function handleOpenUpload() {
    setState({ uploadOpen: true });
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

  function handleCloseUpload() {
    setState({ uploadOpen: false });
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

  function handleUploadSuccess() {
    searchAppsReq.run({
      keyword: state.keyword,
      typeName: state.currentAppType,
      pageSize: pageSize,
    });
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
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          opacity: 0.2,
        }}
      >
        <GradientBackground
          skew={0}
          blending="overlay"
          colors={{
            background: 'blue',
            particles: ['#00897b', '#7f00ff', '#3b82f6'],
          }}
          speed={{ x: { min: 0.5, max: 0.8 }, y: { min: 0.5, max: 0.8 } }}
        />
      </div>
    ),
    []
  );

  const header = useMemo(
    () => (
      <header className={styles.home__header}>
        <h1>Package Repo {isAdmin ? '(Admin)' : ''}</h1>

        <div className={styles.home__functions}>
          <Button onClick={() => setState({ harmonyIconSingleOpen: true })}>
            单个图标转鸿蒙图标
          </Button>

          <Button onClick={() => setState({ harmonyIconFolderOpen: true })}>
            鸿蒙图标文件夹转 bgfg 图标
          </Button>

          <Button onClick={() => setState({ pngVectorizerOpen: true })}>
            图片矢量化
          </Button>

          {isAdmin && (
            <>
              <Button onClick={handleOpenType}>类型管理</Button>
              <Button onClick={() => setState({ logOpen: true })}>访问日志</Button>
            </>
          )}
        </div>
      </header>
    ),
    [handleOpenType, isAdmin, setState]
  );

  return (
    <>
      {!isMobile && (
        <div className={styles.home}>
          {background}

          <div className={styles.home__content}>
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
                  onUpload={handleOpenUpload}
                  onType={handleOpenType}
                  onTypeChange={handleTypeChange}
                  isAdmin={isAdmin}
                  displayMode={displayMode}
                  setDisplayMode={setDisplayMode}
                />
              </Flex>
            </section>
          </div>
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
                  onUpload={handleOpenUpload}
                  onType={handleOpenType}
                  onTypeChange={handleTypeChange}
                  isAdmin={isAdmin}
                  displayMode={displayMode}
                  setDisplayMode={setDisplayMode}
                />
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

      {state.uploadOpen && (
        <UploadExcel
          open={state.uploadOpen}
          onClose={handleCloseUpload}
          onUpload={handleUploadSuccess}
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
        <LogViewer
          open={state.logOpen}
          onClose={handleCloseLog}
        />
      )}
    </>
  );
};

export default React.memo(Home);
