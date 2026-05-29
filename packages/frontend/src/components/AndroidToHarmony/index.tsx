import { Dialog, Button, Flex, Text, Badge, ScrollArea } from '@radix-ui/themes';
import { useRequest } from 'ahooks';
import React, { useRef, useState } from 'react';
import styles from './index.module.less';
import classnames from 'classnames';
import API from '@/services';
import { AiOutlineLoading } from 'react-icons/ai';
import { notify } from '@/utils/notify';
import JSZip from 'jszip';

type IProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

type QueueItem = {
  androidPkg: string;
  harmonyPkg?: string;
  status: 'matched' | 'unmatched';
};

type Result = {
  total: number;
  matched: number;
  exported: number;
  queue: QueueItem[];
};

const AndroidToHarmony: React.FC<IProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const mappingReq = useRequest(API.getHarmonyMapping, {
    manual: true,
  });

  function handleClick() {
    if (loading) return;
    ref.current?.click();
  }

  async function processFiles(files: FileList) {
    if (!files || files.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      // 提取安卓包名
      const fileMap = new Map<string, File>();
      const androidPackages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.png')) continue;
        const androidPkg = file.name.replace(/\.png$/i, '');
        fileMap.set(androidPkg, file);
        androidPackages.push(androidPkg);
      }

      if (androidPackages.length === 0) {
        notify('没有有效的 PNG 文件');
        setLoading(false);
        return;
      }

      // 查询后端获取映射关系
      const res = await mappingReq.runAsync({ androidPackages });

      if (!res.success) {
        notify(res.message || '查询失败');
        setLoading(false);
        return;
      }

      const harmonyMap = res.mapping;

      // 构建队列
      const queue: QueueItem[] = [];
      const matchedFiles: { harmonyPkg: string; file: File }[] = [];

      for (const androidPkg of androidPackages) {
        const harmonyPkg = harmonyMap[androidPkg];
        if (harmonyPkg) {
          queue.push({ androidPkg, harmonyPkg, status: 'matched' });
          matchedFiles.push({ harmonyPkg, file: fileMap.get(androidPkg)! });
        } else {
          queue.push({ androidPkg, status: 'unmatched' });
        }
      }

      // 有匹配的才打包下载
      if (matchedFiles.length > 0) {
        const zip = new JSZip();
        for (const { harmonyPkg, file } of matchedFiles) {
          const arrayBuffer = await file.arrayBuffer();
          zip.file(`${harmonyPkg}.png`, arrayBuffer);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `android-to-harmony-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(zipUrl);

        notify(`转换完成，导出 ${matchedFiles.length} 个文件`);
      } else {
        notify('没有匹配到鸿蒙包名');
      }

      setResult({
        total: androidPackages.length,
        matched: matchedFiles.length,
        exported: matchedFiles.length,
        queue,
      });
    } catch (error) {
      console.error('转换失败:', error);
      notify('转换失败，请重试');
    } finally {
      setLoading(false);
    }
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

  function handleClose() {
    setResult(null);
    onClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Content style={{ maxWidth: 520 }}>
        <Dialog.Title>安卓包名转鸿蒙包名</Dialog.Title>

        <Dialog.Description>
          {!result ? (
            <div
              className={classnames(
                styles.uploadArea,
                loading ? styles['uploadArea--disabled'] : undefined
              )}
              onClick={handleClick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <input
                key={loading ? 1 : 0}
                ref={ref}
                type="file"
                accept=".png"
                multiple
                disabled={loading}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div style={{ marginBottom: 24, fontSize: 24 }}>
                {loading ? (
                  <AiOutlineLoading className="loading" />
                ) : (
                  '📦'
                )}
              </div>
              <p>点击或拖拽 PNG 文件到此处上传</p>
              <span>文件名将被视为安卓包名（如 com.example.app.png）</span>
            </div>
          ) : (
            <div className={styles.result}>
              <div className={styles.result__header}>
                <Text size="3" weight="bold">转换结果</Text>
              </div>

              <div className={styles.result__stats}>
                <Flex gap="3" wrap="wrap">
                  <Badge color="gray" size="2">
                    总计: {result.total}
                  </Badge>
                  <Badge color="green" size="2">
                    匹配: {result.matched}
                  </Badge>
                  <Badge color="red" size="2">
                    未匹配: {result.total - result.matched}
                  </Badge>
                </Flex>
              </div>

              <div className={styles.result__queue}>
                <Text size="2" color="gray" style={{ marginBottom: 8, display: 'block' }}>转换队列：</Text>
                <ScrollArea style={{ maxHeight: 300 }}>
                  {result.queue.map((item, i) => (
                    <div key={i} className={styles.result__queueItem}>
                      <Flex justify="between" align="center">
                        <Text size="1" className={styles.result__pkgName}>
                          {item.androidPkg}
                        </Text>
                        {item.status === 'matched' ? (
                          <Flex align="center" gap="1">
                            <Text size="1" color="green">→</Text>
                            <Text size="1" className={styles.result__pkgName} style={{ color: 'var(--green-11)' }}>
                              {item.harmonyPkg}
                            </Text>
                          </Flex>
                        ) : (
                          <Badge color="red" size="1" variant="soft">未匹配</Badge>
                        )}
                      </Flex>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <Flex gap="2" justify="end" mt="4">
                <Button variant="soft" onClick={handleClose}>
                  关闭
                </Button>
                <Button onClick={() => setResult(null)}>
                  继续转换
                </Button>
              </Flex>
            </div>
          )}
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(AndroidToHarmony);
