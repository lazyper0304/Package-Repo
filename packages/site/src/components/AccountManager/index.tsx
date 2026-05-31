import { useState, useEffect, useCallback } from 'react';
import { Dialog, Text, Table, Button, Flex, TextField } from '@radix-ui/themes';
import { getAuthToken } from '../../utils/auth';

interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
  last_login: string | null;
}

interface AccountManagerProps {
  open: boolean;
  onClose: () => void;
}

export function AccountManager({ open, onClose }: AccountManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  const handleCreate = async () => {
    if (!username || !password) { setError('请填写完整信息'); return; }
    const token = getAuthToken();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      setShowCreate(false); setUsername(''); setPassword(''); setError('');
      fetchUsers();
    } else {
      setError(data.message);
    }
  };

  const handleUpdate = async () => {
    if (!password || !editingUser) { setError('请填写密码'); return; }
    const token = getAuthToken();
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success) {
      setEditingUser(null); setPassword(''); setError('');
      fetchUsers();
    } else {
      setError(data.message);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`确定删除账号 ${user.username}？`)) return;
    const token = getAuthToken();
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) fetchUsers();
    else alert(data.message);
  };

  const resetForm = () => {
    setUsername(''); setPassword(''); setError('');
    setShowCreate(false); setEditingUser(null);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) { onClose(); resetForm(); } }}>
      <Dialog.Content maxWidth="700px">
        <Dialog.Title>账号管理</Dialog.Title>

        <Flex justify="end" mb="3">
          <Button size="2" onClick={() => { resetForm(); setShowCreate(true); }}>新建账号</Button>
        </Flex>

        {showCreate && (
          <Flex gap="2" mb="3" direction="column">
            <TextField.Root placeholder="用户名" value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextField.Root type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <Text size="2" color="red">{error}</Text>}
            <Flex gap="2">
              <Button size="2" onClick={handleCreate}>创建</Button>
              <Button size="2" variant="soft" onClick={() => setShowCreate(false)}>取消</Button>
            </Flex>
          </Flex>
        )}

        {editingUser && (
          <Flex gap="2" mb="3" direction="column">
            <Text size="2" color="gray">修改 {editingUser.username} 的密码</Text>
            <TextField.Root type="password" placeholder="新密码" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <Text size="2" color="red">{error}</Text>}
            <Flex gap="2">
              <Button size="2" onClick={handleUpdate}>保存</Button>
              <Button size="2" variant="soft" onClick={() => setEditingUser(null)}>取消</Button>
            </Flex>
          </Flex>
        )}

        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>用户名</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>密码(哈希)</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>创建时间</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>最后登录</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>操作</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {loading ? (
              <Table.Row><Table.Cell colSpan={5} style={{ textAlign: 'center' }}>加载中...</Table.Cell></Table.Row>
            ) : users.length > 0 ? (
              users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell><Text size="2" weight="bold">{user.username}</Text></Table.Cell>
                  <Table.Cell><Text size="2" style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>{user.password}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{new Date(user.created_at).toLocaleString()}</Text></Table.Cell>
                  <Table.Cell><Text size="2">{user.last_login ? new Date(user.last_login).toLocaleString() : '从未登录'}</Text></Table.Cell>
                  <Table.Cell>
                    <Flex gap="1">
                      <Button size="1" variant="soft" onClick={() => { resetForm(); setEditingUser(user); }}>改密</Button>
                      <Button size="1" variant="soft" color="red" onClick={() => handleDelete(user)}>删除</Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row><Table.Cell colSpan={5} style={{ textAlign: 'center' }}>暂无数据</Table.Cell></Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
