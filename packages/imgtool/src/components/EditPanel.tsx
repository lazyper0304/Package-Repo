import React, { useState, useEffect, useCallback } from 'react';
import { Flex, Text, TextField, Switch, Button, Select, Separator } from '@radix-ui/themes';
import styles from './EditPanel.module.less';

type Props = {
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  onExport: (width: number, height: number, format: string) => void;
  disabled?: boolean;
};

const FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'bmp', label: 'BMP' },
  { value: 'webp', label: 'WebP' },
];

export const EditPanel: React.FC<Props> = ({
  originalWidth,
  originalHeight,
  originalFormat,
  onExport,
  disabled,
}) => {
  const [width, setWidth] = useState(originalWidth);
  const [height, setHeight] = useState(originalHeight);
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState(originalFormat || 'png');

  useEffect(() => {
    setWidth(originalWidth);
    setHeight(originalHeight);
  }, [originalWidth, originalHeight]);

  useEffect(() => {
    if (originalFormat) {
      setFormat(originalFormat);
    }
  }, [originalFormat]);

  const handleWidthChange = useCallback(
    (value: string) => {
      const w = parseInt(value) || 0;
      setWidth(w);
      if (lockRatio && originalWidth > 0) {
        const ratio = originalHeight / originalWidth;
        setHeight(Math.round(w * ratio));
      }
    },
    [lockRatio, originalWidth, originalHeight]
  );

  const handleHeightChange = useCallback(
    (value: string) => {
      const h = parseInt(value) || 0;
      setHeight(h);
      if (lockRatio && originalHeight > 0) {
        const ratio = originalWidth / originalHeight;
        setWidth(Math.round(h * ratio));
      }
    },
    [lockRatio, originalWidth, originalHeight]
  );

  const handleExport = () => {
    if (width > 0 && height > 0) {
      onExport(width, height, format);
    }
  };

  return (
    <div className={styles.panel}>
      <Text size="4" weight="bold" style={{ marginBottom: 16 }}>
        编辑
      </Text>

      <Flex direction="column" gap="4" style={{ flex: 1, overflow: 'auto' }}>
        {/* 尺寸调整 */}
        <Text size="3" weight="bold">尺寸</Text>
        <Flex gap="4" align="center">
          <Flex direction="column" style={{ flex: 1 }}>
            <Text size="2" color="gray" style={{ marginBottom: 4 }}>原始宽度</Text>
            <TextField.Root
              size="2"
              value={originalWidth.toString()}
              disabled
            />
          </Flex>
          <Flex direction="column" style={{ flex: 1 }}>
            <Text size="2" color="gray" style={{ marginBottom: 4 }}>原始高度</Text>
            <TextField.Root
              size="2"
              value={originalHeight.toString()}
              disabled
            />
          </Flex>
        </Flex>

        <Flex gap="4" align="center">
          <Flex direction="column" style={{ flex: 1 }}>
            <Text size="2" color="gray" style={{ marginBottom: 4 }}>新宽度</Text>
            <TextField.Root
              size="2"
              type="number"
              value={width.toString()}
              onChange={(e) => handleWidthChange(e.target.value)}
              disabled={disabled}
            />
          </Flex>
          <Flex direction="column" style={{ flex: 1 }}>
            <Text size="2" color="gray" style={{ marginBottom: 4 }}>新高度</Text>
            <TextField.Root
              size="2"
              type="number"
              value={height.toString()}
              onChange={(e) => handleHeightChange(e.target.value)}
              disabled={disabled}
            />
          </Flex>
        </Flex>

        <Flex gap="2" align="center">
          <Switch
            checked={lockRatio}
            onCheckedChange={setLockRatio}
            disabled={disabled}
          />
          <Text size="2">锁定比例</Text>
        </Flex>

        <Separator style={{ margin: '8px 0' }} />

        {/* 格式转换 */}
        <Text size="3" weight="bold">格式</Text>
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

        <Button onClick={handleExport} disabled={disabled} size="3" style={{ marginTop: 'auto' }}>
          导出
        </Button>
      </Flex>
    </div>
  );
};
