import { Dialog } from '@radix-ui/themes';
import { useRequest } from 'ahooks';
import React, { useRef } from 'react';
import styles from './index.module.less';
import classnames from 'classnames';
import API from '@/services';
import { AiOutlineLoading } from 'react-icons/ai';
import { notify } from '@/utils/notify';

type IProps = Readonly<{
  open: boolean;
  onClose: () => void;
  onUpload: () => void;
}>;

const ImportJson: React.FC<IProps> = ({ open, onClose, onUpload }) => {
  const ref = useRef<HTMLInputElement>(null);

  const jsonExample = `[
  {
    "app_name": "应用名称",
    "android_package": "com.example.app",
    "harmony_package": "com.example.harmony",
    "icon_url": "https://example.com/icon.png",
    "type": ["鸿蒙应用"]
  }
]`;

  const importReq = useRequest(API.importJson, {
    manual: true,
    onSuccess(res) {
      if (res.success) {
        notify('上传完成，请耐心等待服务端导入完成');
        onClose();
      } else {
        notify(res.message || '上传失败');
      }
    },
  });

  function handleClick() {
    if (importReq.loading) return;

    ref.current?.click();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    importReq.run(formData);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    importReq.run(formData);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose() && !importReq.loading}>
      <Dialog.Content>
        <Dialog.Title>上传JSON</Dialog.Title>

        <Dialog.Description>
          <div
            className={classnames(
              styles.importJson,
              importReq.loading ? styles['importJson--disabled'] : undefined
            )}
            onClick={handleClick}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <input
              key={importReq.loading}
              ref={ref}
              type="file"
              accept=".json"
              disabled={importReq.loading}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div style={{ marginBottom: 24, fontSize: 24 }}>
              {importReq.loading ? (
                <AiOutlineLoading className="loading" />
              ) : (
                '📄'
              )}
            </div>
            <p>点击或拖拽JSON文件到此处上传</p>
            <span>支持 .json格式</span>
            <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
              <p>JSON格式示例：</p>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, overflowX: 'auto', fontSize: 11, fontFamily: 'monospace' }}>
                {jsonExample}
              </pre>
            </div>
          </div>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default React.memo(ImportJson);