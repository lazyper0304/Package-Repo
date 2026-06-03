import React, { useState, useEffect, useCallback } from 'react';
import { Flex, Text, TextField, Switch, Button, Select } from '@radix-ui/themes';
import styles from './ResizePanel.module.less';

type Props = {
  originalWidth: number;
  originalHeight: number;
  onResize: (width: number, height: number) => void;
  disabled?: boolean;
};

export const ResizePanel: React.FC<Props> = ({
  originalWidth,
  originalHeight,
  onResize,
  disabled,
}) => {
  const [width, setWidth] = useState(originalWidth);
  const [height, setHeight] = useState(originalHeight);
  const [lockRatio, setLockRatio] = useState(true);

  useEffect(() => {
    setWidth(originalWidth);
    setHeight(originalHeight);
  }, [originalWidth, originalHeight]);

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

  const handleApply = () => {
    if (width > 0 && height > 0) {
      onResize(width, height);
    }
  };

  const handleReset = () => {
    setWidth(originalWidth);
    setHeight(originalHeight);
    onResize(originalWidth, originalHeight);
  };

  return (
    <div className={styles.panel}>
      <Text size="4" weight="bold" style={{ marginBottom: 16 }}>
        尺寸调整
      </Text>

      <Flex direction="column" gap="4">
        <Flex gap="4" align="center">
          <Flex direction="column" style={{ flex: 1 }}>
            <Text size="2" color="gray" style={{ marginBottom: 4 }}>宽度</Text>
            <TextField.Root
              size="2"
              type="number"
              value={width.toString()}
              onChange={(e) => handleWidthChange(e.target.value)}
              disabled={disabled}
            />
          </Flex>
          <Flex direction="column" style={{ flex: 1 }}>
            <Text size="2" color="gray" style={{ marginBottom: 4 }}>高度</Text>
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

        <Text size="2" color="gray">
          原始尺寸: {originalWidth} × {originalHeight}
        </Text>

        <Flex gap="2">
          <Button onClick={handleApply} disabled={disabled} style={{ flex: 1 }}>
            应用尺寸
          </Button>
          <Button onClick={handleReset} disabled={disabled} variant="soft" style={{ flex: 1 }}>
            重置
          </Button>
        </Flex>
      </Flex>
    </div>
  );
};
