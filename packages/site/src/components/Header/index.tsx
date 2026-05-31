import { useState, useCallback } from 'react'
import styles from './index.module.less'
import { MdPerson, MdDescription, MdPeople } from 'react-icons/md'
import { MdBrightness2, MdBrightnessAuto, MdBrightnessHigh } from 'react-icons/md'
import { Flex, IconButton } from '@radix-ui/themes'
import { useNavigate } from 'react-router'
import { LoginDialog } from '../LoginDialog'
import { LogViewer } from '../LogViewer'
import { AccountManager } from '../AccountManager'

type ThemeMode = 'light' | 'dark' | 'system'

interface HeaderProps {
  themeMode: ThemeMode
  setThemeMode: (value: ThemeMode) => void
  isLoggedIn: boolean
  setIsLoggedIn: (value: boolean) => void
}

export function Header({ themeMode, setThemeMode, isLoggedIn, setIsLoggedIn }: HeaderProps) {
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)

  const cycleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light')
  }, [themeMode, setThemeMode])

  const themeIcon = {
    light: <MdBrightnessHigh size={20} />,
    dark: <MdBrightness2 size={20} />,
    system: <MdBrightnessAuto size={20} />,
  }[themeMode]

  const themeLabel = { light: '浅色', dark: '深色', system: '跟随系统' }[themeMode]

  return (
    <header className={styles.header}>
      <Flex align='center' gap='3' style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} />
        <h1>Vince Hub {isLoggedIn ? '(Admin)' : ''}</h1>
      </Flex>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <IconButton variant='soft' size='3' radius='full' onClick={cycleTheme} title={`当前: ${themeLabel}，点击切换`}>
          {themeIcon}
        </IconButton>
        {isLoggedIn && (
          <>
            <IconButton variant='soft' size='3' radius='full' onClick={() => setShowAccounts(true)} title='账号管理'>
              <MdPeople size={20} />
            </IconButton>
            <IconButton variant='soft' size='3' radius='full' onClick={() => setShowLogs(true)} title='访问日志'>
              <MdDescription size={20} />
            </IconButton>
          </>
        )}
        <IconButton
          variant='soft'
          size='3'
          radius='full'
          onClick={() => setShowLogin(true)}
          title={isLoggedIn ? '管理员' : '登录'}
        >
          <MdPerson size={20} />
        </IconButton>
      </div>

      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
      <LogViewer open={showLogs} onClose={() => setShowLogs(false)} />
      <AccountManager open={showAccounts} onClose={() => setShowAccounts(false)} />
    </header>
  )
}
