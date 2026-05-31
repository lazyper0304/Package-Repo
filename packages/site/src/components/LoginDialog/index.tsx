import { useState, useMemo } from 'react';
import { Dialog, TextField, Button, Text, Flex } from '@radix-ui/themes';
import { login, getAuthToken, removeAuthToken } from "../../utils/auth";

function getUsernameFromToken(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || null;
  } catch {
    return null;
  }
}

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

export function LoginDialog({ open, onOpenChange, onLoginSuccess }: LoginDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!getAuthToken();
  const currentUser = useMemo(() => getUsernameFromToken(), [isLoggedIn, open]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      setUsername('');
      setPassword('');
      onLoginSuccess();
    } else {
      setError(result.message || '登录失败');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    onOpenChange(false);
    onLoginSuccess();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="400px">
        <Dialog.Title>{isLoggedIn ? '账号信息' : '管理员登录'}</Dialog.Title>

        {isLoggedIn ? (
          <Flex direction="column" gap="3" mt="4">
            <Text size="2" color="gray">
              已登录: <Text size="2" weight="bold">{currentUser || '未知'}</Text>
            </Text>
            <Button variant="outline" color="red" onClick={handleLogout}>
              退出登录
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" gap="3" mt="4">
            <TextField.Root
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <TextField.Root
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <Text size="2" color="red">{error}</Text>}
            <Button onClick={handleLogin} disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
