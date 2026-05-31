import React, { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import API from '@/services';

type IProps = {
  open: boolean;
  expired?: boolean;
  onLoginSuccess: () => void;
};

const LoginDialog: React.FC<IProps> = ({ open, expired, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!username || !password) {
      setError('请输入账号和密码');
      return;
    }
    setError('');
    setLoading(true);
    const res = await API.login({ username, password });
    setLoading(false);
    if (res.success) {
      setUsername('');
      setPassword('');
      setError('');
      onLoginSuccess();
    } else {
      setError(res.message || '登录失败');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }

  return (
    <Dialog.Root open={open}>
      <Dialog.Content
        maxWidth="400px"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <Dialog.Title>{expired ? '登录已过期' : '管理员认证'}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          {expired ? '请重新登录以继续操作' : '请输入账号密码以访问管理页面'}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              账号
            </Text>
            <TextField.Root
              placeholder="请输入账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              密码
            </Text>
            <TextField.Root
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </label>

          {error && (
            <Text color="red" size="2">
              {error}
            </Text>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" onClick={() => (window.location.href = '/')}>
            返回首页
          </Button>
          <Button loading={loading} onClick={handleLogin}>
            登录
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default LoginDialog;
