import React, { useState } from 'react';
import { Flex, Text, Button, Select } from '@radix-ui/themes';
import styles from './FormatPanel.module.less';

type Props = {
  originalFormat: string;
  onConvert: (format: string) => void;
  onDownload: (format: string) => void;
  disabled?: boolean;
};

const FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'bmp', label: 'BMP' },
  { value: 'webp', label: 'WebP' },
];

export const FormatPanel: React.FC<Props> = ({
  originalFormat,
  onConvert,
  onDownload,
  disabled,
}) => {
  const [format, setFormat] = useState('png');

  const handleConvert = () => {
    onConvert(format);
  };

  const handleDownload = () => {
    onDownload(format);
  };

  return (
    <div className={styles.panel}>
      <Text size="4" weight="bold" style={{ marginBottom: 16 }}>
        格式转换
      </Text>

      <Flex direction="column" gap="4">
        <Flex direction="column">
          <Text size="2" color="gray" style={{ marginBottom: 4 }}>原始格式</Text>
          <Text size="3">{originalFormat.toUpperCase() || '未知'}</Text>
        </Flex>

        <Flex direction="column">
          <Text size="2" color="gray" style={{ marginBottom: 4 }}>目标格式</Text>
          <Select.Root value={format} onValueChange={setFormat} disabled={disabled}>
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {FORMAT_OPTIONS.map((opt) => (
                <Select.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Flex gap="2">
          <Button onClick={handleConvert} disabled={disabled} style={{ flex: 1 }}>
            转换格式
          </Button>
          <Button onClick={handleDownload} disabled={disabled} variant="soft" style={{ flex: 1 }}>
            下载
          </Button>
        </Flex>
      </Flex>
    </div>
  );
};
