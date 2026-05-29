import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import geoip from 'geoip-lite';
import AppController from './routes/app.js';
import UtilController from './routes/util.js';
import multer from 'multer';
import jwt from 'jsonwebtoken';

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
import TokenUtil from './utils/token.js';
import { initialize } from './init.js';
import AppTypeController from './routes/appType.js';
import { pool, hashPassword } from './db.js';

// 配置静态文件服务
const app = express();

const JWT_SECRET = 'package-repo-secret-key-2024';
const TOKEN_EXPIRES = '30d';

// JWT 认证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ success: false, message: '未登录，请先登录', code: 401 });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { username: decoded.username };
    next();
  } catch (err) {
    return res.json({ success: false, message: 'token已过期，请重新登录', code: 401 });
  }
}

app.use(cors());

// 确保日志目录存在
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// 记录用户访问信息的接口
app.get('/api/visit/log', (req, res) => {
  // 获取用户IP
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  // 获取IP归属信息
  const geo = geoip.lookup(ip);
  const location = geo ? `${geo.country}-${geo.region}-${geo.city}` : 'Unknown';

  // 获取用户代理
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // 获取登录账号（如果有 token）
  let username = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
      username = decoded.username || '';
    } catch {}
  }

  // 构建日志记录
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip,
    location,
    userAgent,
    username
  };
  
  // 记录到控制台
  console.log(`${logEntry.timestamp} - IP: ${logEntry.ip} - Location: ${logEntry.location} - User-Agent: ${logEntry.userAgent}`);
  
  // 保存到日志文件
  const logFilePath = path.join('logs', 'access.log');
  fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', (err) => {
    if (err) {
      console.error('保存日志失败:', err);
    }
  });
  
  // 返回成功响应
  res.json({ success: true, message: '访问记录已保存' });
});

// 获取日志的接口（需要认证）
app.get('/api/visit/logs', authMiddleware, (req, res) => {
  try {
    const logFilePath = path.join('logs', 'access.log');
    
    // 检查日志文件是否存在
    if (!fs.existsSync(logFilePath)) {
      return res.json({ success: true, data: [], total: 0 });
    }
    
    // 读取日志文件
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    // 解析日志内容
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .reverse(); // 最新的日志在前
    
    // 计算今日访问量（分页前）
    const today = new Date().toISOString().split('T')[0];
    const todayCount = logs.filter(log => log.timestamp && log.timestamp.split('T')[0] === today).length;

    // 分页处理
    const current = parseInt(req.query.current) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const start = (current - 1) * pageSize;
    const end = start + pageSize;
    const paginatedLogs = logs.slice(start, end);

    res.json({
      success: true,
      data: paginatedLogs,
      total: logs.length,
      todayCount,
      current,
      pageSize
    });
  } catch (error) {
    console.error('获取日志失败:', error);
    res.json({ success: false, message: '获取日志失败' });
  }
});

app.use(express.json({ limit: '50mb' }));

// 创建上传目录
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 初始化获取token
TokenUtil.getToken();

// 执行初始化
initialize();

// 登录接口
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND password = ?',
      [username, hashPassword(password)]
    );
    if (rows.length > 0) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: '账号或密码错误' });
    }
  } catch (err) {
    console.error('登录失败:', err);
    res.json({ success: false, message: '登录失败' });
  }
});

// 验证 token 是否有效
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true });
});

// 搜索应用数据（无需认证）
app.get('/api/app/search', AppController.appSearch);

// 苹果应用商店图标获取API（无需认证）
app.get('/api/app/apple-store-icon', AppController.getIconFromAppleStore);

// 根据类型获取应用（无需认证）
app.get('/api/app/by-type', AppController.getAppsByType);

// 以下为需要认证的接口
app.post('/api/app', authMiddleware, AppController.addApp);

app.put('/api/app', authMiddleware, AppController.editApp);

app.delete('/api/app', authMiddleware, AppController.deleteApp);

app.post(
  '/api/app/import-json',
  authMiddleware,
  upload.single('file'),
  AppController.importJson
);

// 安卓包名转鸿蒙包名 - 查询映射
app.post('/api/app/harmony-mapping', AppController.getHarmonyMapping);

app.get('/api/app-types/list', AppTypeController.typeList);

app.post('/api/app-types', authMiddleware, AppTypeController.addAppType);

app.put('/api/app-types', authMiddleware, AppTypeController.updateAppType);

app.delete('/api/app-types', authMiddleware, AppTypeController.deleteAppType);

// 下载图标文件的API
app.get('/api/util/download-icon', UtilController.downloadIcon);

// 下载通用文件的API
app.get('/api/util/download-file', UtilController.downloadFile);

// 测试路由
app.get('/test', (req, res) => {
  res.send('服务器运行正常');
});

// 提供 dist 目录中的静态文件
app.use(express.static(path.join(process.cwd(), 'dist')));

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`代理服务运行在 http://localhost:${PORT}`);
});
