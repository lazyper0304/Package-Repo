import { useState } from "react";
import styles from "./index.module.less";
import { MdPerson, MdDescription } from "react-icons/md";
import { MdBrightness2, MdBrightnessAuto, MdBrightnessHigh } from "react-icons/md";
import { Flex, IconButton } from "@radix-ui/themes";
import { useTheme } from "../../hooks/useTheme";
import { useNavigate } from "react-router";
import { getAuthToken } from "../../utils/auth";
import { LoginDialog } from "../LoginDialog";
import { LogViewer } from "../LogViewer";

export function Header() {
  const { mode, cycleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());

  const themeIcon = {
    light: <MdBrightnessHigh size={20} />,
    dark: <MdBrightness2 size={20} />,
    system: <MdBrightnessAuto size={20} />,
  }[mode];

  const themeLabel = { light: "浅色", dark: "深色", system: "跟随系统" }[mode];

  return (
    <header className={styles.header}>
      <Flex align="center" gap="3" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} />
        <h1>Vince Hub {isLoggedIn ? "(Admin)" : ""}</h1>
      </Flex>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <IconButton
          variant="soft"
          size="3"
          radius="full"
          onClick={cycleTheme}
          title={`当前: ${themeLabel}，点击切换`}
        >
          {themeIcon}
        </IconButton>
        {isLoggedIn && (
          <IconButton
            variant="soft"
            size="3"
            radius="full"
            onClick={() => setShowLogs(true)}
            title="访问日志"
          >
            <MdDescription size={20} />
          </IconButton>
        )}
        <IconButton
          variant="soft"
          size="3"
          radius="full"
          onClick={() => setShowLogin(true)}
          title={isLoggedIn ? "管理员" : "登录"}
          style={isLoggedIn ? { color: "var(--accent)" } : undefined}
        >
          <MdPerson size={20} />
        </IconButton>
      </div>

      <LoginDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        onLoginSuccess={() => setIsLoggedIn(!!getAuthToken())}
      />
      <LogViewer open={showLogs} onClose={() => setShowLogs(false)} />
    </header>
  );
}
