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

const HarmonyIconFolder: React.FC<IProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLInputElement>(null);

  const [state, setState] = useSetState({
    fileName: '',
    success: false,
    processedFiles: [] as ProcessedFile[],
  });

  const uploadReq = useRequest(API.harmonyIconFolder, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        notify('鸿蒙图标文件夹转 bgfg 图标成功');

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
      formData.append('relativePaths', files[i].webkitRelativePath);
    }

    setState({
      fileName: files[0].webkitRelativePath.split('/')[0],
      success: false,
      processedFiles: [],
    });

    uploadReq.run(formData);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    const files = e.dataTransfer.files;

    if (!files || files.length === 0) return;

    const formData = new FormData();

    // 遍历所有文件，添加到 formData 中
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
      formData.append('relativePaths', files[i].webkitRelativePath);
    }

    setState({
      fileName: files[0].webkitRelativePath.split('/')[0],
      success: false,
      processedFiles: [],
    });

    uploadReq.run(formData);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="760px">
        <Dialog.Title>
          <div>鸿蒙图标文件夹转 bgfg 图标</div>
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
              webkitdirectory="true"
              directory="true"
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
              <p>点击或拖拽文件夹到此处上传</p>
              <span>{`com.test.app/entry/background.png -> com.test.app_bg.png`}</span>
              <span>{`com.test.app/entry/foreground.png -> com.test.app_fg.png`}</span>
              <span>支持包含鸿蒙图标的文件夹上传</span>
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
                              {file.name}_bg.png
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
                              {file.name}_fg.png
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

export default React.memo(HarmonyIconFolder);
