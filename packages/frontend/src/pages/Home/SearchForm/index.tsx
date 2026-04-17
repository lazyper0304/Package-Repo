import {
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  TextField,
} from '@radix-ui/themes';
import React, { useRef } from 'react';
import { MdClose, MdSearch, MdHistory } from 'react-icons/md';
import useMobile from '@/hooks/useMobile';
import { useLocalStorageState, useClickAway } from 'ahooks';

type IProps = Readonly<{
  loading: boolean;
  onChange: (v: string) => void;
}>;

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 10;

const SearchForm: React.FC<IProps> = ({ loading, onChange }) => {
  const [keyword, setKeyword] = React.useState('');
  const [showHistory, setShowHistory] = React.useState(false);
  const [history, setHistory] = useLocalStorageState<string[]>(HISTORY_KEY, {
    defaultValue: [],
  });
  const isMobile = useMobile();
  const historyRef = useRef<HTMLDivElement>(null);

  function saveToHistory(value: string) {
    if (!value.trim()) return;

    const filtered = (history || []).filter((item) => item !== value);
    const updated = [value, ...filtered].slice(0, MAX_HISTORY);
    setHistory(updated);
  }

  function handleFocus() {
    if (!isMobile && history.length > 0) {
      setShowHistory((prev) => !prev);
    }
  }

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
      saveToHistory(keyword);
      setShowHistory(false);
    }
  }

  function handleClear() {
    setKeyword('');
    onChange('');
  }

  function handleSelectHistory(item: string) {
    setKeyword(item);
    onChange(item);
    setShowHistory(false);
  }

  function handleClearHistory() {
    setHistory([]);
  }

  return (
    <div style={{ position: 'relative' }}>
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
            onMouseEnter={handleFocus}
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

          <Button
            loading={loading}
            onClick={() => {
              onChange(keyword);
              saveToHistory(keyword);
            }}
          >
            搜索
          </Button>
        </Flex>
      </Card>

      {!isMobile && history.length > 0 && showHistory && (
        <div ref={historyRef}>
          <Card
            size="2"
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              top: 'calc(100% - 24px)',
              left: 24,
              right: 0,
              marginTop: 4,
              zIndex: 9999,
              maxHeight: 300,
              width: 'calc(100% - 106px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            onMouseLeave={() => setShowHistory(false)}
          >
            <Flex
              justify="between"
              align="center"
              style={{
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--gray-a6)',
              }}
            >
              <Flex align="center" gap="2">
                <MdHistory style={{ marginTop: -2 }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>搜索历史</span>
              </Flex>
              <Button
                size="1"
                variant="ghost"
                onClick={handleClearHistory}
                style={{ fontSize: 12 }}
              >
                清空
              </Button>
            </Flex>
            <Flex
              direction="column"
              gap="1"
              style={{ flex: 1, overflowY: 'auto' }}
            >
              <ScrollArea>
                {history.map((item, index) => (
                  <Flex
                    key={index}
                    align="center"
                    gap="2"
                    onClick={() => handleSelectHistory(item)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = 'var(--accent-9)';
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = 'transparent';
                    }}
                  >
                    <MdHistory style={{ opacity: 0.5 }} />
                    <span>{item}</span>
                  </Flex>
                ))}
              </ScrollArea>
            </Flex>
          </Card>
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchForm);
