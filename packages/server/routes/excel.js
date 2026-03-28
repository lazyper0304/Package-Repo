import { pool } from '../db.js';
import multer from 'multer';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

// ES 模块兼容的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置Excel文件上传
export const uploadExcel = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 限制文件大小为10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/json'
    ) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel或者Json文件'), false);
    }
  },
});

// 配置鸿蒙图标文件上传
export const uploadHarmony = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为5MB
  // 移除文件类型过滤，以支持文件夹上传
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

export default class ExcelController {
  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' });
      }

      const filePath = req.file.path;
      const fileExtension = req.file.originalname
        .split('.')
        .pop()
        .toLowerCase();

      let data = [];

      // 根据文件类型解析数据
      if (fileExtension === 'json') {
        // 解析JSON文件
        const jsonContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(jsonContent);

        // 如果是数组，直接使用；如果是对象，转换为数组
        if (Array.isArray(jsonData)) {
          data = jsonData;
        } else if (typeof jsonData === 'object' && jsonData !== null) {
          data = [jsonData];
        }

        // 清理临时文件
        fs.unlinkSync(filePath);
      } else {
        // 解析Excel文件
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);

        // 清理临时文件
        fs.unlinkSync(filePath);
      }

      if (data.length === 0) {
        return res.status(400).json({ error: '文件为空或格式不正确' });
      }

      // 验证数据格式
      const validData = [];
      for (const row of data) {
        let appName, harmonyPackage, androidPackage, iconUrl;

        if (fileExtension === 'json') {
          // JSON格式字段映射
          appName = (row['a'] || row['app_name'] || row['应用名称']).toString();
          harmonyPackage = (
            row['h'] ||
            row['harmony_package'] ||
            row['harmony包名'] ||
            ''
          ).toString();
          androidPackage = (
            row['k'] ||
            row['android_package'] ||
            row['android包名'] ||
            ''
          ).toString();
          // iconUrl = row['i'] || row['icon_url'] || ''
        } else {
          // Excel格式字段映射
          appName = (
            row['应用名称'] ||
            row['应用名'] ||
            row['name'] ||
            row['app_name']
          ).toString();
          harmonyPackage = (
            row['鸿蒙包名'] ||
            row['包名'] ||
            row['package'] ||
            row['package_name']
          ).toString();
          androidPackage = (
            row['安卓包名'] ||
            row['android_package'] ||
            ''
          ).toString();
          // iconUrl = row['图标URL'] || row['icon_url'] || ''
        }

        // 验证必填字段：app_name必须存在
        if (appName && appName.trim() !== '') {
          validData.push({
            appName: String(appName).trim(),
            harmonyPackage: harmonyPackage ? String(harmonyPackage).trim() : '',
            androidPackage: androidPackage ? String(androidPackage).trim() : '',
            // iconUrl: iconUrl ? String(iconUrl).trim() : '',
          });
        }
      }

      if (validData.length === 0) {
        return res.status(400).json({ error: '未找到有效的应用数据' });
      }

      // 第一步：Excel内部去重
      const uniqueData = [];
      const internalDuplicateSet = new Set();
      let internalDuplicateCount = 0;

      for (const app of validData) {
        // 构建唯一标识，处理NULL值
        const uniqueKey = JSON.stringify({
          app_name: app.appName,
          harmony_package: app.harmonyPackage || null,
          android_package: app.androidPackage || null,
        });

        if (internalDuplicateSet.has(uniqueKey)) {
          internalDuplicateCount++;
        } else {
          internalDuplicateSet.add(uniqueKey);
          uniqueData.push(app);
        }
      }

      // 第二步：查询数据库中已存在的数据
      const [existingRows] = await pool.execute(
        `SELECT app_name, harmony_package, android_package FROM apps`
      );

      // 构建查找表
      const harmonyPackageSet = new Set();
      const appNameSet = new Set();

      existingRows.forEach((row) => {
        if (row.harmony_package) {
          harmonyPackageSet.add(row.harmony_package);
        }
        appNameSet.add(row.app_name);
      });

      // 第三步：插入不存在的数据
      let databaseDuplicateCount = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const app of uniqueData) {
        try {
          let isDuplicate = false;

          // 重复判断逻辑：
          // 1. 如果导入数据有 harmony_package，检查数据库中是否有相同 harmony_package
          // 2. 如果导入数据没有 harmony_package，检查数据库中是否有相同 app_name
          if (app.harmonyPackage) {
            // 如果有 harmony_package，优先按 harmony_package 判断
            if (harmonyPackageSet.has(app.harmonyPackage)) {
              isDuplicate = true;
              databaseDuplicateCount++;
            }
          } else {
            // 如果没有 harmony_package，按 app_name 判断
            if (appNameSet.has(app.appName)) {
              isDuplicate = true;
              databaseDuplicateCount++;
            }
          }

          if (!isDuplicate) {
            const [result] = await pool.execute(
              'INSERT INTO apps (app_name, harmony_package, android_package, icon_url) VALUES (?, ?, ?, ?)',
              [
                app.appName,
                app.harmonyPackage || null,
                app.androidPackage || null,
                app.iconUrl || null,
              ]
            );

            if (result.affectedRows === 1) {
              successCount++;
              // 插入成功后，更新查找表
              if (app.harmonyPackage) {
                harmonyPackageSet.add(app.harmonyPackage);
              }
              appNameSet.add(app.appName);
            }
          }
        } catch (dbError) {
          console.error('插入数据失败:', dbError);
          errorCount++;
        }
      }

      // 验证计数是否正确
      const calculatedTotal =
        successCount +
        databaseDuplicateCount +
        internalDuplicateCount +
        errorCount;
      if (calculatedTotal !== validData.length) {
        console.error(
          `计数错误！计算总数(${calculatedTotal}) != 实际总数(${validData.length})`
        );
      }

      res.json({
        success: true,
        message: `成功导入 ${successCount} 个应用，与数据库重复 ${databaseDuplicateCount} 个，Excel内部重复 ${internalDuplicateCount} 个，失败 ${errorCount} 个`,
        total: validData.length,
        successCount,
        databaseDuplicateCount,
        duplicateCount: databaseDuplicateCount + internalDuplicateCount,
        internalDuplicateCount,
        errorCount,
      });
    } catch (error) {
      console.error('处理文件失败:', error);
      res.status(500).json({ error: '处理文件失败: ' + error.message });
    }
  }

  static async harmonyIconSingle(req, res) {
    try {
      // 检查是否有文件上传
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: '没有上传文件' });
      }
      
      const files = req.files;

      // 创建output文件夹
      const outputDir = path.resolve(__dirname, '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 处理所有文件
      const processedFiles = [];
      
      for (const file of files) {
        // 检查 file 对象是否有效
        if (!file || !file.path || !file.originalname) {
          continue; // 跳过无效文件
        }
        
        const filePath = file.path;
        const fileName = file.originalname;

        // 检查文件扩展名
        if (!fileName.toLowerCase().endsWith('.png')) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('清理临时文件失败:', e);
          }
          continue; // 跳过非PNG文件
        }

        // 获取文件名（不含扩展名）
        const baseName = path.parse(fileName).name;

        // 生成_bg和_fg版本
        const bgFileName = `${baseName}_bg.png`;
        const fgFileName = `${baseName}_fg.png`;
        const bgDestFile = path.join(outputDir, bgFileName);
        const fgDestFile = path.join(outputDir, fgFileName);

        // 复制文件
        fs.copyFileSync(filePath, bgDestFile);
        fs.copyFileSync(filePath, fgDestFile);

        // 清理临时文件
        fs.unlinkSync(filePath);

        // 添加到处理结果
        processedFiles.push({
          name: fileName,
          bgUrl: `/api/util/download-icon?file=${encodeURIComponent(bgFileName)}`,
          fgUrl: `/api/util/download-icon?file=${encodeURIComponent(fgFileName)}`,
        });
      }

      if (processedFiles.length === 0) {
        return res.status(400).json({ error: '没有有效的PNG文件' });
      }

      // 返回处理结果
      res.json({
        success: true,
        files: processedFiles,
        message: `成功处理 ${processedFiles.length} 个图标，点击链接下载文件`,
      });
    } catch (error) {
      console.error('处理单个图标转鸿蒙图标失败:', error);
      
      // 清理临时文件
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('清理临时文件失败:', e);
          }
        });
      } else if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          console.error('清理临时文件失败:', e);
        }
      }
      
      res.status(500).json({ error: '处理图标失败: ' + error.message });
    }
  }

  static async harmonyIconFolder(req, res) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: '没有上传文件' });
      }

      console.log('上传的文件数量:', req.files.length);
      console.log('请求体:', req.body);

      // 获取相对路径数组
      const relativePaths = Array.isArray(req.body.relativePaths) ? req.body.relativePaths : [req.body.relativePaths].filter(Boolean);
      console.log('相对路径数组:', relativePaths);

      // 创建output文件夹
      const outputDir = path.resolve(__dirname, '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 文件夹上传处理
      const processedFiles = [];
      const appFilesMap = new Map();

      // 处理每个上传的文件
      req.files.forEach((file, index) => {
        console.log('文件路径:', file.path);
        console.log('原始文件名:', file.originalname);
        console.log('索引:', index);

        // 从前端传递的相对路径中获取路径信息
        let pathInfo = relativePaths[index] || file.originalname;
        console.log('使用的路径信息:', pathInfo);

        // 解析路径获取应用名称和文件类型
        const parts = pathInfo.split('/');
        console.log('路径分割结果:', parts);
        
        // 寻找 entry 文件夹，支持嵌套结构
        const entryIndex = parts.indexOf('entry');
        if (entryIndex > 0 && entryIndex < parts.length - 1) {
          // 应用名称是 entry 文件夹的父文件夹
          const appName = parts[entryIndex - 1];
          const fileName = parts[entryIndex + 1];

          console.log('解析结果:', { appName, entryIndex, fileName });

          let type = '';
          if (fileName === 'background.png') {
            type = 'background';
          } else if (fileName === 'foreground.png') {
            type = 'foreground';
          }

          if (type) {
            // 生成目标文件名
            const targetFileName = `${appName}_${type === 'background' ? 'bg' : 'fg'}.png`;
            const targetPath = path.join(outputDir, targetFileName);

            console.log('目标文件:', targetFileName);

            // 复制文件
            fs.copyFileSync(file.path, targetPath);

            // 添加到处理结果
            if (!appFilesMap.has(appName)) {
              appFilesMap.set(appName, {
                name: appName,
                bgUrl: '',
                fgUrl: ''
              });
            }

            const appFile = appFilesMap.get(appName);
            if (type === 'background') {
              appFile.bgUrl = `/api/util/download-icon?file=${encodeURIComponent(targetFileName)}`;
            } else if (type === 'foreground') {
              appFile.fgUrl = `/api/util/download-icon?file=${encodeURIComponent(targetFileName)}`;
            }
          }
        }

        // 清理临时文件
        fs.unlinkSync(file.path);
      });

      // 转换 Map 为数组
      processedFiles.push(...appFilesMap.values());
      
      console.log('处理结果:', processedFiles);
      
      // 返回处理结果
      res.json({
        success: true,
        files: processedFiles,
        message: `成功处理 ${processedFiles.length} 个应用图标`,
      });
    } catch (error) {
      console.error('处理鸿蒙图标文件夹转 bgfg 图标失败:', error);
      
      // 清理临时文件
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('清理临时文件失败:', e);
          }
        });
      }
      
      res.status(500).json({ error: '处理图标失败: ' + error.message });
    }
  }

  static async downloadAllIcons(req, res) {
    try {
      console.log('当前工作目录:', process.cwd());
      // 使用绝对路径，确保在正确的位置
      const outputDir = path.resolve(__dirname, '..', 'output');
      console.log('Output 目录:', outputDir);
      
      if (!fs.existsSync(outputDir)) {
        console.log('Output 目录不存在，创建它');
        fs.mkdirSync(outputDir, { recursive: true });
        return res.status(404).json({ error: '没有可下载的图标' });
      }

      // 读取 output 文件夹中的所有文件
      const files = fs.readdirSync(outputDir);
      console.log('Output 目录中的文件:', files);
      
      if (files.length === 0) {
        console.log('Output 目录为空');
        return res.status(404).json({ error: '没有可下载的图标' });
      }

      // 创建 zip 文件
      const zip = new AdmZip();

      // 添加所有文件到 zip
      files.forEach((file) => {
        const filePath = path.join(outputDir, file);
        if (fs.statSync(filePath).isFile()) {
          zip.addLocalFile(filePath, '', file);
        }
      });

      // 生成 zip 文件名
      const zipFileName = `icons_${Date.now()}.zip`;

      // 发送 zip 文件
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${zipFileName}`);
      
      // 直接将 zip 内容发送到响应
      const zipBuffer = zip.toBuffer();
      res.send(zipBuffer);
    } catch (error) {
      console.error('下载所有图标失败:', error);
      res.status(500).json({ error: '下载图标失败: ' + error.message });
    }
  }
}
