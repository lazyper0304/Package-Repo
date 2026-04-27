import React, { Suspense } from 'react';
import type { AppEntity } from '@/entities/app';

// 重量级组件 lazy load，减少主包体积
// ImageVectorizer 带 vtracer WASM，HarmonyIcon* 带 JSZip
const AppDetail = React.lazy(() => import('@/components/AppDetail'));
const TypeManage = React.lazy(() => import('@/components/TypeManage'));
const HarmonyIconSingle = React.lazy(() => import('@/components/HarmonyIconSingle'));
const HarmonyIconFolder = React.lazy(() => import('@/components/HarmonyIconFolder'));
const ImageVectorizer = React.lazy(() => import('@/components/ImageVectorizer'));
const LogViewer = React.lazy(() => import('@/components/LogViewer'));
const HuaweiIconChecker = React.lazy(() => import('@/components/HuaweiIconChecker'));
const ImportJson = React.lazy(() => import('@/components/ImportJson'));

type ToolDialogsProps = {
  isAdmin: boolean;
  // AppDetail
  appDetailOpen: boolean;
  edit: boolean;
  currentApp?: AppEntity.Item;
  onCloseAppDetail: () => void;
  onRefreshSearch: () => void;
  // TypeManage
  typeOpen: boolean;
  onTypeOk: () => void;
  onRefreshAll: () => void;
  onCloseType: () => void;
  // HarmonyIconSingle
  harmonyIconSingleOpen: boolean;
  onCloseHarmonyIconSingle: () => void;
  // HarmonyIconFolder
  harmonyIconFolderOpen: boolean;
  onCloseHarmonyIconFolder: () => void;
  // ImageVectorizer
  pngVectorizerOpen: boolean;
  onClosePngVectorizer: () => void;
  // LogViewer
  logOpen: boolean;
  onCloseLog: () => void;
  // HuaweiIconChecker
  huaweiIconCheckerOpen: boolean;
  onCloseHuaweiIconChecker: () => void;
  // ImportJson
  importJsonOpen: boolean;
  onCloseImportJson: () => void;
};

const ToolDialogs: React.FC<ToolDialogsProps> = ({
  isAdmin,
  appDetailOpen,
  edit,
  currentApp,
  onCloseAppDetail,
  onRefreshSearch,
  typeOpen,
  onTypeOk,
  onRefreshAll,
  onCloseType,
  harmonyIconSingleOpen,
  onCloseHarmonyIconSingle,
  harmonyIconFolderOpen,
  onCloseHarmonyIconFolder,
  pngVectorizerOpen,
  onClosePngVectorizer,
  logOpen,
  onCloseLog,
  huaweiIconCheckerOpen,
  onCloseHuaweiIconChecker,
  importJsonOpen,
  onCloseImportJson,
}) => {
  return (
    <Suspense fallback={null}>
      {appDetailOpen && (
        <AppDetail
          isAdmin={isAdmin}
          edit={edit}
          open={appDetailOpen}
          app={currentApp}
          onClose={onCloseAppDetail}
          onRefresh={onRefreshSearch}
        />
      )}

      {typeOpen && (
        <TypeManage
          open={typeOpen}
          onOk={onTypeOk}
          onRefresh={onRefreshAll}
          onClose={onCloseType}
        />
      )}

      {harmonyIconSingleOpen && (
        <HarmonyIconSingle open={harmonyIconSingleOpen} onClose={onCloseHarmonyIconSingle} />
      )}

      {harmonyIconFolderOpen && (
        <HarmonyIconFolder open={harmonyIconFolderOpen} onClose={onCloseHarmonyIconFolder} />
      )}

      {pngVectorizerOpen && (
        <ImageVectorizer open={pngVectorizerOpen} onClose={onClosePngVectorizer} />
      )}

      {logOpen && <LogViewer open={logOpen} onClose={onCloseLog} />}

      {huaweiIconCheckerOpen && (
        <HuaweiIconChecker open={huaweiIconCheckerOpen} onClose={onCloseHuaweiIconChecker} />
      )}

      {importJsonOpen && (
        <ImportJson open={importJsonOpen} onClose={onCloseImportJson} onUpload={() => {}} />
      )}
    </Suspense>
  );
};

export default React.memo(ToolDialogs);
