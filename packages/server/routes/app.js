import { pool } from '../db.js'
import axios from 'axios'

export default class AppController {
  static async appSearch(req, res) {
    try {
      const { keyword, typeName, current = 1, pageSize = 20 } = req.query
      const currentPage = Math.max(1, parseInt(current))
      const pageLimit = Math.max(1, parseInt(pageSize))
      const offset = (currentPage - 1) * pageLimit

      let query = 'SELECT id, app_name, harmony_package, android_package, icon_url, type, created_at FROM apps'
      let countQuery = 'SELECT COUNT(*) as total FROM apps'
      const params = []
      const countParams = []

      // 构建查询条件
      const conditions = []

      // 关键字搜索
      if (keyword && keyword.trim()) {
        const searchPattern = `%${keyword.trim()}%`
        conditions.push('(app_name LIKE ? OR harmony_package LIKE ? OR android_package LIKE ?)')
        params.push(searchPattern, searchPattern, searchPattern)
        countParams.push(searchPattern, searchPattern, searchPattern)
      }

      // 类型筛选
      if (typeName && typeName.trim()) {
        conditions.push('type = ?')
        params.push(typeName.trim())
        countParams.push(typeName.trim())
      }

      // 应用查询条件
      if (conditions.length > 0) {
        const whereClause = ' WHERE ' + conditions.join(' AND ')
        query += whereClause
        countQuery += whereClause
      }

      // 分页和排序
      query += ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`

      // 执行查询
      const [rows] = await pool.execute(query, params)
      const [countResult] = await pool.execute(countQuery, countParams)
      const total = countResult[0].total

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
      })
    } catch (error) {
      console.error('搜索应用失败:', error)
      res.status(500).json({
        success: false,
        error: '搜索应用失败: ' + error.message,
      })
    }
  }

  static async addApp(req, res) {
    try {
      const { appName, harmonyPackageName, androidPackageName, iconUrl, type } = req.body

      // 参数验证
      if (!appName || appName.trim() === '') {
        return res.status(400).json({ error: 'app_name不能为空' })
      }

      const app_name = String(appName).trim()
      const harmony_package = harmonyPackageName !== undefined ? String(harmonyPackageName).trim() || null : null
      const android_package = androidPackageName !== undefined ? String(androidPackageName).trim() || null : null
      const icon_url = iconUrl !== undefined ? String(iconUrl).trim() || null : null
      const appType = type !== undefined ? String(type).trim() || null : null

      // 构建唯一标识，用于检查重复（基于 app_name + type）
      const appKey = JSON.stringify({
        app_name: app_name,
        type: appType,
      })

      // 检查是否已存在相同 app_name + type 的应用
      // 注意：type 必须完全匹配，包括 NULL 值
      let existingApps
      if (appType === null) {
        // 查找 type 为 null 的记录
        ;[existingApps] = await pool.execute(
          `SELECT id, app_name, harmony_package, android_package, type FROM apps WHERE app_name = ? AND type IS NULL`,
          [app_name],
        )
      } else {
        // 查找 type 为具体值的记录（不包括 NULL）
        ;[existingApps] = await pool.execute(
          `SELECT id, app_name, harmony_package, android_package, type FROM apps WHERE app_name = ? AND type = ?`,
          [app_name, appType],
        )
      }

      if (existingApps.length > 0) {
        return res.status(400).json({
          error: '该应用已存在',
          existingApp: existingApps[0],
        })
      }

      // 构建插入SQL（动态字段）
      const fields = ['app_name']
      const placeholders = ['?']
      const params = [appName]

      if (harmony_package !== undefined && harmony_package !== null) {
        fields.push('harmony_package')
        placeholders.push('?')
        params.push(harmony_package)
      } else {
        fields.push('harmony_package')
        placeholders.push('NULL')
      }

      if (android_package !== undefined && android_package !== null) {
        fields.push('android_package')
        placeholders.push('?')
        params.push(android_package)
      } else {
        fields.push('android_package')
        placeholders.push('NULL')
      }

      if (icon_url !== undefined && icon_url !== null) {
        fields.push('icon_url')
        placeholders.push('?')
        params.push(icon_url)
      } else {
        fields.push('icon_url')
        placeholders.push('NULL')
      }

      if (appType !== undefined && appType !== null) {
        fields.push('type')
        placeholders.push('?')
        params.push(appType)
      } else {
        fields.push('type')
        placeholders.push('NULL')
      }

      // 执行插入
      const [result] = await pool.execute(
        `INSERT INTO apps (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
        params,
      )

      // 获取刚插入的记录
      const [newApp] = await pool.execute(
        'SELECT id, app_name, harmony_package, android_package, icon_url, type, created_at FROM apps WHERE id = ?',
        [result.insertId],
      )

      res.json({
        success: true,
        message: '应用创建成功',
        data: newApp[0],
        insertId: result.insertId,
      })
    } catch (error) {
      console.error('创建应用失败:', error)
      res.status(500).json({ error: '创建应用失败: ' + error.message })
    }
  }

  static async editApp(req, res) {
    try {
      const { id, appName, iconUrl, androidPackageName, harmonyPackageName, type } = req.body

      // 参数验证
      if (!appName && !iconUrl && !androidPackageName && !harmonyPackageName && !type) {
        return res.status(400).json({ error: '至少需要提供一个更新字段' })
      }

      if (!id) {
        return res.status(400).json({ error: '必须提供id' })
      }

      // 动态构建UPDATE语句
      const updateFields = []
      const params = []

      if (appName !== undefined) {
        updateFields.push('app_name = ?')
        params.push(appName)
      }

      if (iconUrl !== undefined) {
        updateFields.push('icon_url = ?')
        params.push(iconUrl)
      }

      if (androidPackageName !== undefined) {
        updateFields.push('android_package = ?')
        params.push(androidPackageName)
      }

      if (harmonyPackageName !== undefined) {
        updateFields.push('harmony_package = ?')
        params.push(harmonyPackageName)
      }

      if (type !== undefined) {
        updateFields.push('type = ?')
        params.push(type)
      }

      // 添加WHERE条件参数
      params.push(id)

      // 构建完整的SQL
      const query = `UPDATE apps SET ${updateFields.join(', ')} WHERE id = ?`

      // 执行更新
      const [result] = await pool.execute(query, params)

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '未找到对应的应用' })
      }

      res.json({
        success: true,
        message: '应用信息更新成功',
        affectedRows: result.affectedRows,
        updatedFields: updateFields.length,
      })
    } catch (error) {
      console.error('应用更新失败:', error)
      res.status(500).json({ error: '应用更新失败: ' + error.message })
    }
  }

  static async deleteApp(req, res) {
    try {
      const { id } = req.body

      const [result] = await pool.execute('DELETE FROM apps WHERE id = ?', [id])

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '应用不存在' })
      }

      res.json({
        success: true,
        message: '应用删除成功',
      })
    } catch (error) {
      console.error('删除应用失败:', error)
      res.status(500).json({ error: '删除应用失败: ' + error.message })
    }
  }

  static async getIconFromAppleStore(req, res) {
    try {
      const { appName } = req.query

      if (!appName) {
        return res.status(400).json({ error: '应用名称不能为空' })
      }

      const encodedKeyword = encodeURIComponent(appName)
      const searchUrl = `https://www.apple.com.cn/cn/search/${encodedKeyword}?src=globalnav`

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
        },
      })

      if (response.status === 200) {
        const html = response.data

        // 查找应用图标链接
        const iconPattern = /http[s]?:\/\/is[0-9]-ssl\.mzstatic\.com\/image\/thumb\/[^"\s]+\/AppIcon-[^"\s]+\.png/g
        const iconLinks = html.match(iconPattern) || []

        if (iconLinks.length > 0) {
          const iconUrl = iconLinks[0].replace('http://', 'https://')
          return res.json({
            success: true,
            iconUrl: iconUrl,
          })
        }

        // 尝试查找其他格式的图标链接
        const otherIconPattern = /http[s]?:\/\/[^"\s]+\/AppIcon[^"\s]+/g
        const otherIcons = html.match(otherIconPattern) || []

        if (otherIcons.length > 0) {
          const iconUrl = otherIcons[0].replace('http://', 'https://')
          return res.json({
            success: true,
            iconUrl: iconUrl,
          })
        }
      }

      res.json({
        success: false,
        error: '未找到应用图标',
      })
    } catch (error) {
      console.error('获取苹果应用商店图标失败:', error)
      res.status(500).json({
        success: false,
        error: '获取图标失败: ' + error.message,
      })
    }
  }
}
