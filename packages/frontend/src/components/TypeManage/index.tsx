import type { AppTypeEntity } from '@/entities/appType';
import API from '@/services';
import {
  Badge,
  Button,
  DataList,
  Dialog,
  Flex,
  Spinner,
  TextField,
} from '@radix-ui/themes';
import Form, { Field } from '@rc-component/form';
import { useRequest } from 'ahooks';
import React, { useState, useEffect } from 'react';
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

              {appTypeState.appTypes.map((appType) => (
                <Badge key={appType.id} size="3">
                  {editing && editingID === appType.id ? (
                    <Flex gap="2" align="center">
                      <Field name="typeName">
                        <TextField.Root size="1"></TextField.Root>
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
                      <TextField.Root size="1"></TextField.Root>
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
