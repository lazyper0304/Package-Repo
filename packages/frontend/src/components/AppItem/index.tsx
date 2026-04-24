import type { AppEntity } from '@/entities/app';
import {
  Badge,
  Button,
  Card,
  ContextMenu,
  Dialog,
  Flex,
  Heading,
  Text,
} from '@radix-ui/themes';
import emptyIcon from '@/assets/empty.svg';
import React, { useMemo, useState } from 'react';
import Highlighter from '../Highlighter';
import copy from 'copy-to-clipboard';
import { notify } from '@/utils/notify';
import styles from './index.module.less';
import { useAppType } from '@/contexts/AppTypeContext';

type IProps = Readonly<{
  app: AppEntity.Item;
  keyword?: string;
  isAdmin?: boolean;
  onClick: (v?: AppEntity.Item, edit?: boolean) => void;
  onDelete: (id: string) => void;
}>;

const AppItem: React.FC<IProps> = ({
  app,
  keyword,
  isAdmin,
  onClick,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { state: appTypeState } = useAppType();

  // 对类型进行排序
  const sortedTypes = useMemo(() => {
    if (!app.type || app.type.length === 0) return [];
    if (!appTypeState.appTypes || appTypeState.appTypes.length === 0)
      return app.type;

    // 创建一个映射，用于快速查找类型的 sort 值
    const typeSortMap = new Map<string, number>();
    appTypeState.appTypes.forEach((appType) => {
      typeSortMap.set(appType.type_name, appType.sort || 0);
    });

    // 根据 sort 值排序
    return [...app.type].sort((a, b) => {
      const sortA = typeSortMap.get(a) ?? 0;
      const sortB = typeSortMap.get(b) ?? 0;
      return sortA - sortB;
    });
  }, [app.type, appTypeState.appTypes]);

  function handleCopy(
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    v?: string
  ) {
    e.stopPropagation();

    if (!v) return;

    copy(v);

    notify('复制成功');
  }

  const appItem = useMemo(
    () => (app: AppEntity.Item) => (
      <Flex gap="3" style={{ height: '100%' }}>
        <img
          loading="lazy"
          src={app.iconUrl && app.iconUrl !== '-' ? app.iconUrl : emptyIcon}
          style={{
            background:
              app.iconUrl && app.iconUrl !== '-' ? 'transparent' : '#d0d0d060',
          }}
        />

        <Flex direction="column" style={{ flex: 1, overflow: 'hidden' }}>
          <Flex justify="center" direction="column" style={{ flex: 1 }}>
            <Heading
              size="3"
              title="应用名称"
              style={{
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={(e) => handleCopy(e, app.appName)}
            >
              <Highlighter searchWords={keyword || ''}>
                {app.appName}
              </Highlighter>
            </Heading>

            <Text
              color="gray"
              title="Android包名"
              style={{
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={(e) => handleCopy(e, app.androidPackageName)}
            >
              <Highlighter searchWords={keyword || ''}>
                {app.androidPackageName}
              </Highlighter>
            </Text>
            <Text
              color="gray"
              title="Harmony包名"
              style={{
                width: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={(e) => handleCopy(e, app.harmonyPackageName)}
            >
              <Highlighter searchWords={keyword || ''}>
                {app.harmonyPackageName}
              </Highlighter>
            </Text>
          </Flex>

          {sortedTypes.length ? (
            <Flex
              wrap="wrap"
              gap="2"
              style={{
                marginTop: 8,
                borderTop: '1px solid var(--gray-a6)',
                paddingTop: 8,
                width: '100%',
              }}
            >
              {sortedTypes.map((type) => (
                <Badge key={type}>{type}</Badge>
              ))}
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    ),
    [keyword, sortedTypes]
  );

  return (
    <Card
      key={app.id}
      className={styles.app}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(app)}
    >
      <ContextMenu.Root>
        {isAdmin ? (
          <ContextMenu.Trigger>{appItem(app)}</ContextMenu.Trigger>
        ) : (
          appItem(app)
        )}

        <ContextMenu.Content>
          <>
            <ContextMenu.Item shortcut="⌘ E" onClick={() => onClick(app, true)}>
              编辑
            </ContextMenu.Item>
            <ContextMenu.Item
              shortcut="⌘ D"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
            >
              删除
            </ContextMenu.Item>
          </>
        </ContextMenu.Content>
      </ContextMenu.Root>

      <Dialog.Root open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <Dialog.Content maxWidth="360px">
          <Dialog.Title>确认删除</Dialog.Title>
          <Dialog.Description size="2">
            确定要删除应用 &quot;{app.appName}&quot; 吗？此操作无法撤销。
          </Dialog.Description>
          <Flex gap="2" mt="4" justify="end">
            <Button
              variant="soft"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(false);
              }}
            >
              取消
            </Button>
            <Button
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(app.id);
                setShowDeleteConfirm(false);
              }}
            >
              删除
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Card>
  );
};

export default React.memo(AppItem);
