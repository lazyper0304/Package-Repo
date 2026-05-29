import React, { useMemo, useCallback } from 'react';
import styles from './index.module.less';
import { Flex } from '@radix-ui/themes';
import { GradientBackground } from 'react-gradient-animation';
import Footer from './Footer';
import useMobile from '@/hooks/useMobile';
import { useHomeState } from './useHomeState';
import Header from './Header';
import ToolDialogs from './ToolDialogs';

const SearchResult = React.lazy(() => import('./SearchResult'));
const SearchForm = React.lazy(() => import('./SearchForm'));

type ThemeMode = 'light' | 'dark' | 'system';

type IProps = Readonly<{
  isAdmin?: boolean;
  themeMode?: ThemeMode;
  setThemeMode?: (value: ThemeMode) => void;
}>;

const Home: React.FC<IProps> = ({ isAdmin = false, themeMode, setThemeMode }) => {
  const isMobile = useMobile();

  const {
    state,
    setState,
    displayMode,
    setDisplayMode,
    packageVisibility,
    setPackageVisibility,
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
    handleOpenAndroidToHarmony,
    handleCloseAndroidToHarmony,
    refreshAppTypes,
  } = useHomeState();

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

  // 稳定的弹窗打开/关闭回调，避免内联箭头函数导致子组件重渲染
  const openHarmonyIconSingle = useCallback(() => setState({ harmonyIconSingleOpen: true }), [setState]);
  const openHarmonyIconFolder = useCallback(() => setState({ harmonyIconFolderOpen: true }), [setState]);
  const openPngVectorizer = useCallback(() => setState({ pngVectorizerOpen: true }), [setState]);
  const openHuaweiIconChecker = useCallback(() => setState({ huaweiIconCheckerOpen: true }), [setState]);
  const openType = useCallback(() => setState({ typeOpen: true }), [setState]);
  const openLog = useCallback(() => setState({ logOpen: true }), [setState]);
  const openImportJson = useCallback(() => setState({ importJsonOpen: true }), [setState]);
  const closeType = useCallback(() => setState({ typeOpen: false }), [setState]);
  const closeHarmonyIconSingle = useCallback(() => setState({ harmonyIconSingleOpen: false }), [setState]);
  const closeHarmonyIconFolder = useCallback(() => setState({ harmonyIconFolderOpen: false }), [setState]);
  const closePngVectorizer = useCallback(() => setState({ pngVectorizerOpen: false }), [setState]);
  const closeLog = useCallback(() => setState({ logOpen: false }), [setState]);
  const closeHuaweiIconChecker = useCallback(() => setState({ huaweiIconCheckerOpen: false }), [setState]);
  const closeImportJson = useCallback(() => setState({ importJsonOpen: false }), [setState]);

  const header = (
    <Header
      isAdmin={isAdmin}
      themeMode={themeMode}
      setThemeMode={setThemeMode}
      onOpenHarmonyIconSingle={openHarmonyIconSingle}
      onOpenHarmonyIconFolder={openHarmonyIconFolder}
      onOpenPngVectorizer={openPngVectorizer}
      onOpenHuaweiIconChecker={openHuaweiIconChecker}
      onOpenType={openType}
      onOpenLog={openLog}
      onOpenAndroidToHarmony={handleOpenAndroidToHarmony}
    />
  );

  const searchContent = (
    <>
      <SearchForm loading={searchAppsReq.loading} onChange={handleSearch} />
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
        onUpload={openImportJson}
        onTypeChange={handleTypeChange}
        isAdmin={isAdmin}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        packageVisibility={packageVisibility}
        setPackageVisibility={setPackageVisibility}
      />
    </>
  );

  return (
    <>
      {!isMobile && (
        <div className={styles.home}>
          {header}
          {background}
          <div className={styles.home__content}>
            <Flex direction="column" gap="3" style={{ maxHeight: '87vh' }}>
              {searchContent}
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
                {searchContent}
                <Footer />
              </Flex>
            </section>
          </div>
        </div>
      )}

      <ToolDialogs
        isAdmin={isAdmin}
        appDetailOpen={state.open}
        edit={state.edit}
        currentApp={state.currentApp}
        onCloseAppDetail={handleCloseAppDetail}
        onRefreshSearch={handleRefreshSearch}
        typeOpen={state.typeOpen}
        onTypeOk={refreshAppTypes}
        onRefreshAll={handleRefreshAll}
        onCloseType={closeType}
        harmonyIconSingleOpen={state.harmonyIconSingleOpen}
        onCloseHarmonyIconSingle={closeHarmonyIconSingle}
        harmonyIconFolderOpen={state.harmonyIconFolderOpen}
        onCloseHarmonyIconFolder={closeHarmonyIconFolder}
        pngVectorizerOpen={state.pngVectorizerOpen}
        onClosePngVectorizer={closePngVectorizer}
        logOpen={state.logOpen}
        onCloseLog={closeLog}
        huaweiIconCheckerOpen={state.huaweiIconCheckerOpen}
        onCloseHuaweiIconChecker={closeHuaweiIconChecker}
        importJsonOpen={state.importJsonOpen}
        onCloseImportJson={closeImportJson}
        androidToHarmonyOpen={state.androidToHarmonyOpen}
        onCloseAndroidToHarmony={handleCloseAndroidToHarmony}
      />
    </>
  );
};

export default React.memo(Home);
