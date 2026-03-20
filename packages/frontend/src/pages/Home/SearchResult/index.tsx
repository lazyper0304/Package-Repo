import Highlighter from '@/components/Highlighter'
import type { AppEntity } from '@/entities/app'
import { Badge, Button, Card, ContextMenu, Flex, Heading, ScrollArea, Skeleton, Tabs, Text } from '@radix-ui/themes'
import { useSize } from 'ahooks'
import React, { useCallback, useRef } from 'react'
import type { PageEntity } from '@/entities/page'
import Pagination from '@/components/ui/Pagination'
import styles from './index.module.less'
import copy from 'copy-to-clipboard'
import { notify } from '@/utils/notify'
import empty from '@/assets/empty.svg'
import type { AppTypeEntity } from '@/entities/appType'

type IProps = Readonly<{
  currentAppType?: string
  appTypes: AppTypeEntity.ListItem[]
  apps: AppEntity.Item[]
  keyword: string
  loading: boolean
  pagination: PageEntity.PagePagination
  onClick: (v?: AppEntity.Item) => void
  onDelete: (id: string) => void
  onChange: (v: number) => void
  onUpload: () => void
  onType: () => void
  onTypeChange: (id: string) => void
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
  onType,
  onTypeChange,
}) => {
  const ref = useRef<HTMLHeadingElement>(null)

  const size = useSize(ref)

  function handleCopy(e: React.MouseEvent<HTMLSpanElement, MouseEvent>, v?: string) {
    e.stopPropagation()

    if (!v) return

    copy(v)

    notify('复制成功')
  }

  return (
    <Flex direction='column' style={{ flex: 1, height: 0 }}>
      <Card size='3'>
        <Flex justify='between'>
          <Heading ref={ref} style={{ marginBottom: 24 }}>
            📱搜索结果
          </Heading>

          <Flex gap='3'>
            <Button onClick={() => onClick()}>添加</Button>
            <Button variant='soft' onClick={onType}>
              分类管理
            </Button>
            <Button variant='soft' onClick={onUpload}>
              上传
            </Button>
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
                {appType.type_name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>

        <Skeleton loading={loading}>
          {apps.length ? (
            <ScrollArea
              className={styles.scrollView}
              type='hover'
              scrollbars='vertical'
              style={{ height: `calc(100% - ${size?.height}px - 120px)` }}
            >
              <Flex gap='3' direction='column'>
                {apps.map((app) => (
                  <Card key={app.id} className={styles.app} style={{ cursor: 'pointer' }} onClick={() => onClick(app)}>
                    <ContextMenu.Root>
                      <ContextMenu.Trigger>
                        <Flex justify='between' align='center'>
                          <Flex direction='column'>
                            <Flex gap='2' align='center'>
                              {app.type ? <Badge>{app.type}</Badge> : null}
                              <Heading size='3' onClick={(e) => handleCopy(e, app.appName)}>
                                <Highlighter searchWords={keyword}>{app.appName}</Highlighter>
                              </Heading>
                            </Flex>
                            <Text color='gray' onClick={(e) => handleCopy(e, app.androidPackageName)}>
                              <Highlighter searchWords={keyword}>{app.androidPackageName}</Highlighter>
                            </Text>
                            <Text color='gray' onClick={(e) => handleCopy(e, app.harmonyPackageName)}>
                              <Highlighter searchWords={keyword}>{app.harmonyPackageName}</Highlighter>
                            </Text>
                          </Flex>
                        </Flex>
                      </ContextMenu.Trigger>

                      <ContextMenu.Content>
                        <ContextMenu.Item shortcut='⌘ E' onClick={() => onClick(app)}>
                          编辑
                        </ContextMenu.Item>
                        <ContextMenu.Item
                          shortcut='⌘ D'
                          color='red'
                          onClick={(e) => {
                            e.stopPropagation()

                            onDelete(app.id)
                          }}
                        >
                          删除
                        </ContextMenu.Item>
                      </ContextMenu.Content>
                    </ContextMenu.Root>
                  </Card>
                ))}
              </Flex>
            </ScrollArea>
          ) : (
            <div className={styles.empty}>
              <img src={empty} />
              <Text color='gray'>暂无数据</Text>
            </div>
          )}
        </Skeleton>

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
  )
}

export default React.memo(SearchResult)
