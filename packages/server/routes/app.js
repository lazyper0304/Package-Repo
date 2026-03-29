import { pool } from '../db.js';
import axios from 'axios';

export default class AppController {
  static async appSearch(req, res) {
    try {
      const { keyword, typeName, current = 1, pageSize = 20 } = req.query;
      const currentPage = Math.max(1, parseInt(current));
      const pageLimit = Math.max(1, parseInt(pageSize));
      const offset = (currentPage - 1) * pageLimit;

      let query =
        'SELECT id, app_name, harmony_package, android_package, icon_url, type, created_at FROM apps';
      let countQuery = 'SELECT COUNT(*) as total FROM apps';
      const params = [];
      const countParams = [];

      // 构建查询条件
      const conditions = [];

      // 关键字搜索
      if (keyword && keyword.trim()) {
        const searchPattern = `%${keyword.trim()}%`;
        conditions.push(
          '(app_name LIKE ? OR harmony_package LIKE ? OR android_package LIKE ?)'
        );
        params.push(searchPattern, searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      // 类型筛选
      if (typeName && typeName.trim()) {
        // 使用 JSON_CONTAINS 函数检查 JSON 数组是否包含特定值
        conditions.push('JSON_CONTAINS(type, JSON_ARRAY(?))');
        params.push(typeName.trim());
        countParams.push(typeName.trim());
      }

      // 应用查询条件
      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      // 分页和排序
      if (keyword && keyword.trim()) {
        // 优先显示完全匹配的结果，然后是包含匹配的结果，最后按更新时间排序
        query += ` ORDER BY 
          CASE 
            WHEN app_name = ? OR harmony_package = ? OR android_package = ? THEN 0
            WHEN app_name LIKE ? OR harmony_package LIKE ? OR android_package LIKE ? THEN 1
            ELSE 2
          END, 
          updated_at DESC 
          LIMIT ${pageLimit} OFFSET ${offset}`;
        
        // 添加排序参数
        params.push(keyword.trim(), keyword.trim(), keyword.trim());
        params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`, `%${keyword.trim()}%`);
      } else {
        // 没有关键字时，仅按更新时间排序
        query += ` ORDER BY updated_at DESC LIMIT ${pageLimit} OFFSET ${offset}`;
      }

      // 执行查询
      const [rows] = await pool.execute(query, params);
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: rows,
        total: total,
        current: currentPage,
        pageSize: pageLimit,
        pages: Math.ceil(total / pageLimit),
        filters: {
          keyword: keyword || null,
          typeName: typeName || null,
        },
      });
    } catch (error) {
      console.error('搜索应用失败:', error);
      res.status(500).json({
        success: false,
        error: '搜索应用失败: ' + error.message,
      });
    }
  }

  static async addApp(req, res) {
    try {
      const { appName, harmonyPackageName, androidPackageName, iconUrl, type } =
        req.body;

      // 参数验证
      if (!appName || appName.trim() === '') {
        return res.status(400).json({ error: 'app_name不能为空' });
      }

      const app_name = String(appName).trim();
      const harmony_package =
        harmonyPackageName !== undefined
          ? String(harmonyPackageName).trim() || null
          : null;
      const android_package =
        androidPackageName !== undefined
          ? String(androidPackageName).trim() || null
          : null;
      const icon_url =
        iconUrl !== undefined ? String(iconUrl).trim() || null : null;
      let appType = [];
      if (type !== undefined) {
        if (Array.isArray(type)) {
          // 确保数组中的元素都是字符串且非空
          appType = type.filter(
            (item) => typeof item === 'string' && item.trim() !== ''
          );
        } else if (typeof type === 'string' && type.trim() !== '') {
          // 兼容旧格式，将单个字符串转换为数组
          appType = [type.trim()];
        }
      }

      // 检查是否已存在相同 app_name + harmony_package + android_package 的应用
      // 与数据库唯一约束 idx_unique_app (app_name, harmony_package, android_package) 保持一致
      let existingApps;
      [existingApps] = await pool.execute(
        `SELECT id, app_name, harmony_package, android_package, type FROM apps 
         WHERE app_name = ? 
         AND (harmony_package = ? OR (harmony_package IS NULL AND ? IS NULL))
         AND (android_package = ? OR (android_package IS NULL AND ? IS NULL))`,
        [
          app_name,
          harmony_package,
          harmony_package,
          android_package,
          android_package,
        ]
      );

      if (existingApps.length > 0) {
        const existing = existingApps[0];
        const duplicateFields = [];
        duplicateFields.push(`应用名称: ${existing.app_name}`);
        if (existing.harmony_package) {
          duplicateFields.push(`鸿蒙包名: ${existing.harmony_package}`);
        }
        if (existing.android_package) {
          duplicateFields.push(`安卓包名: ${existing.android_package}`);
        }

        return res.status(400).json({
          error: `该应用已存在（${duplicateFields.join('，')}）`,
          existingApp: existing,
        });
      }

      // 构建插入SQL（动态字段）
      const fields = ['app_name'];
      const placeholders = ['?'];
      const params = [appName];

      if (harmony_package !== undefined && harmony_package !== null) {
        fields.push('harmony_package');
        placeholders.push('?');
        params.push(harmony_package);
      } else {
        fields.push('harmony_package');
        placeholders.push('NULL');
      }

      if (android_package !== undefined && android_package !== null) {
        fields.push('android_package');
        placeholders.push('?');
        params.push(android_package);
      } else {
        fields.push('android_package');
        placeholders.push('NULL');
      }

      if (icon_url !== undefined && icon_url !== null) {
        fields.push('icon_url');
        placeholders.push('?');
        params.push(icon_url);
      } else {
        fields.push('icon_url');
        placeholders.push('NULL');
      }

      // 处理 type 字段（JSON 类型）
      fields.push('type');
      placeholders.push('?');
      params.push(JSON.stringify(appType));

      // 执行插入
      const [result] = await pool.execute(
        `INSERT INTO apps (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
        params
      );

      // 获取刚插入的记录
      const [newApp] = await pool.execute(
        'SELECT id, app_name, harmony_package, android_package, icon_url, type, created_at FROM apps WHERE id = ?',
        [result.insertId]
      );

      res.json({
        success: true,
        message: '应用创建成功',
        data: newApp[0],
        insertId: result.insertId,
      });
    } catch (error) {
      console.error('创建应用失败:', error);
      res.status(500).json({ error: '创建应用失败: ' + error.message });
    }
  }

  static async editApp(req, res) {
    try {
      const {
        id,
        appName,
        iconUrl,
        androidPackageName,
        harmonyPackageName,
        type,
      } = req.body;

      // 参数验证
      if (
        !appName &&
        !iconUrl &&
        !androidPackageName &&
        !harmonyPackageName &&
        !type
      ) {
        return res.status(400).json({ error: '至少需要提供一个更新字段' });
      }

      if (!id) {
        return res.status(400).json({ error: '必须提供id' });
      }

      // 动态构建UPDATE语句
      const updateFields = [];
      const params = [];

      if (appName !== undefined) {
        updateFields.push('app_name = ?');
        params.push(appName);
      }

      if (iconUrl !== undefined) {
        updateFields.push('icon_url = ?');
        params.push(iconUrl);
      }

      if (androidPackageName !== undefined) {
        updateFields.push('android_package = ?');
        params.push(androidPackageName);
      }

      if (harmonyPackageName !== undefined) {
        updateFields.push('harmony_package = ?');
        params.push(harmonyPackageName);
      }

      if (type !== undefined) {
        let appType = [];
        if (Array.isArray(type)) {
          // 确保数组中的元素都是字符串且非空
          appType = type.filter(
            (item) => typeof item === 'string' && item.trim() !== ''
          );
        } else if (typeof type === 'string' && type.trim() !== '') {
          // 兼容旧格式，将单个字符串转换为数组
          appType = [type.trim()];
        }
        updateFields.push('type = ?');
        params.push(JSON.stringify(appType));
      }

      // 添加WHERE条件参数
      params.push(id);

      // 构建完整的SQL
      const query = `UPDATE apps SET ${updateFields.join(', ')} WHERE id = ?`;

      // 执行更新
      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '未找到对应的应用' });
      }

      res.json({
        success: true,
        message: '应用信息更新成功',
        affectedRows: result.affectedRows,
        updatedFields: updateFields.length,
      });
    } catch (error) {
      console.error('应用更新失败:', error);
      res.status(500).json({ error: '应用更新失败: ' + error.message });
    }
  }

  static async deleteApp(req, res) {
    try {
      const { id } = req.body;

      const [result] = await pool.execute('DELETE FROM apps WHERE id = ?', [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '应用不存在' });
      }

      res.json({
        success: true,
        message: '应用删除成功',
      });
    } catch (error) {
      console.error('删除应用失败:', error);
      res.status(500).json({ error: '删除应用失败: ' + error.message });
    }
  }

  static async getIconFromAppleStore(req, res) {
    try {
      const { appName } = req.query;

      if (!appName) {
        return res.status(400).json({ error: '应用名称不能为空' });
      }

      const encodedAppName = encodeURIComponent(appName);
      const url = `https://sj.qq.com/search?q=${encodedAppName}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language':
            'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
          Referer: 'https://sj.qq.com/',
        },
        timeout: 10000,
      });

      if (response.status === 200) {
        const html = response.data;
        let iconUrl = null;

        const myappIconRegex = /https:\/\/pp\.myapp\.com\/ma_icon\/[^"'\s]+/g;
        let match;
        while ((match = myappIconRegex.exec(html)) !== null) {
          iconUrl = match[0];
          break;
        }

        if (!iconUrl) {
          const gameIconRegex =
            /<img[^>]*class="[^"]*GameIcon[^"]*"[^>]*src="([^"]+)"/;
          const gameIconMatch = html.match(gameIconRegex);
          if (gameIconMatch) {
            iconUrl = gameIconMatch[1];
          }
        }

        if (!iconUrl) {
          const imgRegex = /<img[^>]+src="([^"]+)"/g;
          while ((match = imgRegex.exec(html)) !== null) {
            const src = match[1];
            // 检查是否是图标链接格式
            if (
              src.includes('icon') ||
              src.includes('ma_icon') ||
              src.includes('pp.myapp.com')
            ) {
              iconUrl = src;
              break;
            }
          }
        }

        if (iconUrl) {
          // 确保返回的是完整的URL
          if (!iconUrl.startsWith('http')) {
            iconUrl = 'https:' + iconUrl;
          }
          return res.json({
            success: true,
            iconUrl: iconUrl,
          });
        }
      }

      res.json({
        success: false,
        error: '未找到应用图标',
      });
    } catch (error) {
      console.error('获取应用宝图标失败:', error);
      res.status(500).json({
        success: false,
        error: '获取图标失败: ' + error.message,
      });
    }
  }
}
