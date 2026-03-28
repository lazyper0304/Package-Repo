import React, { useMemo } from 'react';
import styles from './index.module.less';
import { Button, Flex } from '@radix-ui/themes';
import type { AppEntity } from '@/entities/app';
import API from '@/services';
import { useRequest, useSetState } from 'ahooks';
import AppDetail from '@/components/AppDetail';
import type { PageEntity } from '@/entities/page';
import UploadExcel from '@/components/UploadExcel';
import HarmonyIcon from '@/components/HarmonyIcon';
import { GradientBackground } from 'react-gradient-animation';
import TypeManage from '@/components/TypeManage';
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
  harmonyIconOpen: boolean;
  edit: boolean;
};

const Home: React.FC<IProps> = ({ isAdmin = false }) => {
  const isMobile = useMobile();

  const [state, setState] = useSetState<IState>({
    keyword: '',
    apps: [],
    currentAppType: '全部',
    currentApp: undefined,
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0,
      pages: 0,
    },
    open: false,
    uploadOpen: false,
    typeOpen: false,
    harmonyIconOpen: false,
    edit: false,
  });

  const { state: appTypeState, refreshAppTypes } = useAppType();

  // 获取带"全部"选项的应用类型列表
  const appTypesWithAll = useMemo(() => {
    return appTypeState.appTypes.length > 0
      ? [{ type_name: '全部', id: '全部' }, ...appTypeState.appTypes]
      : [{ type_name: '全部', id: '全部' }];
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

    searchAppsReq.run({ keyword: v, typeName: state.currentAppType });
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

    searchAppsReq.run({ keyword: state.keyword, current: 1, typeName: v });
  }

  function handleCloseAppDetail() {
    setState({ currentApp: undefined, open: false });
  }

  function handleRefresh() {
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

  function handleCloseHarmonyIcon() {
    setState({ harmonyIconOpen: false });
  }

  function handleUploadSuccess() {
    searchAppsReq.run({
      keyword: state.keyword,
      typeName: state.currentAppType,
    });
  }

  function handlePageChange(current: number) {
    searchAppsReq.run({
      keyword: state.keyword,
      current,
      typeName: state.currentAppType,
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
          <Button onClick={() => setState({ harmonyIconOpen: true })}>
            转鸿蒙双层图标
          </Button>
          {isAdmin && (
            <>
              <Button onClick={handleOpenUpload}>批量上传</Button>
              <Button onClick={handleOpenType}>类型管理</Button>
            </>
          )}
        </div>
      </header>
    ),
    [handleOpenType, handleOpenUpload, isAdmin, setState]
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
          onRefresh={handleRefresh}
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
          onRefresh={handleRefresh}
          onClose={handleCloseType}
        />
      )}

      {state.harmonyIconOpen && (
        <HarmonyIcon
          open={state.harmonyIconOpen}
          onClose={handleCloseHarmonyIcon}
        />
      )}
    </>
  );
};

export default React.memo(Home);
