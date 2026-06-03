import React, { useState } from 'react';
import { Button, TextField } from '@radix-ui/themes';
import { MdAdd } from 'react-icons/md';
import { useTierList } from '../../store/TierListContext';

export const TextCardInput: React.FC = () => {
  const { state, dispatch } = useTierList();
  const [text, setText] = useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // 检查是否重复
    const allItems = [
      ...state.poolItems,
      ...state.rows.flatMap((row) => row.items),
    ];
    const isDuplicate = allItems.some(
      (item) => item.type === 'text' && item.content === trimmed
    );

    if (isDuplicate) {
      alert(`"${trimmed}" 已存在，请勿重复添加`);
      return;
    }

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
