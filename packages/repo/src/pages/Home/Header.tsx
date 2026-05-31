import React, { useState } from 'react';
import styles from './index.module.less';
import { Button, Flex, IconButton } from '@radix-ui/themes';
import {
  MdBrightness2,
  MdBrightnessAuto,
  MdBrightnessHigh,
  MdChevronRight,
  MdFilterList,
} from 'react-icons/md';

type ThemeMode = 'light' | 'dark' | 'system';

type HeaderProps = {
  isAdmin: boolean;
  themeMode?: ThemeMode;
  setThemeMode?: (value: ThemeMode) => void;
  onOpenHarmonyIconSingle: () => void;
  onOpenHarmonyIconFolder: () => void;
  onOpenPngVectorizer: () => void;
  onOpenHuaweiIconChecker: () => void;
  onOpenType: () => void;
  onOpenLog: () => void;
  onOpenAndroidToHarmony: () => void;
};

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  themeMode,
  setThemeMode,
  onOpenHarmonyIconSingle,
  onOpenHarmonyIconFolder,
  onOpenPngVectorizer,
  onOpenHuaweiIconChecker,
  onOpenType,
  onOpenLog,
  onOpenAndroidToHarmony,
}) => {
  const [functionsExpanded, setFunctionsExpanded] = useState(false);

  return (
    <header className={styles.header}>
      <Flex align="center" gap="3">
        <img src={`${import.meta.env.BASE_URL}logo.png`} />
        <h1>Package Repo {isAdmin ? '(Admin)' : ''}</h1>
      </Flex>

      <div className={styles.header__functions}>
        <div
          className={styles.header__functions__buttons}
          style={{ display: functionsExpanded ? 'flex' : 'none' }}
        >
          <Button onClick={onOpenHarmonyIconSingle}>单个图标转鸿蒙图标</Button>
          <Button onClick={onOpenHarmonyIconFolder}>鸿蒙图标文件夹转 bgfg 图标</Button>
          <Button onClick={onOpenPngVectorizer}>图片矢量化</Button>
          <Button onClick={onOpenHuaweiIconChecker}>华为必做图标检查</Button>
          <Button onClick={onOpenAndroidToHarmony}>安卓包名转鸿蒙</Button>
          {isAdmin && (
            <>
              <Button onClick={onOpenType}>类型管理</Button>
              <Button onClick={onOpenLog}>访问日志</Button>
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
              if (themeMode === 'light') setThemeMode?.('dark');
              else if (themeMode === 'dark') setThemeMode?.('system');
              else setThemeMode?.('light');
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
  );
};

export default React.memo(Header);
