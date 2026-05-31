import { Card, Dialog, Flex, ScrollArea, Text } from '@radix-ui/themes';
import { useSetState } from 'ahooks';
import React, { useRef } from 'react';
import styles from './index.module.less';
import classnames from 'classnames';
import { AiOutlineLoading } from 'react-icons/ai';
import { notify } from '@/utils/notify';
import JSZip from 'jszip';

type IProps = Readonly<{ open: boolean; onClose: () => void }>;

type ProcessedFile = {
  name: string;
  bgUrl: string;
  fgUrl: string;
};

type Stats = {
  total: number;
  success: number;
  failed: number;
  supported: number;
};

const HarmonyIconSingle: React.FC<IProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLInputElement>(null);

  const [state, setState] = useSetState({
    fileName: '',
    processedFiles: [] as ProcessedFile[],
    success: false,
    loading: false,
    stats: { total: 0, success: 0, failed: 0, supported: 0 } as Stats,
  });

  // 在浏览器端处理图标转换
  async function processFiles(files: FileList) {
    if (!files || files.length === 0) return;

    const totalFiles = files.length;
    let successCount = 0;
    let failedCount = 0;
    let supportedCount = 0;

    setState({
      loading: true,
      fileName: files[0].name,
      success: false,
      processedFiles: [],
      stats: { total: totalFiles, success: 0, failed: 0, supported: 0 },
    });

    const processedFiles: ProcessedFile[] = [];
    const zip = new JSZip();

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 检查文件扩展名
        if (!file.name.toLowerCase().endsWith('.png')) {
          failedCount++;
          continue; // 跳过非PNG文件
        }

        supportedCount++;

        try {
          // 读取文件为 ArrayBuffer
          const arrayBuffer = await file.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'image/png' });

          // 生成_bg和_fg版本
          const baseName = file.name.replace('.png', '');
          const bgFileName = `${baseName}_bg.png`;
          const fgFileName = `${baseName}_fg.png`;

          // 创建 URL 用于预览
          const bgUrl = URL.createObjectURL(blob);
          const fgUrl = URL.createObjectURL(blob);

          // 添加到处理结果
          processedFiles.push({
            name: file.name,
            bgUrl,
            fgUrl,
          });

          // 添加到 zip 文件
          zip.file(bgFileName, blob);
          zip.file(fgFileName, blob);

          successCount++;
        } catch (error) {
          console.error(`处理文件 ${file.name} 失败:`, error);
          failedCount++;
        }
      }

      if (processedFiles.length === 0) {
        notify('没有有效的PNG文件');
        setState({
          loading: false,
          stats: {
            total: totalFiles,
            success: successCount,
            failed: failedCount,
            supported: supportedCount,
          },
        });
        return;
      }

      // 更新状态显示处理结果
      setState({
        success: true,
        processedFiles,
        loading: false,
        stats: {
          total: totalFiles,
          success: successCount,
          failed: failedCount,
          supported: supportedCount,
        },
      });

      notify('转鸿蒙双层图标成功');

      // 生成并下载 zip 文件
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `icons_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error('处理图标失败:', error);
      notify('处理图标失败，请重试');
      setState({
        loading: false,
        stats: {
          total: totalFiles,
          success: successCount,
          failed: failedCount,
          supported: supportedCount,
        },
      });
    }
  }

  function handleClick() {
    if (state.loading) return;

    ref.current?.click();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFiles(files);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    processFiles(files);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="1060px">
        <Dialog.Title>
          <div>单个图标转鸿蒙图标</div>
        </Dialog.Title>

        <Dialog.Description>
          <div
            className={classnames(
              styles.harmonyIcon,
              state.loading ? styles['harmonyIcon--disabled'] : undefined
            )}
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input
              key={state.loading}
              ref={ref}
              type="file"
              accept=".png"
              multiple
              disabled={state.loading}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ marginBottom: 24, fontSize: 24 }}>
              {state.loading ? <AiOutlineLoading className="loading" /> : '📊'}
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

                {/* 统计信息 */}
                <Card
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor: 'var(--gray-3)',
                  }}
                >
                  <Flex gap="4" justify="between">
                    <Flex direction="column" align="center">
                      <Text size="2" color="gray">
                        文件总数
                      </Text>
                      <Text size="5" weight="bold">
                        {state.stats.total}
                      </Text>
                    </Flex>
                    <Flex direction="column" align="center">
                      <Text size="2" color="gray">
                        支持转换
                      </Text>
                      <Text
                        size="5"
                        weight="bold"
                        style={{ color: 'var(--blue-9)' }}
                      >
                        {state.stats.supported}
                      </Text>
                    </Flex>
                    <Flex direction="column" align="center">
                      <Text size="2" color="gray">
                        成功
                      </Text>
                      <Text
                        size="5"
                        weight="bold"
                        style={{ color: 'var(--green-9)' }}
                      >
                        {state.stats.success}
                      </Text>
                    </Flex>
                    <Flex direction="column" align="center">
                      <Text size="2" color="gray">
                        失败
                      </Text>
                      <Text
                        size="5"
                        weight="bold"
                        style={{ color: 'var(--red-9)' }}
                      >
                        {state.stats.failed}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>

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
