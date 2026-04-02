import React from 'react';
import { Flex, Button } from '@radix-ui/themes';

type IProps = Readonly<{
  buttons: {
    label: string;
    onClick: () => void;
    variant?: 'solid' | 'soft' | 'outline';
    color?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
    disabled?: boolean;
    loading?: boolean;
    style?: React.CSSProperties;
  }[];
  gap?: string;
  style?: React.CSSProperties;
}>

const ButtonGroup: React.FC<IProps> = ({
  buttons,
  gap = '3',
  style,
}) => {
  return (
    <Flex gap={gap} style={{ ...style }}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant}
          color={button.color}
          disabled={button.disabled}
          loading={button.loading}
          onClick={button.onClick}
          style={button.style}
        >
          {button.label}
        </Button>
      ))}
    </Flex>
  );
};

export default React.memo(ButtonGroup);