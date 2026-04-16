import type { AppEntity } from '@/entities/app';
import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Spinner,
  Tabs,
  Text,
  Select,
} from '@radix-ui/themes';
import { useSize } from 'ahooks';
import React, { useMemo, useRef } from 'react';
import type { PageEntity } from '@/entities/page';
import Pagination from '@/components/ui/Pagination';
import styles from './index.module.less';
import empty from '@/assets/empty.svg';
import type { AppTypeEntity } from '@/entities/appType';
import AppItem from '@/components/AppItem';
import useMobile from '@/hooks/useMobile';

type IProps = Readonly<{
  currentAppType?: string;
  appTypes: AppTypeEntity.ListItem[];
  apps: AppEntity.Item[];
  keyword: string;
  loading: boolean;
  pagination: PageEntity.PagePagination;
  onClick: (v?: AppEntity.Item, edit?: boolean) => void;
  onDelete: (id: string) => void;
  onChange: (v: number) => void;
  onUpload: () => void;
  onTypeChange: (id: string) => void;
  isAdmin?: boolean;
  displayMode: 'grid1' | 'grid2' | 'grid3';
  setDisplayMode: (v: 'grid1' | 'grid2' | 'grid3') => void;
}>

const SearchResult: React.FC<IProps> = ({
  currentAppType,
  appTypes,
  apps,
  keyword,
  loading,
  pagination,
  onClick,
  onDelete,
  onChange,
  onUpload,
  onTypeChange,
  isAdmin = false,
  displayMode,
  setDisplayMode,
}) => {
  const ref = useRef<HTMLHeadingElement>(null);

  const appTypeRef = useRef<HTMLDivElement>(null);

  const size = useSize(ref);

  const isMobile = useMobile();

  // 对 appTypes 进行排序
  const sortedAppTypes = useMemo(() => {
    if (!appTypes || appTypes.length === 0) return [];
    return [...appTypes].sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }, [appTypes]);

  function handleScroll(e: React.WheelEvent<HTMLDivElement>) {
    if (appTypeRef.current) {
      appTypeRef.current.scrollLeft += e.deltaY;
    }
  }

  const appList = useMemo(() => {
    const list = (
      <Flex
        gap="3"
        direction={displayMode === 'grid1' ? 'column' : 'row'}
        wrap="wrap"
        style={{
          width: '100%',
          gap: displayMode === 'grid1' ? '12px' : '16px',
        }}
      >
        {apps.map((app) => (
          <div
            key={app.id}
            style={{
              width:
                displayMode === 'grid1' || isMobile
                  ? '100%'
                  : displayMode === 'grid2'
                    ? 'calc(50% - 8px)'
                    : 'calc(33.333% - 10.666px)',
            }}
          >
            <AppItem
              app={app}
              keyword={keyword}
              isAdmin={isAdmin}
              onClick={onClick}
              onDelete={onDelete}
            />
          </div>
        ))}
      </Flex>
    );

    if (isMobile) {
      return <div className={styles['scrollView--mobile']}>{list}</div>;
    }

    return (
      <ScrollArea
        className={styles.scrollView}
        type="hover"
        scrollbars="vertical"
        style={{
          marginTop: 16,
          height: `calc(100% - ${size?.height}px - 120px)`,
        }}
      >
        {list}
      </ScrollArea>
    );
  }, [
    displayMode,
    apps,
    isMobile,
    size?.height,
    keyword,
    isAdmin,
    onClick,
    onDelete,
  ]);

  return (
    <Flex
      direction="column"
      style={{ flex: 1, height: isMobile ? 'max-content' : 0 }}
    >
      <Card size="3" style={{ display: 'flex', flexDirection: 'column' }}>
        <Flex style={{ marginBottom: 24 }} gap="4">
          <Heading
            ref={ref}
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            📱搜索结果
          </Heading>

          <Flex gap="3" align="center">
            {!isMobile && (
              <Flex gap="2" align="center">
                <Select.Root
                  value={displayMode}
                  onValueChange={(v) =>
                    setDisplayMode(v as 'grid1' | 'grid2' | 'grid3')
                  }
                >
                  <Select.Trigger style={{ width: 120 }}></Select.Trigger>
                  <Select.Content>
                    <Select.Item value="grid1">一行一个</Select.Item>
                    <Select.Item value="grid2">一行两个</Select.Item>
                    <Select.Item value="grid3">一行三个</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
            )}

            {isAdmin && (
              <>
                <Button onClick={() => onClick()}>添加</Button>
                <Button variant="soft" onClick={onUpload}>
                  上传
                </Button>
              </>
            )}
          </Flex>
        </Flex>

        <ScrollArea
          ref={appTypeRef}
          radius="none"
          type="hover"
          scrollbars="horizontal"
          style={{ width: '100%', height: 52 }}
          onWheel={handleScroll}
        >
          <Tabs.Root
            value={currentAppType}
            defaultValue={sortedAppTypes?.[0]?.type_name}
            style={{ marginBottom: 16 }}
            onValueChange={onTypeChange}
          >
            <Tabs.List>
              {sortedAppTypes.map((appType) => (
                <Tabs.Trigger key={appType.id} value={appType.type_name}>
                  <Flex gap="2" align="center">
                    {appType.type_name}{' '}
                    {keyword === '' && (appType.app_count ?? 0) > 0 && (
                      <Badge radius="full">{appType.app_count}</Badge>
                    )}
                  </Flex>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
        </ScrollArea>

        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 300,
            }}
          >
            <Spinner />
          </div>
        )}

        {!loading && (
          <>
            {apps.length ? (
              appList
            ) : (
              <div className={styles.empty}>
                <img src={empty} />
                <Text color="gray">暂无数据</Text>
              </div>
            )}
          </>
        )}

        {apps.length > 0 && (
          <Pagination
            style={{ alignSelf: 'flex-end' }}
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={onChange}
          />
        )}
      </Card>
    </Flex>
  );
};

export default React.memo(SearchResult);
