import Highlighter from '@/components/Highlighter'
import type { AppEntity } from '@/entities/app'
import { Button, Card, Flex, Heading, ScrollArea, Skeleton, Text } from '@radix-ui/themes'
import { useSize } from 'ahooks'
import React, { useCallback, useRef } from 'react'
import type { PageEntity } from '@/entities/page'
import Pagination from '@/components/ui/Pagination'
import styles from './index.module.less'
import copy from 'copy-to-clipboard'
import { notify } from '@/utils/notify'
import empty from '@/assets/empty.svg'

type IProps = Readonly<{
  apps: AppEntity.Item[]
  keyword: string
  loading: boolean
  pagination: PageEntity.PagePagination
  onClick: (v?: AppEntity.Item) => void
  onChange: (v: number) => void
  onUpload: () => void
}>

const SearchResult: React.FC<IProps> = ({ apps, keyword, loading, pagination, onClick, onChange, onUpload }) => {
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
            <Button variant='soft' onClick={onUpload}>
              上传
            </Button>
          </Flex>
        </Flex>

        <Skeleton loading={loading}>
          {apps.length ? (
            <ScrollArea
              className={styles.scrollView}
              type='hover'
              scrollbars='vertical'
              style={{ height: `calc(100% - ${size?.height}px - 60px)` }}
            >
              <Flex gap='3' direction='column'>
                {apps.map((app) => (
                  <Card key={app.id} className={styles.app} style={{ cursor: 'pointer' }} onClick={() => onClick(app)}>
                    <Flex justify='between' align='center'>
                      <Flex direction='column'>
                        <Heading size='3' onClick={(e) => handleCopy(e, app.appName)}>
                          <Highlighter searchWords={keyword}>{app.appName}</Highlighter>
                        </Heading>
                        <Text color='gray' onClick={(e) => handleCopy(e, app.androidPackageName)}>
                          <Highlighter searchWords={keyword}>{app.androidPackageName}</Highlighter>
                        </Text>
                        <Text color='gray' onClick={(e) => handleCopy(e, app.harmonyPackageName)}>
                          <Highlighter searchWords={keyword}>{app.harmonyPackageName}</Highlighter>
                        </Text>
                      </Flex>
                    </Flex>
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
