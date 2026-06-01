import React, { useRef } from 'react';
import { Button } from '@radix-ui/themes';
import { MdImage, MdCollections } from 'react-icons/md';
import { useTierList } from '../../store/TierListContext';

export const ImageImporter: React.FC = () => {
  const { dispatch } = useTierList();
  const singleRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({
          type: 'ADD_POOL_ITEM',
          item: { id: crypto.randomUUID(), type: 'image', content: reader.result as string },
        });
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <>
      <input
        ref={singleRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <input
        ref={batchRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <Button size="2" variant="soft" onClick={() => singleRef.current?.click()}>
        <MdImage /> 本地图片
      </Button>
      <Button size="2" variant="soft" onClick={() => batchRef.current?.click()}>
        <MdCollections /> 批量导入
      </Button>
    </>
  );
};
