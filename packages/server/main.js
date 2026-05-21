import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import geoip from 'geoip-lite';
import AppController from './routes/app.js';
import UtilController from './routes/util.js';
import multer from 'multer';

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

// 配置静态文件服务
const app = express();

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
  
  // 构建日志记录
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip,
    location,
    userAgent
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

// 获取日志的接口（仅管理员可访问）
app.get('/api/visit/logs', (req, res) => {
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

app.use(express.json());

// 创建上传目录
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 初始化获取token
TokenUtil.getToken();

// 执行初始化
initialize();

// 搜索应用数据
app.get('/api/app/search', AppController.appSearch);

// 新增应用的API
app.post('/api/app', AppController.addApp);

app.put('/api/app', AppController.editApp);

// 删除应用
app.delete('/api/app', AppController.deleteApp);

// 苹果应用商店图标获取API
app.get('/api/app/apple-store-icon', AppController.getIconFromAppleStore);

// 根据类型获取应用
app.get('/api/app/by-type', AppController.getAppsByType);

// 导入JSON数据
app.post(
  '/api/app/import-json',
  upload.single('file'),
  AppController.importJson
);

app.get('/api/app-types/list', AppTypeController.typeList);

app.post('/api/app-types', AppTypeController.addAppType);

app.put('/api/app-types', AppTypeController.updateAppType);

app.delete('/api/app-types', AppTypeController.deleteAppType);

// 下载图标文件的API
app.get('/api/util/download-icon', UtilController.downloadIcon);

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
