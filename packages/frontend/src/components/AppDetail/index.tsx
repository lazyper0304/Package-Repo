import type { AppEntity } from '@/entities/app';
import API from '@/services';
import {
  Badge,
  Button,
  CheckboxGroup,
  DataList,
  Dialog,
  Flex,
  Text,
  TextField,
  TextArea,
  Spinner,
} from '@radix-ui/themes';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.module.less';
import { useRequest } from 'ahooks';
import { AiOutlineLoading } from 'react-icons/ai';
import Form, { Field } from '@rc-component/form';
import AppIcon from '@/components/AppIcon';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageVectorizer from '@/components/ImageVectorizer';
import { copyToClipboard } from '@/utils/copy';
import { notify } from '@/utils/notify';

import useMobile from '@/hooks/useMobile';
import { useAppType } from '@/contexts/AppTypeContext';

type IProps = Readonly<{
  edit: boolean;
  app?: AppEntity.Item;
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onRefresh: () => void;
}>;

const AppDetail: React.FC<IProps> = ({
  edit,
  app,
  open,
  isAdmin = false,
  onClose,
  onRefresh,
}) => {
  const [form] = Form.useForm();

  const [iconUrl, setIconUrl] = useState('');

  const [showImageVectorizer, setShowImageVectorizer] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [packageNameResults, setPackageNameResults] = useState<
    { appName: string; packageName: string; id: string }[]
  >([]);
  const [showPackageResults, setShowPackageResults] = useState(false);

  const [harmonyPackageNameResults, setHarmonyPackageNameResults] = useState<
    { name: string; pkgName: string; appId: string }[]
  >([]);
  const [showHarmonyPackageResults, setShowHarmonyPackageResults] =
    useState(false);

  const [editing, setEditing] = useState(edit || !app);

  const isMobile = useMobile();

  const { state: appTypeState } = useAppType();

  const createReq = useRequest(API.addApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        notify(res.message);
      }
    },
  });

  const updateReq = useRequest(API.updateApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        notify(res.message);
      }
    },
  });

  const updateIconReq = useRequest(API.updateApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh();
      }
    },
  });

  const getPackageNameReq = useRequest(
    async (appName: string) => {
      const res = await fetch(
        `https://apptracker-api.cn1.tiers.top/api/appInfo?q=${encodeURIComponent(appName)}`
      );
      if (!res.ok) throw new Error('请求失败');
      const data = await res.json();
      return data.items as { appName: string; packageName: string; id: string }[];
    },
    {
      manual: true,
      onSuccess(items) {
        setPackageNameResults(items);
        setShowPackageResults(true);
      },
      onError() {
        notify('获取包名失败，请重试');
      },
    }
  );

  const getHarmonyPackageNameReq = useRequest(
    async (appName: string) => {
      const res = await fetch(
        `https://next.betahub.tech/api/v0/apps/list/1?page_size=10&sort=download_count&desc=true&search_key=name&search_value=${encodeURIComponent(appName)}&search_exact=false`
      );
      if (!res.ok) throw new Error('请求失败');
      const data = await res.json();
      return (data.data?.data ?? []).map(
        (item: { name: string; pkg_name: string; app_id: string }) => ({
          name: item.name,
          pkgName: item.pkg_name,
          appId: item.app_id,
        })
      );
    },
    {
      manual: true,
      onSuccess(items) {
        setHarmonyPackageNameResults(items);
        setShowHarmonyPackageResults(true);
      },
      onError() {
        notify('获取包名失败，请重试');
      },
    }
  );

  const deleteReq = useRequest(API.deleteApp, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        onRefresh();
        onClose();
      } else {
        notify(res.message);
      }
    },
  });

  const loading = useMemo(
    () =>
      updateReq.loading ||
      createReq.loading ||
      updateIconReq.loading ||
      deleteReq.loading,
    [
      updateReq.loading,
      createReq.loading,
      updateIconReq.loading,
      deleteReq.loading,
    ]
  );

  const getAppleStoreIconReq = useRequest(API.getAppleStoreIcon, {
    manual: true,
    onSuccess(res) {
      if (res) {
        setIconUrl(res);

        form.setFieldValue('图标链接', res);

        updateIconReq.run({ id: app!.id, iconUrl: res });
      }
    },
  });

  async function init(app: AppEntity.Item) {
    if (!app.iconUrl) {
      getAppleStoreIconReq.run({ appName: app.appName });
    } else {
      setIconUrl(app.iconUrl);
    }
  }

  function handleDelete() {
    setShowDeleteConfirm(true);
  }

  function handleCopy(v?: string) {
    if (!v) return;
    copyToClipboard(v);
  }

  function handleFinish(fields: Record<string, any>) {
    if (!Object.values(fields).filter(Boolean).length) return;
    (app?.id ? updateReq : createReq).run({
      id: app?.id,
      appName: fields?.['应用名'],
      iconUrl: fields?.['图标链接'],
      androidPackageName: fields?.['安卓包名'],
      harmonyPackageName: fields?.['鸿蒙包名'],
      type: fields?.['分类'] === '无' ? '' : fields?.['分类'],
      desc: fields?.['备注'],
    });
  }

  // 对类型进行排序
  const sortedTypes = useMemo(() => {
    if (!appTypeState.appTypes || appTypeState.appTypes.length === 0) return [];
    return [...appTypeState.appTypes].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    );
  }, [appTypeState.appTypes]);

  function Item(label: string, v?: string | string[]) {
    const hasValue = v && v.length > 0;

    // 对展示的分类进行排序
    const sortedDisplayTypes = useMemo(() => {
      if (!v || !Array.isArray(v) || v.length === 0) return v;
      if (!appTypeState.appTypes || appTypeState.appTypes.length === 0)
        return v;

      const typeSortMap = new Map<string, number>();
      appTypeState.appTypes.forEach((appType) => {
        typeSortMap.set(appType.type_name, appType.sort || 0);
      });

      return [...v].sort((a, b) => {
        const sortA = typeSortMap.get(a) ?? 0;
        const sortB = typeSortMap.get(b) ?? 0;
        return sortA - sortB;
      });
    }, [v]);

    return (
      <DataList.Item
        className={styles.appDetail__item}
        align={editing ? 'center' : 'baseline'}
      >
        <DataList.Label minWidth="68px">{label}</DataList.Label>

        <DataList.Value style={{ wordBreak: 'break-all' }}>
          <Flex gap="2" align="center" style={{ width: '100%' }}>
            <div style={{ flex: 1 }}>
              {editing && (
                <>
                  {/* {label === '分类' && (
                      <Select.Root defaultValue={v} onValueChange={(v) => form.setFieldValue(label, v)}>
                        <Select.Trigger placeholder='选择分类' />
                        <Select.Content>
                          <Select.Group>
                            <Select.Item value='无'>无</Select.Item>

                            {appTypes.map((appType) => (
                              <Select.Item key={appType.id} value={appType.type_name}>
                                {appType.type_name}
                              </Select.Item>
                            ))}
                          </Select.Group>
                        </Select.Content>
                      </Select.Root>
                    )} */}
                  {label === '分类' && (
                    <>
                      <Field name={label} />

                      {appTypeState.loading && <Spinner />}

                      {!appTypeState.loading && sortedTypes.length === 0 && (
                        <Text>暂无分类</Text>
                      )}

                      {!appTypeState.loading && sortedTypes.length > 0 && (
                        <CheckboxGroup.Root
                          style={{
                            flexDirection: 'row',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                          defaultValue={app?.type}
                          onValueChange={(v) => form.setFieldValue(label, v)}
                        >
                          {sortedTypes.map((appType) => (
                            <CheckboxGroup.Item
                              key={appType.id}
                              value={appType.type_name}
                            >
                              {appType.type_name}
                            </CheckboxGroup.Item>
                          ))}
                        </CheckboxGroup.Root>
                      )}
                    </>
                  )}

                  {(label === '安卓包名' || label === '鸿蒙包名') && (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <Flex gap="2" align="center">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Field name={label}>
                            <TextField.Root
                              defaultValue={v}
                              style={{ width: '100%' }}
                              placeholder={`请输入${label}`}
                            />
                          </Field>
                        </div>
                        <Button
                          size="2"
                          variant="soft"
                          loading={
                            label === '安卓包名'
                              ? getPackageNameReq.loading
                              : getHarmonyPackageNameReq.loading
                          }
                          onClick={() => {
                            const appName = form.getFieldValue('应用名');
                            if (!appName) {
                              notify('请先输入应用名');
                              return;
                            }
                            if (label === '安卓包名') {
                              getPackageNameReq.run(appName);
                            } else {
                              getHarmonyPackageNameReq.run(appName);
                            }
                          }}
                        >
                          获取包名
                        </Button>
                      </Flex>
                      {label === '安卓包名' && showPackageResults && (
                        <>
                          <div
                            style={{
                              position: 'fixed',
                              inset: 0,
                              zIndex: 9,
                            }}
                            onClick={() => setShowPackageResults(false)}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              background: 'var(--color-panel-solid)',
                              border: '1px solid var(--gray-6)',
                              borderRadius: 'var(--radius-3)',
                              marginTop: 4,
                              maxHeight: 240,
                              overflowY: 'auto',
                              boxShadow: 'var(--shadow-3)',
                            }}
                          >
                            {packageNameResults.length === 0 ? (
                              <div
                                style={{
                                  padding: '16px 12px',
                                  textAlign: 'center',
                                  color: 'var(--gray-9)',
                                  fontSize: '14px',
                                }}
                              >
                                暂无结果
                              </div>
                            ) : (
                              packageNameResults.map((item) => (
                                <div
                                  key={item.id}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--gray-4)',
                                    fontSize: '14px',
                                  }}
                                  onClick={() => {
                                    form.setFieldValue('安卓包名', item.packageName);
                                    setShowPackageResults(false);
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.background =
                                      'var(--accent-a3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.background =
                                      'transparent';
                                  }}
                                >
                                  <div style={{ fontWeight: 500 }}>
                                    {item.appName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--gray-9)',
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.packageName}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                      {label === '鸿蒙包名' && showHarmonyPackageResults && (
                        <>
                          <div
                            style={{
                              position: 'fixed',
                              inset: 0,
                              zIndex: 9,
                            }}
                            onClick={() => setShowHarmonyPackageResults(false)}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 10,
                              background: 'var(--color-panel-solid)',
                              border: '1px solid var(--gray-6)',
                              borderRadius: 'var(--radius-3)',
                              marginTop: 4,
                              maxHeight: 240,
                              overflowY: 'auto',
                              boxShadow: 'var(--shadow-3)',
                            }}
                          >
                            {harmonyPackageNameResults.length === 0 ? (
                              <div
                                style={{
                                  padding: '16px 12px',
                                  textAlign: 'center',
                                  color: 'var(--gray-9)',
                                  fontSize: '14px',
                                }}
                              >
                                暂无结果
                              </div>
                            ) : (
                              harmonyPackageNameResults.map((item) => (
                                <div
                                  key={item.appId}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--gray-4)',
                                    fontSize: '14px',
                                  }}
                                  onClick={() => {
                                    form.setFieldValue('鸿蒙包名', item.pkgName);
                                    setShowHarmonyPackageResults(false);
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.background =
                                      'var(--accent-a3)';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.background =
                                      'transparent';
                                  }}
                                >
                                  <div style={{ fontWeight: 500 }}>
                                    {item.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--gray-9)',
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.pkgName}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {label !== '分类' && label !== '备注' && label !== '安卓包名' && label !== '鸿蒙包名' && (
                    <Field name={label}>
                      <TextField.Root
                        defaultValue={v}
                        style={{ minWidth: '390px' }}
                        placeholder={`请输入${label}`}
                      />
                    </Field>
                  )}

                  {label === '备注' && (
                    <Field name={label}>
                      <TextArea
                        defaultValue={v}
                        style={{
                          minWidth: '390px',
                          minHeight: '80px',
                        }}
                        placeholder={`请输入${label}`}
                        maxLength={50}
                      />
                    </Field>
                  )}
                </>
              )}

              {!editing && (
                <>
                  {Array.isArray(sortedDisplayTypes) ? (
                    <Flex gap="2">
                      {sortedDisplayTypes.length === 0 && '-'}

                      {sortedDisplayTypes.map((item) => (
                        <Badge key={item} size="2">{item}</Badge>
                      ))}
                    </Flex>
                  ) : sortedDisplayTypes ? (
                    <div className={styles.appDetail__item__value}>
                      {sortedDisplayTypes}
                    </div>
                  ) : (
                    '-'
                  )}
                </>
              )}
            </div>

            {hasValue && !editing && (
              <Flex
                gap="1"
                align="center"
                className={styles.appDetail__item__action}
              >
                <Button
                  size="1"
                  color="gold"
                  variant="soft"
                  onClick={() => handleCopy(v)}
                >
                  复制
                </Button>
              </Flex>
            )}
          </Flex>
        </DataList.Value>
      </DataList.Item>
    );
  }

  useEffect(() => {
    if (open && app) {
      init(app);
    }
  }, [open, app]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth={isMobile ? '88vw' : '720px'}>
        <Dialog.Title>{app?.appName ?? '新增应用'}</Dialog.Title>

        <Dialog.Description size="2" mb="4">
          <div className={styles.appDetail__content}>
            {app && (
              <div
                className={styles.appDetail__icon}
                style={{
                  background: iconUrl ? 'transparent' : '#d0d0d060',
                }}
              >
                {getAppleStoreIconReq.loading && (
                  <AiOutlineLoading className="loading" />
                )}

                <AppIcon iconUrl={iconUrl} />
              </div>
            )}

            <Form
              initialValues={{
                应用名: app?.appName,
                安卓包名: app?.androidPackageName,
                鸿蒙包名: app?.harmonyPackageName,
                图标链接: iconUrl,
                分类: app?.type,
                备注: app?.desc,
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

                {Item('备注', app?.desc)}
              </DataList.Root>

              <Flex
                gap="3"
                style={{
                  marginTop: 24,
                }}
              >
                {app && (
                  <>
                    {iconUrl && iconUrl !== '-' && (
                      <>
                        <Button
                          variant="soft"
                          style={{ flex: 1 }}
                          onClick={() => setShowImageVectorizer(true)}
                        >
                          转矢量
                        </Button>
                        <Button
                          variant="soft"
                          style={{ flex: 1 }}
                          onClick={async () => {
                            try {
                              const response = await fetch(iconUrl);
                              const blob = await response.blob();
                              const item = new ClipboardItem({
                                [blob.type]: blob,
                              });
                              await navigator.clipboard.write([item]);
                              notify('图标已复制到剪贴板');
                            } catch (error) {
                              console.error('复制图标失败:', error);
                              notify('复制图标失败，请重试');
                            }
                          }}
                        >
                          复制图标
                        </Button>
                      </>
                    )}

                    {isAdmin && editing && (
                      <>
                        <Button
                          variant="soft"
                          style={{ flex: 1 }}
                          onClick={() => setEditing(false)}
                        >
                          取消
                        </Button>
                        <Button
                          loading={loading}
                          style={{ flex: 1 }}
                          type="submit"
                        >
                          保存
                        </Button>
                      </>
                    )}

                    {isAdmin && !editing && (
                      <>
                        <Button
                          color="red"
                          variant="soft"
                          loading={loading}
                          style={{ flex: 1 }}
                          onClick={handleDelete}
                        >
                          删除
                        </Button>
                        <Button
                          variant="soft"
                          style={{ flex: 1 }}
                          onClick={() => setEditing(true)}
                        >
                          编辑
                        </Button>
                      </>
                    )}
                  </>
                )}

                {isAdmin && !app && (
                  <Button
                    loading={loading}
                    type="submit"
                    style={{ width: '100%' }}
                  >
                    添加
                  </Button>
                )}
              </Flex>
            </Form>

            {showImageVectorizer && (
              <ImageVectorizer
                open={showImageVectorizer}
                onClose={() => setShowImageVectorizer(false)}
                imageUrl={iconUrl}
              />
            )}

            <ConfirmDialog
              open={showDeleteConfirm}
              description={`确定要删除应用 "${app?.appName}" 吗？此操作无法撤销。`}
              loading={loading}
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={() => {
                if (app?.id) {
                  deleteReq.run({ id: app.id });
                }
                setShowDeleteConfirm(false);
              }}
            />
          </div>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(AppDetail);
