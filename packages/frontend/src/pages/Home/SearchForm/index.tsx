import { Button, Card, Flex, Heading, TextField } from '@radix-ui/themes';
import React, { useCallback, useRef, useState } from 'react';
import { MdClose, MdSearch } from 'react-icons/md';

type IProps = Readonly<{
  loading: boolean;
  onChange: (v: string) => void;
}>;

const SearchForm: React.FC<IProps> = ({ loading, onChange }) => {
  const compositionRef = useRef(false);

  const [keyword, setKeyword] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) {
      onChange('');
    }

    // onChange(e.target.value);
    setKeyword(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      onChange(keyword);
    }
  }

  function handleClear() {
    setKeyword('');
    onChange('');
  }

  return (
    <>
      <Card size="3">
        <Heading as="h1" style={{ marginBottom: 24 }}>
          🔍 搜索应用
        </Heading>

        <Flex gap="2">
          <TextField.Root
            value={keyword}
            placeholder="输入关键字"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          >
            <TextField.Slot>
              <MdSearch />
            </TextField.Slot>

            {keyword.length > 0 && (
              <TextField.Slot style={{ cursor: 'pointer' }}>
                <MdClose onClick={handleClear} />
              </TextField.Slot>
            )}
          </TextField.Root>

          <Button loading={loading} onClick={() => onChange(keyword)}>
            搜索
          </Button>
        </Flex>
      </Card>
    </>
  );
};

export default React.memo(SearchForm);
