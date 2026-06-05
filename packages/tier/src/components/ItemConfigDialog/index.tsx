import React, { useState, useEffect } from 'react';
import { Dialog, Button, Flex, Text, Box, Card } from '@radix-ui/themes';
import type { TierItem } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  item: TierItem | null;
  onSave: (changes: { textColor?: string; backgroundColor?: string }) => void;
}

export const ItemConfigDialog: React.FC<Props> = ({ open, onClose, item, onSave }) => {
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#f1f5f9');

  useEffect(() => {
    if (item) {
      setTextColor(item.textColor || '#000000');
      setBackgroundColor(item.backgroundColor || '#f1f5f9');
    }
  }, [item]);

  if (!item) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ textColor, backgroundColor });
    onClose();
  };

  const previewStyle: React.CSSProperties = {
    width: 112,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: textColor,
    background: backgroundColor,
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content>
        <Dialog.Title>配置卡片</Dialog.Title>
        <form onSubmit={handleSave}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" size="2" mb="1">
                预览
              </Text>
              <Flex justify="center" mt="2">
                <Card style={previewStyle}>
                  {item.type === 'text' ? (
                    <span style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', padding: 6 }}>
                      {item.content}
                    </span>
                  ) : (
                    <img
                      src={item.content}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                    />
                  )}
                </Card>
              </Flex>
            </Box>
            <Box>
              <Text as="label" size="2" mb="1">
                文字颜色
              </Text>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: '100%', height: 32, border: 'none', cursor: 'pointer' }}
              />
            </Box>
            <Box>
              <Text as="label" size="2" mb="1">
                背景颜色
              </Text>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{ width: '100%', height: 32, border: 'none', cursor: 'pointer' }}
              />
            </Box>
            <Flex gap="3" justify="end" mt="4">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button">
                  取消
                </Button>
              </Dialog.Close>
              <Button type="submit">保存</Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};
