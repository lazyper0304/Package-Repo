import type { AppEntity } from '@/entities/app';
import {
  Badge,
  Card,
  ContextMenu,
  Flex,
  Heading,
  Text,
} from '@radix-ui/themes';
import React, { useMemo } from 'react';
import Highlighter from '../Highlighter';
import copy from 'copy-to-clipboard';
import { notify } from '@/utils/notify';
import styles from './index.module.less';

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
      <Flex gap="3" align="center">
        {app.iconUrl ? <img src={app.iconUrl} /> : null}

        <Flex direction="column" style={{ flex: 1, overflow: 'hidden' }}>
          <Heading size="3" onClick={(e) => handleCopy(e, app.appName)}>
            <Highlighter searchWords={keyword || ''}>{app.appName}</Highlighter>
          </Heading>

          <Text
            color="gray"
            onClick={(e) => handleCopy(e, app.androidPackageName)}
          >
            <Highlighter searchWords={keyword || ''}>
              {app.androidPackageName}
            </Highlighter>
          </Text>
          <Text
            color="gray"
            onClick={(e) => handleCopy(e, app.harmonyPackageName)}
          >
            <Highlighter searchWords={keyword || ''}>
              {app.harmonyPackageName}
            </Highlighter>
          </Text>

          {app.type?.length ? (
            <Flex
              gap="2"
              style={{
                marginTop: 8,
                borderTop: '1px solid #d0d0d080',
                paddingTop: 8,
                width: '100%',
              }}
            >
              {app.type.map((type) => (
                <Badge key={type}>{type}</Badge>
              ))}
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    ),
    [keyword]
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

                onDelete(app.id);
              }}
            >
              删除
            </ContextMenu.Item>
          </>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </Card>
  );
};

export default React.memo(AppItem);
