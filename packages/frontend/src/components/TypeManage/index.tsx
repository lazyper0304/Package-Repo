import API from '@/services';
import { Badge, Dialog, Flex, Spinner, TextField } from '@radix-ui/themes';
import Form, { Field } from '@rc-component/form';
import { useRequest } from 'ahooks';
import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd, MdCheck, MdClose, MdDelete, MdEdit } from 'react-icons/md';
import styles from './index.module.less';
import { notify } from '@/utils/notify';
import { useAppType } from '@/contexts/AppTypeContext';

type IProps = Readonly<{
  open: boolean;
  onOk: () => void;
  onClose: () => void;
  onRefresh: () => void;
}>;

const TypeManage: React.FC<IProps> = ({ open, onOk, onClose, onRefresh }) => {
  const [form] = Form.useForm();

  const [editing, setEditing] = useState(false);

  const [editingID, setEditingID] = useState<string | undefined>(undefined);

  const { state: appTypeState, refreshAppTypes } = useAppType();

  // 对 appTypes 进行排序
  const sortedAppTypes = useMemo(() => {
    if (!appTypeState.appTypes || appTypeState.appTypes.length === 0) return [];
    return [...appTypeState.appTypes].sort(
      (a, b) => (a.sort || 0) - (b.sort || 0)
    );
  }, [appTypeState.appTypes]);

  // 当组件打开时，刷新应用类型数据
  // 确保类型管理界面显示最新的类型列表
  useEffect(() => {
    if (open) {
      refreshAppTypes();
    }
  }, [open]);

  const addReq = useRequest(API.addAppType, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        refreshAppTypes();
        onOk();
      } else {
        notify(res.message);
      }
    },
  });

  const updateReq = useRequest(API.updateAppType, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        refreshAppTypes();
        onOk();
        onRefresh();
      } else {
        notify(res.message);
      }
    },
  });

  const deleteReq = useRequest(API.deleteAppType, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        refreshAppTypes();
        onOk();
      } else {
        notify(res.message);
      }
    },
  });

  async function handleFinish(fields: Record<string, any>) {
    if (!fields.typeName) return;

    setEditing(false);
    setEditingID(undefined);
    (editingID && editingID !== 'add' ? updateReq : addReq).run({
      id: editingID,
      typeName: fields.typeName,
      sort: fields.sort || 0,
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content>
        <Dialog.Title>
          <div>分类管理</div>
        </Dialog.Title>

        <Dialog.Description>
          <Form form={form} style={{ minHeight: 150 }} onFinish={handleFinish}>
            <Flex wrap="wrap" gap="2" align="center" style={{ marginTop: 16 }}>
              {appTypeState.loading && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Spinner />
                </div>
              )}

              {!appTypeState.loading &&
                sortedAppTypes.map((appType) => (
                  <Badge key={appType.id} size="3">
                    {editing && editingID === appType.id ? (
                      <Flex gap="2" align="center">
                        <Field name="typeName">
                          <TextField.Root
                            size="1"
                            placeholder="分类名称"
                          ></TextField.Root>
                        </Field>
                        <Field name="sort">
                          <TextField.Root
                            size="1"
                            type="number"
                            placeholder="排序"
                            min="0"
                          ></TextField.Root>
                        </Field>

                        <MdCheck onClick={form.submit} />

                        <MdClose
                          onClick={() => {
                            setEditing(false);
                            setEditingID(undefined);
                          }}
                        />
                      </Flex>
                    ) : (
                      <Flex gap="2" align="center" className={styles.appType}>
                        {appType.type_name}

                        <div>
                          <MdEdit
                            onClick={() => {
                              setEditing(true);
                              setEditingID(appType.id);
                              form.setFieldValue('typeName', appType.type_name);
                              form.setFieldValue('sort', appType.sort || 0);
                            }}
                          />

                          <MdDelete
                            color="red"
                            onClick={() => deleteReq.run({ id: appType.id })}
                          />
                        </div>
                      </Flex>
                    )}
                  </Badge>
                ))}

              <Badge size="3">
                {editing && editingID === 'add' ? (
                  <Flex gap="2" align="center">
                    <Field name="typeName">
                      <TextField.Root
                        size="1"
                        placeholder="分类名称"
                      ></TextField.Root>
                    </Field>
                    <Field name="sort">
                      <TextField.Root
                        size="1"
                        type="number"
                        placeholder="排序"
                        min="0"
                      ></TextField.Root>
                    </Field>

                    <MdCheck onClick={form.submit} />

                    <MdClose
                      onClick={() => {
                        setEditing(false);
                        setEditingID(undefined);
                      }}
                    />
                  </Flex>
                ) : (
                  <Flex
                    align="center"
                    gap="2"
                    onClick={() => {
                      setEditing(true);
                      setEditingID('add');
                    }}
                  >
                    添加
                    <MdAdd />
                  </Flex>
                )}
              </Badge>
            </Flex>
          </Form>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(TypeManage);
