import type { AppEntity } from '@/entities/app';
import {
  Badge,
  Card,
  ContextMenu,
  Flex,
  Heading,
  Text,
} from '@radix-ui/themes';
import React, { useMemo, useState } from 'react';
import Highlighter from '../Highlighter';
import AppIcon from '../AppIcon';
import ConfirmDialog from '../ui/ConfirmDialog';
import { copyToClipboard } from '@/utils/copy';
import styles from './index.module.less';
import { useSortedTypes } from '@/hooks/useSortedTypes';

type IProps = Readonly<{
  app: AppEntity.Item;
  keyword?: string;
  isAdmin?: boolean;
  onClick: (v?: AppEntity.Item, edit?: boolean) => void;
  onDelete: (id: string) => void;
  showAndroidPackageName?: boolean;
  showHarmonyPackageName?: boolean;
}>;

const AppItem: React.FC<IProps> = ({
  app,
  keyword,
  isAdmin,
  onClick,
  onDelete,
  showAndroidPackageName = true,
  showHarmonyPackageName = true,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sortedTypes = useSortedTypes(app.type);

  function handleCopy(
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    v?: string
  ) {
    e.stopPropagation();
    if (!v) return;
    copyToClipboard(v);
  }

  const appItem = useMemo(
    () => (app: AppEntity.Item) => (
      <Flex gap="3" style={{ height: '100%' }} onClick={() => onClick(app)}>
        <AppIcon iconUrl={app.iconUrl} />

        <Flex direction="column" style={{ flex: 1, overflow: 'hidden' }}>
          <Flex direction="column" style={{ flex: 1 }}>
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

            {showAndroidPackageName && (
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
            )}
            {showHarmonyPackageName && (
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
            )}
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
    [keyword, sortedTypes, showAndroidPackageName, showHarmonyPackageName]
  );

  return (
    <Card
      key={app.id}
      className={styles.app}
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {app.desc && app.desc !== 'null' && (
        <div className={styles.remarkBanner}>有备注</div>
      )}
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

      <ConfirmDialog
        open={showDeleteConfirm}
        description={`确定要删除应用 "${app.appName}" 吗？此操作无法撤销。`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(app.id);
          setShowDeleteConfirm(false);
        }}
      />
    </Card>
  );
};

export default React.memo(AppItem);
