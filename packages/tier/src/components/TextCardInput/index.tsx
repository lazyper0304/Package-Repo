import React, { useState } from 'react';
import { Button, TextField } from '@radix-ui/themes';
import { MdAdd } from 'react-icons/md';
import { useTierList } from '../../store/TierListContext';

export const TextCardInput: React.FC = () => {
  const { dispatch } = useTierList();
  const [text, setText] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({
      type: 'ADD_POOL_ITEM',
      item: { id: crypto.randomUUID(), type: 'text', content: trimmed },
    });
    setText('');
  };

  return (
    <TextField.Root
      size="2"
      placeholder="输入文字..."
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      style={{ width: 160 }}
    >
      <TextField.Slot side="right">
        <Button size="1" variant="ghost" onClick={handleAdd} disabled={!text.trim()}>
          <MdAdd />
        </Button>
      </TextField.Slot>
    </TextField.Root>
  );
};
