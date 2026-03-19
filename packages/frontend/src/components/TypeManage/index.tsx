import type { AppTypeEntity } from '@/entities/appType'
import API from '@/services'
import { Badge, Button, DataList, Dialog, Flex, TextField } from '@radix-ui/themes'
import Form, { Field } from '@rc-component/form'
import { useRequest } from 'ahooks'
import React, { useState } from 'react'
import { MdClose } from 'react-icons/md'

type IProps = Readonly<{ open: boolean; onOk: () => void; onClose: () => void }>

const TypeManage: React.FC<IProps> = ({ open, onOk, onClose }) => {
  const [appTypes, setAppTypes] = useState<AppTypeEntity.ListItem[]>([])

  const request = useRequest(API.appTypeList, {
    onSuccess(res) {
      setAppTypes(res?.data ?? [])
    },
  })

  const addReq = useRequest(API.addAppType, {
    manual: true,
    onSuccess(res) {
      request.refresh()
      onOk()
    },
  })

  const deleteReq = useRequest(API.deleteAppType, {
    manual: true,
    onSuccess(res) {
      request.refresh()
      onOk()
    },
  })

  async function handleFinish(fields: Record<string, any>) {
    if (!fields.typeName) return

    addReq.run({ typeName: fields.typeName })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content>
        <Dialog.Title>
          <div>分类管理</div>
        </Dialog.Title>

        <Dialog.Description>
          <Form onFinish={handleFinish}>
            <Flex gap='2'>
              <Field name='typeName'>
                <TextField.Root></TextField.Root>
              </Field>
              <Button type='submit'>添加</Button>
            </Flex>
          </Form>

          <Flex gap='2' style={{ marginTop: 16 }}>
            {appTypes.map((appType) => (
              <Badge key={appType.id}>
                {appType.type_name} <MdClose onClick={() => deleteReq.run({ id: appType.id })} />
              </Badge>
            ))}
          </Flex>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  )
}

export default React.memo(TypeManage)
