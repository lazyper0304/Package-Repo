import { Card, Dialog, Flex, ScrollArea, Text } from '@radix-ui/themes';
import { useRequest, useSetState } from 'ahooks';
import React, { useRef } from 'react';
import styles from './index.module.less';
import classnames from 'classnames';
import API from '@/services';
import { AiOutlineLoading } from 'react-icons/ai';
import { notify } from '@/utils/notify';

type IProps = Readonly<{ open: boolean; onClose: () => void }>;

type ProcessedFile = {
  name: string;
  bgUrl: string;
  fgUrl: string;
};

const HarmonyIconSingle: React.FC<IProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLInputElement>(null);

  const [state, setState] = useSetState({
    fileName: '',
    processedFiles: [] as ProcessedFile[],
    success: false,
  });

  const uploadReq = useRequest(API.harmonyIconSingle, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        notify('转鸿蒙双层图标成功');

        if (res.files) {
          setState({ success: true, processedFiles: res.files });
          // 处理完成后自动发起下载请求
          setTimeout(() => {
            // 使用 fetch API 来发起下载请求，避免打开新标签页
            fetch('/api/excel/download-all-icons')
              .then((response) => {
                if (!response.ok) {
                  throw new Error('下载失败');
                }
                return response.blob();
              })
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `icons_${Date.now()}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              })
              .catch((error) => {
                console.error('下载失败:', error);
                notify('下载失败，请重试');
              });
          }, 500);
        } else {
          // 保持对单个文件的兼容
          setState({
            success: true,
            processedFiles: [
              { name: state.fileName, bgUrl: res.bgUrl, fgUrl: res.fgUrl },
            ],
          });
          // 处理完成后自动发起下载请求
          setTimeout(() => {
            // 使用 fetch API 来发起下载请求，避免打开新标签页
            fetch('/api/excel/download-all-icons')
              .then((response) => {
                if (!response.ok) {
                  throw new Error('下载失败');
                }
                return response.blob();
              })
              .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `icons_${Date.now()}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              })
              .catch((error) => {
                console.error('下载失败:', error);
                notify('下载失败，请重试');
              });
          }, 500);
        }
      }
    },
  });

  function handleClick() {
    if (uploadReq.loading) return;

    ref.current?.click();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    // 遍历所有文件，添加到 formData 中
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setState({ fileName: files[0].name, success: false, processedFiles: [] });

    uploadReq.run(formData);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    const files = e.dataTransfer.files;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    // 遍历所有文件，添加到 formData 中
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    setState({ fileName: files[0].name, success: false, processedFiles: [] });

    uploadReq.run(formData);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="760px">
        <Dialog.Title>
          <div>单个图标转鸿蒙图标</div>
        </Dialog.Title>

        <Dialog.Description>
          <div
            className={classnames(
              styles.harmonyIcon,
              uploadReq.loading ? styles['harmonyIcon--disabled'] : undefined
            )}
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input
              key={uploadReq.loading}
              ref={ref}
              type="file"
              accept=".png"
              multiple
              disabled={uploadReq.loading}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ marginBottom: 24, fontSize: 24 }}>
              {uploadReq.loading ? (
                <AiOutlineLoading className="loading" />
              ) : (
                '📊'
              )}
            </div>

            <Flex direction="column">
              <p>点击或拖拽文件到此处上传</p>
              <span>{`com.test.app.png -> com.test.app_bg.png, com.test.app_fg.png`}</span>
              <span>支持多个 .png 格式文件同时上传 (256*256)</span>
            </Flex>
          </div>

          {state.success && state.processedFiles.length > 0 && (
            <div className={styles.harmonyIcon__preview}>
              <Card>
                <Flex justify="between" style={{ marginBottom: 16 }}>
                  <Text size="5">处理结果</Text>

                  <Card style={{ padding: '3px 6px', fontSize: 13 }}>
                    <Text color="gray">{state.fileName}</Text>
                  </Card>
                </Flex>

                <ScrollArea style={{ maxHeight: 500 }}>
                  {state.processedFiles.map((file, index) => (
                    <Card key={index} style={{ marginBottom: 16, padding: 16 }}>
                      <Flex justify="between" style={{ marginBottom: 8 }}>
                        <Text>{file.name}</Text>
                      </Flex>

                      <Flex gap="3" justify="between">
                        <Flex gap="3" direction="column" style={{ flex: 1 }}>
                          <Text color="gray">背景</Text>

                          <Card style={{ flex: 1 }}>
                            <img src={file.bgUrl} />
                            <Card
                              style={{
                                display: 'inline-block',
                                float: 'right',
                                padding: '3px 6px',
                                fontSize: 13,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {file.name.replace('.png', '')}_bg.png
                            </Card>
                          </Card>
                        </Flex>

                        <Flex gap="3" direction="column" style={{ flex: 1 }}>
                          <Text color="gray">前景</Text>

                          <Card style={{ flex: 1 }}>
                            <img src={file.fgUrl} />
                            <Card
                              style={{
                                display: 'inline-block',
                                float: 'right',
                                padding: '3px 6px',
                                fontSize: 13,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {file.name.replace('.png', '')}_fg.png
                            </Card>
                          </Card>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </ScrollArea>
              </Card>
            </div>
          )}
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(HarmonyIconSingle);
