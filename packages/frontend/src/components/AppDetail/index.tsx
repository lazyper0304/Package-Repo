import type { AppEntity } from '@/entities/app'
import API from '@/services'
import { Button, DataList, Dialog, Flex, Select, TextField } from '@radix-ui/themes'
import React, { useEffect, useState } from 'react'
import styles from './index.module.less'
import { useRequest } from 'ahooks'
import { AiOutlineLoading } from 'react-icons/ai'
import copy from 'copy-to-clipboard'
import { notify } from '@/utils/notify'
import Form, { Field } from '@rc-component/form'
import type { AppTypeEntity } from '@/entities/appType'

type IProps = Readonly<{
  app?: AppEntity.Item
  open: boolean
  onClose: () => void
  onRefresh: () => void
}>

const AppDetail: React.FC<IProps> = ({ app, open, onClose, onRefresh }) => {
  const [form] = Form.useForm()

  const [iconUrl, setIconUrl] = useState('')

  const [editing, setEditing] = useState(!app)

  const [appTypes, setAppTypes] = useState<AppTypeEntity.ListItem[]>([])

  const createReq = useRequest(API.addApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh()
        onClose()
      } else {
        notify(res.message)
      }
    },
  })

  const typeReq = useRequest(API.appTypeList, {
    onSuccess(res) {
      setAppTypes(res?.data ?? [])
    },
  })

  const updateReq = useRequest(API.updateApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh()
        onClose()
      } else {
        notify(res.message)
      }
    },
  })

  const updateIconReq = useRequest(API.updateApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh()
      }
    },
  })

  const deleteReq = useRequest(API.deleteApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh()
        onClose()
      } else {
        notify(res.message)
      }
    },
  })

  const getAppleStoreIconReq = useRequest(API.getAppleStoreIcon, {
    manual: true,
    onSuccess(res) {
      if (res) {
        setIconUrl(res)

        updateIconReq.run({ id: app!.id, iconUrl: res })
      }
    },
  })

  async function init(app: AppEntity.Item) {
    if (!app.iconUrl) {
      getAppleStoreIconReq.run({ appName: app.appName })
    } else {
      setIconUrl(app.iconUrl)
    }
  }

  function handleDelete() {
    deleteReq.run({ id: app!.id })
  }

  function handleCopy(v?: string) {
    if (!v) return

    copy(v)

    notify('复制成功')
  }

  function handleFinish(fields: Record<string, any>) {
    if (!Object.values(fields).filter(Boolean).length) return
    ;(app?.id ? updateReq : createReq).run({
      id: app?.id,
      appName: fields?.['应用名'],
      iconUrl: fields?.['图标链接'],
      androidPackageName: fields?.['安卓包名'],
      harmonyPackageName: fields?.['鸿蒙包名'],
      type: fields?.['分类'],
    })
  }

  function Item(label: string, v?: string) {
    const hasValue = v && v.length

    return (
      <DataList.Item className={styles.appDetail__item} align={editing ? 'center' : 'baseline'}>
        <DataList.Label minWidth='88px'>{label}</DataList.Label>

        <Flex gap='1' align='center'>
          <DataList.Value style={{ wordBreak: 'break-all' }}>
            <Flex gap='1' align='center'>
              <div style={{ flex: 1 }}>
                {editing ? (
                  <Field name={label}>
                    {label === '分类' ? (
                      <Select.Root defaultValue={v} onValueChange={(v) => form.setFieldValue(label, v)}>
                        <Select.Trigger placeholder='选择分类' />
                        <Select.Content>
                          <Select.Group>
                            {appTypes.map((appType) => (
                              <Select.Item key={appType.id} value={appType.type_name}>
                                {appType.type_name}
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>
                    ) : (
                      <TextField.Root
                        defaultValue={v}
                        style={{ width: 400 }}
                        placeholder={`请输入${label}`}
                      ></TextField.Root>
                    )}
                  </Field>
                ) : v ? (
                  v
                ) : (
                  '-'
                )}
              </div>

              {hasValue && !editing && (
                <Flex gap='1' align='center' className={styles.appDetail__item__action}>
                  <Button size='1' variant='soft' onClick={() => handleCopy(v)}>
                    复制
                  </Button>
                </Flex>
              )}
            </Flex>
          </DataList.Value>
        </Flex>
      </DataList.Item>
    )
  }

  useEffect(() => {
    if (open && app) {
      init(app)
    }
  }, [open, app])

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content>
        <Dialog.Title>{app?.appName ?? '新增应用'}</Dialog.Title>

        <Dialog.Description size='2' mb='4'>
          {app && (
            <div className={styles.appDetail__icon}>
              {getAppleStoreIconReq.loading && <AiOutlineLoading className='loading' />}

              {iconUrl && <img src={iconUrl} />}
            </div>
          )}

          <Form
            initialValues={{
              应用名: app?.appName,
              安卓包名: app?.androidPackageName,
              鸿蒙包名: app?.harmonyPackageName,
              图标链接: iconUrl,
              分类: app?.type,
            }}
            form={form}
            onFinish={handleFinish}
          >
            <DataList.Root>
              {Item('应用名', app?.appName)}

              {Item('安卓包名', app?.androidPackageName)}

              {Item('鸿蒙包名', app?.harmonyPackageName)}

              {Item('图标链接', iconUrl)}

              {Item('分类', app?.type)}
            </DataList.Root>

            <Flex
              gap='3'
              style={{
                marginTop: 24,
              }}
            >
              {app && (
                <>
                  {editing && (
                    <>
                      <Button variant='soft' style={{ flex: 1 }} onClick={() => setEditing(false)}>
                        取消
                      </Button>
                      <Button style={{ flex: 1 }} type='submit'>
                        保存
                      </Button>
                    </>
                  )}

                  {!editing && (
                    <>
                      <Button color='red' variant='soft' style={{ flex: 1 }} onClick={handleDelete}>
                        删除
                      </Button>
                      <Button style={{ flex: 1 }} onClick={() => setEditing(true)}>
                        编辑
                      </Button>
                    </>
                  )}
                </>
              )}

              {!app && (
                <Button type='submit' style={{ width: '100%' }}>
                  添加
                </Button>
              )}
            </Flex>
          </Form>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default React.memo(AppDetail)
