import { pool } from '../db.js';
import axios from 'axios';
import fs from 'fs';

export default class AppController {
  static async appSearch(req, res) {
    try {
      const { keyword, typeName, current = 1, pageSize = 20 } = req.query;
      const currentPage = Math.max(1, parseInt(current));
      const pageLimit = Math.max(1, parseInt(pageSize));
      const offset = (currentPage - 1) * pageLimit;

      // 有类型筛选时，先从关联表查 id，再查 apps（性能优化）
      if (typeName && typeName.trim() && (!keyword || !keyword.trim())) {
        // COUNT：直接从关联表计数
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as total FROM app_type_relations r
           INNER JOIN app_types t ON t.id = r.type_id AND t.type_name = ?`,
          [typeName.trim()]
        );
        const total = countResult[0].total;

        // 分页查询关联表获取 app_id
        const [relRows] = await pool.execute(
          `SELECT r.app_id FROM app_type_relations r
           INNER JOIN app_types t ON t.id = r.type_id AND t.type_name = ?
           ORDER BY r.app_id DESC
           LIMIT ${pageLimit} OFFSET ${offset}`,
          [typeName.trim()]
        );

        const ids = relRows.map(r => r.app_id);
        let rows = [];
        if (ids.length > 0) {
          const ph = ids.map(() => '?').join(',');
          [rows] = await pool.execute(
            `SELECT id, app_name, harmony_package, android_package, icon_url, type, \`desc\`, updated_by, created_at, updated_at
             FROM apps WHERE id IN (${ph})`,
            ids
          );
          // 保持关联表的顺序
          const orderMap = new Map(ids.map((id, i) => [id, i]));
          rows.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
        }

        return res.json({
          success: true,
          data: rows,
          total,
          current: currentPage,
          pageSize: pageLimit,
          pages: Math.ceil(total / pageLimit),
          filters: { keyword: null, typeName: typeName.trim() },
        });
      }

      // 无类型筛选或有关键字时，走原有逻辑
      let query = 'SELECT id, app_name, harmony_package, android_package, icon_url, type, `desc`, updated_by, created_at, updated_at FROM apps';
      let countQuery = 'SELECT COUNT(*) as total FROM apps';
      const params = [];
      const countParams = [];

      const conditions = [];

      // 有类型+关键字：先查关联表的 id，再在这些 id 中搜关键字
      if (typeName && typeName.trim()) {
        conditions.push(
          `id IN (SELECT r.app_id FROM app_type_relations r INNER JOIN app_types t ON t.id = r.type_id AND t.type_name = ?)`
        );
        params.push(typeName.trim());
        countParams.push(typeName.trim());
      }

      if (keyword && keyword.trim()) {
        const searchPattern = `%${keyword.trim()}%`;
        conditions.push(
          '(app_name LIKE ? OR harmony_package LIKE ? OR android_package LIKE ?)'
        );
        params.push(searchPattern, searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      if (keyword && keyword.trim()) {
        query += ` ORDER BY
          CASE
            WHEN app_name = ? OR harmony_package = ? OR android_package = ? THEN 0
            WHEN app_name LIKE ? OR harmony_package LIKE ? OR android_package LIKE ? THEN 1
            ELSE 2
          END,
          updated_at DESC
          LIMIT ${pageLimit} OFFSET ${offset}`;
        params.push(keyword.trim(), keyword.trim(), keyword.trim());
        params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`, `%${keyword.trim()}%`);
      } else {
        query += ` ORDER BY updated_at DESC LIMIT ${pageLimit} OFFSET ${offset}`;
      }

      const [rows] = await pool.execute(query, params);
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: rows,
        total,
        current: currentPage,
        pageSize: pageLimit,
        pages: Math.ceil(total / pageLimit),
        filters: { keyword: keyword || null, typeName: typeName || null },
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
      const { appName, harmonyPackageName, androidPackageName, iconUrl, type, desc } =
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
      const app_desc =
        desc !== undefined ? String(desc).trim() || null : null;
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

      // 处理 desc 字段
      fields.push('`desc`');
      placeholders.push('?');
      params.push(app_desc);

      // 记录操作账号
      if (req.user?.username) {
        fields.push('updated_by');
        placeholders.push('?');
        params.push(req.user.username);
      }

      // 执行插入
      const [result] = await pool.execute(
        `INSERT INTO apps (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
        params
      );

      // 同步创建关联记录
      if (appType.length > 0) {
        const typePlaceholders = appType.map(() => '?').join(',');
        const [typeRows] = await pool.execute(
          `SELECT id, type_name FROM app_types WHERE type_name IN (${typePlaceholders})`,
          appType
        );

        if (typeRows.length > 0) {
          const relValues = typeRows.map(t => [result.insertId, t.id]);
          const relPlaceholders = relValues.map(() => '(?, ?)').join(',');
          const relParams = relValues.flat();
          await pool.execute(
            `INSERT IGNORE INTO app_type_relations (app_id, type_id) VALUES ${relPlaceholders}`,
            relParams
          );
        }
      }

      // 获取刚插入的记录
      const [newApp] = await pool.execute(
        'SELECT id, app_name, harmony_package, android_package, icon_url, type, `desc`, updated_by, created_at FROM apps WHERE id = ?',
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
        desc,
      } = req.body;

      // 参数验证
      if (
        !appName &&
        !iconUrl &&
        !androidPackageName &&
        !harmonyPackageName &&
        !type &&
        !desc
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

        // 重建关联记录
        await pool.execute('DELETE FROM app_type_relations WHERE app_id = ?', [id]);
        if (appType.length > 0) {
          const typePlaceholders = appType.map(() => '?').join(',');
          const [typeRows] = await pool.execute(
            `SELECT id, type_name FROM app_types WHERE type_name IN (${typePlaceholders})`,
            appType
          );
          if (typeRows.length > 0) {
            const relValues = typeRows.map(t => [parseInt(id), t.id]);
            const relPlaceholders = relValues.map(() => '(?, ?)').join(',');
            const relParams = relValues.flat();
            await pool.execute(
              `INSERT IGNORE INTO app_type_relations (app_id, type_id) VALUES ${relPlaceholders}`,
              relParams
            );
          }
        }
      }

      if (desc !== undefined) {
        const app_desc = String(desc).trim() || null;
        updateFields.push('`desc` = ?');
        params.push(app_desc);
      }

      // 记录操作账号
      if (req.user?.username) {
        updateFields.push('updated_by = ?');
        params.push(req.user.username);
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
      const username = req.user?.username || '未知';

      const [result] = await pool.execute('DELETE FROM apps WHERE id = ?', [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '应用不存在' });
      }

      console.log(`应用删除成功 - 操作人: ${username}, 应用ID: ${id}`);
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

  // 根据类型获取应用
  static async getAppsByType(req, res) {
    try {
      const { typeName } = req.query;

      if (!typeName || typeName.trim() === '') {
        return res.status(400).json({ success: false, error: '类型名称不能为空' });
      }

      // 使用关联表查询
      const query = `
        SELECT a.app_name, a.harmony_package, a.android_package
        FROM apps a
        INNER JOIN app_type_relations r ON r.app_id = a.id
        INNER JOIN app_types t ON t.id = r.type_id AND t.type_name = ?
      `;

      const [rows] = await pool.execute(query, [typeName.trim()]);

      res.json({
        success: true,
        data: rows,
        total: rows.length
      });
    } catch (error) {
      console.error('根据类型获取应用失败:', error);
      res.status(500).json({
        success: false,
        error: '根据类型获取应用失败: ' + error.message
      });
    }
  }

  // 导入JSON数据
  static async importJson(req, res) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: '请选择要上传的JSON文件' });
      }

      const jsonData = JSON.parse(fs.readFileSync(file.path, 'utf8'));

      if (!Array.isArray(jsonData)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ success: false, error: 'JSON数据格式错误，需要数组格式' });
      }

      // 解析所有数据
      const allItems = [];
      for (const appData of jsonData) {
        const { app_name, appName, android_package, androidPackageName, harmony_package, harmonyPackageName, icon_url, iconUrl, type, desc, description } = appData;
        allItems.push({
          appName: app_name || appName || '',
          androidPackage: android_package || androidPackageName || null,
          harmonyPackage: harmony_package || harmonyPackageName || null,
          iconUrl: icon_url || iconUrl || null,
          type: type || ['鸿蒙应用'],
          desc: desc || description || null,
        });
      }

      // 收集所有 harmony_package 和 android_package 值，查询已存在的记录
      const harmonyPackages = allItems.map(i => i.harmonyPackage).filter(Boolean);
      const androidPackages = allItems.map(i => i.androidPackage).filter(Boolean);

      const existingSet = new Set();

      // 查询已存在的 harmony_package
      if (harmonyPackages.length > 0) {
        for (let i = 0; i < harmonyPackages.length; i += 1000) {
          const batch = harmonyPackages.slice(i, i + 1000);
          const placeholders = batch.map(() => '?').join(', ');
          const [rows] = await pool.execute(
            `SELECT harmony_package FROM apps WHERE harmony_package IN (${placeholders})`,
            batch
          );
          rows.forEach(r => existingSet.add(r.harmony_package));
        }
      }

      // 查询已存在的 android_package
      if (androidPackages.length > 0) {
        for (let i = 0; i < androidPackages.length; i += 1000) {
          const batch = androidPackages.slice(i, i + 1000);
          const placeholders = batch.map(() => '?').join(', ');
          const [rows] = await pool.execute(
            `SELECT android_package FROM apps WHERE android_package IN (${placeholders})`,
            batch
          );
          rows.forEach(r => existingSet.add(r.android_package));
        }
      }

      // 过滤掉已存在的记录（harmony_package 或 android_package 任一匹配即跳过）
      const newItems = allItems.filter(i => {
        if (i.harmonyPackage && existingSet.has(i.harmonyPackage)) return false;
        if (i.androidPackage && existingSet.has(i.androidPackage)) return false;
        return true;
      });

      const skipped = allItems.length - newItems.length;

      // 构建批量插入数据
      const values = newItems.map(i => [
        i.appName, i.androidPackage, i.harmonyPackage, i.iconUrl, JSON.stringify(i.type), i.desc
      ]);

      // 预加载类型映射
      const [allTypes] = await pool.execute('SELECT id, type_name FROM app_types');
      const typeNameToId = new Map();
      for (const t of allTypes) {
        typeNameToId.set(t.type_name, t.id);
      }

      // 分批插入，每批 500 条
      const BATCH_SIZE = 500;
      let imported = 0;

      for (let i = 0; i < values.length; i += BATCH_SIZE) {
        const batch = values.slice(i, i + BATCH_SIZE);
        const batchItems = newItems.slice(i, i + BATCH_SIZE);
        if (batch.length === 0) break;

        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const flatParams = batch.flat();

        const [result] = await pool.execute(
          `INSERT INTO apps (app_name, android_package, harmony_package, icon_url, type, \`desc\`)
           VALUES ${placeholders}
           ON DUPLICATE KEY UPDATE
             icon_url = VALUES(icon_url),
             type = VALUES(type),
             \`desc\` = VALUES(\`desc\`)`,
          flatParams
        );

        imported += result.affectedRows;

        // 为新插入的记录创建关联
        // 查询这批插入的记录的 id
        const insertedApps = batchItems.filter((_, idx) => {
          // ON DUPLICATE KEY UPDATE 时 affectedRows 可能包含更新的记录
          // 这里简化处理，为所有非重复记录创建关联
          return true;
        });

        if (insertedApps.length > 0) {
          // 批量查询刚插入的记录的 id
          const appNames = insertedApps.map(i => i.appName);
          const namePlaceholders = appNames.map(() => '?').join(',');
          const [insertedRows] = await pool.execute(
            `SELECT id, app_name FROM apps WHERE app_name IN (${namePlaceholders})`,
            appNames
          );

          // 创建关联记录
          const relValues = [];
          for (const row of insertedRows) {
            const appItem = insertedApps.find(i => i.appName === row.app_name);
            if (appItem && Array.isArray(appItem.type)) {
              for (const typeName of appItem.type) {
                if (typeName && typeNameToId.has(typeName)) {
                  relValues.push([row.id, typeNameToId.get(typeName)]);
                }
              }
            }
          }

          if (relValues.length > 0) {
            const relPlaceholders = relValues.map(() => '(?, ?)').join(',');
            const relParams = relValues.flat();
            await pool.execute(
              `INSERT IGNORE INTO app_type_relations (app_id, type_id) VALUES ${relPlaceholders}`,
              relParams
            );
          }
        }
      }

      // 删除临时文件
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        total: allItems.length,
        imported,
        skipped,
        message: `导入完成，新增 ${imported} 条，跳过 ${skipped} 条已存在记录`
      });
    } catch (error) {
      console.error('导入JSON失败:', error);
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('删除临时文件失败:', unlinkError);
        }
      }
      res.status(500).json({
        success: false,
        error: '导入JSON失败: ' + error.message
      });
    }
  }

  // 安卓包名转鸿蒙包名 - 查询映射关系
  static async getHarmonyMapping(req, res) {
    try {
      const { androidPackages } = req.body;

      if (!Array.isArray(androidPackages) || androidPackages.length === 0) {
        return res.status(400).json({ success: false, message: '请提供安卓包名列表' });
      }

      // 查询数据库获取鸿蒙包名
      const mapping = {};
      for (let i = 0; i < androidPackages.length; i += 1000) {
        const batch = androidPackages.slice(i, i + 1000);
        const placeholders = batch.map(() => '?').join(', ');
        const [rows] = await pool.execute(
          `SELECT android_package, harmony_package FROM apps WHERE android_package IN (${placeholders}) AND harmony_package IS NOT NULL AND harmony_package != ''`,
          batch
        );
        for (const row of rows) {
          mapping[row.android_package] = row.harmony_package;
        }
      }

      res.json({
        success: true,
        mapping,
      });
    } catch (error) {
      console.error('查询鸿蒙映射失败:', error);
      res.status(500).json({
        success: false,
        message: '查询失败: ' + error.message,
      });
    }
  }
}

