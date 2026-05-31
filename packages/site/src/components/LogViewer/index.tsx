import { useState, useEffect } from 'react';
import { Dialog, Text, Table, Flex } from '@radix-ui/themes';
import { getAuthToken } from '../../utils/auth';

interface LogEntry {
  timestamp: string;
  ip: string;
  location: string;
  userAgent: string;
  username?: string;
}

interface LogResponse {
  success: boolean;
  data: LogEntry[];
  total: number;
  todayCount: number;
  current: number;
  pageSize: number;
}

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
}

export function LogViewer({ open, onClose }: LogViewerProps) {
  const [data, setData] = useState<LogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const pageSize = 10;

  const fetchLogs = async (page: number) => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/visit/logs?current=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setCurrent(json.current);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchLogs(1);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="800px">
        <Dialog.Title>访问日志</Dialog.Title>
        {data?.success && (
          <Text size="2" color="gray" mb="3" style={{ display: "block" }}>
            总访问量: {data.total} | 今日: {data.todayCount}
          </Text>
        )}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>账号</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>IP</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>归属地</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>时间</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={4} style={{ textAlign: 'center' }}>加载中...</Table.Cell>
              </Table.Row>
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((log) => (
                <Table.Row key={log.timestamp + log.ip}>
                  <Table.Cell><Text size="2">{log.username || '-'}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{log.ip}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{log.location}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{new Date(log.timestamp).toLocaleString()}</Text></Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={4} style={{ textAlign: 'center' }}>暂无日志</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>

        {data?.success && data.total > pageSize && (
          <Flex justify="end" gap="2" mt="4">
            <button
              disabled={current <= 1}
              onClick={() => fetchLogs(current - 1)}
              style={{ padding: '4px 12px', cursor: current <= 1 ? 'default' : 'pointer', opacity: current <= 1 ? 0.5 : 1 }}
            >
              上一页
            </button>
            <Text size="2" style={{ padding: '4px 8px' }}>
              {current} / {Math.ceil(data.total / pageSize)}
            </Text>
            <button
              disabled={current >= Math.ceil(data.total / pageSize)}
              onClick={() => fetchLogs(current + 1)}
              style={{ padding: '4px 12px', cursor: current >= Math.ceil(data.total / pageSize) ? 'default' : 'pointer', opacity: current >= Math.ceil(data.total / pageSize) ? 0.5 : 1 }}
            >
              下一页
            </button>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
