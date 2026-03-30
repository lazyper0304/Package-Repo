import React, { useState, useEffect } from 'react';
import { Dialog, Text, Table, Button, Flex } from '@radix-ui/themes';
import Pagination from '@/components/ui/Pagination';
import { useRequest } from 'ahooks';

interface LogEntry {
  timestamp: string;
  ip: string;
  location: string;
  userAgent: string;
}

interface LogResponse {
  success: boolean;
  data: LogEntry[];
  total: number;
  current: number;
  pageSize: number;
}

const LogViewer: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [current, setCurrent] = useState(1);
  const pageSize = 10;

  const fetchLogs = async (params: { current: number; pageSize: number }): Promise<LogResponse> => {
    const response = await fetch(`/api/visit/logs?current=${params.current}&pageSize=${params.pageSize}`);
    return response.json();
  };

  const { data, loading, run } = useRequest(fetchLogs, {
    manual: true,
    onSuccess: (res) => {
      if (res.success) {
        setCurrent(res.current);
      }
    },
  });

  useEffect(() => {
    if (open) {
      run({ current: 1, pageSize });
    }
  }, [open, run, pageSize]);

  const handlePageChange = (newCurrent: number) => {
    run({ current: newCurrent, pageSize });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Content maxWidth="800px">
        <Dialog.Title>访问日志</Dialog.Title>
        <Dialog.Description>
          <div style={{ marginTop: 16 }}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell style={{ minWidth: '100px' }}>IP地址</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ minWidth: '100px' }}>归属地</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ minWidth: '100px' }}>用户代理</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ minWidth: '100px' }}>时间</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} style={{ textAlign: 'center' }}>
                      加载中...
                    </Table.Cell>
                  </Table.Row>
                ) : data?.success ? (
                  data.data.length > 0 ? (
                    data.data.map((log, index) => (
                      <Table.Row key={index}>
                        <Table.Cell style={{ minWidth: '100px' }}>
                          <Text size="2">{log.ip}</Text>
                        </Table.Cell>
                        <Table.Cell style={{ minWidth: '100px' }}>
                          <Text size="2">{log.location}</Text>
                        </Table.Cell>
                        <Table.Cell style={{ minWidth: '100px' }}>
                          <Text size="2" style={{ wordBreak: 'break-all' }}>{log.userAgent}</Text>
                        </Table.Cell>
                        <Table.Cell style={{ minWidth: '100px' }}>
                          <Text size="2">{new Date(log.timestamp).toLocaleString()}</Text>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={4} style={{ textAlign: 'center' }}>
                        暂无日志记录
                      </Table.Cell>
                    </Table.Row>
                  )
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={4} style={{ textAlign: 'center' }}>
                      获取日志失败
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>

            {data?.success && data.total > 0 && (
              <Flex justify="end" style={{ marginTop: 16 }}>
                <Pagination
                  total={data.total}
                  pageSize={pageSize}
                  current={current}
                  onChange={handlePageChange}
                />
              </Flex>
            )}
          </div>
        </Dialog.Description>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default LogViewer;