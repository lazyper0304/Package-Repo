import type { AppTypeEntity } from '@/entities/appType';
import API from '@/services';
import {
  Badge,
  Button,
  DataList,
  Dialog,
  Flex,
  TextField,
} from '@radix-ui/themes';
import Form, { Field } from '@rc-component/form';
import { useRequest } from 'ahooks';
import React, { useState } from 'react';
import { MdAdd, MdCheck, MdClose, MdDelete, MdEdit } from 'react-icons/md';
import styles from './index.module.less';
import { notify } from '@/utils/notify';

type IProps = Readonly<{
  open: boolean;
  onOk: () => void;
  onClose: () => void;
  onRefresh: () => void;
}>;

const TypeManage: React.FC<IProps> = ({ open, onOk, onClose, onRefresh }) => {
  const [form] = Form.useForm();

  const [appTypes, setAppTypes] = useState<AppTypeEntity.ListItem[]>([]);

  const [editing, setEditing] = useState(false);

  const [editingID, setEditingID] = useState<string | undefined>(undefined);

  const request = useRequest(API.appTypeList, {
    onSuccess(res) {
      setAppTypes(res?.data ?? []);
    },
  });

  const addReq = useRequest(API.addAppType, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        request.refresh();
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
        request.refresh();
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
        request.refresh();
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
          <Form form={form} onFinish={handleFinish}>
            <Flex wrap="wrap" gap="2" align="center" style={{ marginTop: 16 }}>
              {appTypes.map((appType) => (
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
