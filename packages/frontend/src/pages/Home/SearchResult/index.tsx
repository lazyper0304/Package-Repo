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
} from '@radix-ui/themes';
import { useSize } from 'ahooks';
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

  return (
    <Flex direction="column" style={{ flex: 1, height: 0 }}>
      <Card size="3">
        <Flex justify="between">
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

          <Flex gap="3">
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

        {apps.length ? (
          <ScrollArea
            className={styles.scrollView}
            type="hover"
            scrollbars="vertical"
            style={{ height: `calc(100% - ${size?.height}px - 120px)` }}
          >
            <Flex gap="3" direction="column">
              {apps.map((app) => (
                <AppItem
                  key={app.id}
                  app={app}
                  keyword={keyword}
                  isAdmin={isAdmin}
                  onClick={onClick}
                  onDelete={onDelete}
                />
              ))}
            </Flex>
          </ScrollArea>
        ) : (
          <div className={styles.empty}>
            <img src={empty} />
            <Text color="gray">暂无数据</Text>
          </div>
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
