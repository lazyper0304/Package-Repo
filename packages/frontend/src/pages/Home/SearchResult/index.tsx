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
import { useSize, useLocalStorageState } from 'ahooks';
import React, { useRef } from 'react';
import type { PageEntity } from '@/entities/page';
import Pagination from '@/components/ui/Pagination';
import styles from './index.module.less';
import empty from '@/assets/empty.svg';
import type { AppTypeEntity } from '@/entities/appType';
import AppItem from '@/components/AppItem';

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
  onType: () => void;
  onTypeChange: (id: string) => void;
  isAdmin?: boolean;
}>;

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
  onType,
  onTypeChange,
  isAdmin = false,
}) => {
  const ref = useRef<HTMLHeadingElement>(null);

  const size = useSize(ref);

  // 显示模式：grid1（一行一个）、grid2（一行两个）、grid3（一行三个）
  const [displayMode, setDisplayMode] = useLocalStorageState<
    'grid1' | 'grid2' | 'grid3'
  >('app-display-mode', {
    defaultValue: 'grid1',
  });

  return (
    <Flex direction="column" style={{ flex: 1, height: 0 }}>
      <Card size="3">
        <Flex justify="between" align="center">
          <Heading
            ref={ref}
            style={{
              marginBottom: 24,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            📱搜索结果
          </Heading>

          <Flex gap="3" align="center">
            <Flex gap="2" align="center">
              <Text size="2">显示模式：</Text>
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
          radius="none"
          type="auto"
          scrollbars="horizontal"
          style={{ width: '100%', height: 52 }}
        >
          <Tabs.Root
            value={currentAppType}
            defaultValue={appTypes?.[0]?.id}
            style={{ marginBottom: 16 }}
            onValueChange={onTypeChange}
          >
            <Tabs.List>
              {appTypes.map((appType) => (
                <Tabs.Trigger key={appType.id} value={appType.type_name}>
                  <Flex gap="2" align="center">
                    {appType.type_name}{' '}
                    {appType.app_count && (
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
              <ScrollArea
                className={styles.scrollView}
                type="hover"
                scrollbars="vertical"
                style={{
                  marginTop: 16,
                  height: `calc(100% - ${size?.height}px - 120px)`,
                }}
              >
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
                          displayMode === 'grid1'
                            ? '100%'
                            : displayMode === 'grid2'
                              ? 'calc(50% - 8px)'
                              : 'calc(33.333% - 10.666px)',
                        minWidth: displayMode === 'grid1' ? '100%' : '280px',
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
              </ScrollArea>
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
