import { pool } from '../db.js'

export default class AppTypeController {
  static async typeList(req, res) {
    try {
      const [rows] = await pool.execute('SELECT id, type_name, created_at FROM app_types ORDER BY id ASC')

      res.json({
        success: true,
        data: rows,
        total: rows.length,
      })
    } catch (error) {
      console.error('获取应用类型失败:', error)
      res.status(500).json({
        success: false,
        error: '获取应用类型失败: ' + error.message,
      })
    }
  }

  /**
   * 创建应用类型
   */
  static async addAppType(req, res) {
    try {
      const { typeName } = req.body

      // 参数验证
      if (!typeName || typeName.trim() === '') {
        return res.status(400).json({ error: 'type_name不能为空' })
      }

      const newTypeName = String(typeName).trim()

      // 检查是否已存在相同名称的类型
      const [existingTypes] = await pool.execute('SELECT id FROM app_types WHERE type_name = ?', [newTypeName])

      if (existingTypes.length > 0) {
        return res.status(400).json({ error: '该类型名称已存在' })
      }

      // 插入新类型
      const [result] = await pool.execute('INSERT INTO app_types (type_name) VALUES (?)', [newTypeName])

      // 获取刚创建的记录
      const [newType] = await pool.execute('SELECT id, type_name, created_at FROM app_types WHERE id = ?', [
        result.insertId,
      ])

      res.json({
        success: true,
        message: '应用类型创建成功',
        data: newType[0],
        insertId: result.insertId,
      })
    } catch (error) {
      console.error('创建应用类型失败:', error)
      res.status(500).json({ error: '创建应用类型失败: ' + error.message })
    }
  }

  /**
   * 更新应用类型
   */
  static async updateAppType(req, res) {
    try {
      const { id, typeName } = req.body

      // 参数验证
      if (!id) {
        return res.status(400).json({ error: '必须提供id' })
      }
      if (!typeName || typeName.trim() === '') {
        return res.status(400).json({ error: 'type_name不能为空' })
      }

      const newTypeName = String(typeName).trim()

      // 检查是否与其他类型重名（排除自身）
      const [existingTypes] = await pool.execute('SELECT id FROM app_types WHERE type_name = ? AND id != ?', [
        newTypeName,
        id,
      ])

      if (existingTypes.length > 0) {
        return res.status(400).json({ error: '该类型名称已存在' })
      }

      // 更新数据
      const [result] = await pool.execute('UPDATE app_types SET type_name = ? WHERE id = ?', [newTypeName, id])

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '未找到对应的应用类型' })
      }

      // 获取更新后的记录
      const [updatedType] = await pool.execute('SELECT id, type_name, created_at FROM app_types WHERE id = ?', [id])

      res.json({
        success: true,
        message: '应用类型更新成功',
        data: updatedType[0],
      })
    } catch (error) {
      console.error('更新应用类型失败:', error)
      res.status(500).json({ error: '更新应用类型失败: ' + error.message })
    }
  }

  /**
   * 删除应用类型
   */
  static async deleteAppType(req, res) {
    try {
      const { id } = req.body

      // 参数验证
      if (!id) {
        return res.status(400).json({ error: '必须提供id' })
      }

      // 检查是否有应用使用了该类型
      const [appsUsingType] = await pool.execute('SELECT COUNT(*) as count FROM apps WHERE type = ?', [id])

      if (appsUsingType[0].count > 0) {
        return res.status(400).json({
          error: `该类型下还有 ${appsUsingType[0].count} 个应用，无法删除`,
          appsCount: appsUsingType[0].count,
        })
      }

      // 删除数据
      const [result] = await pool.execute('DELETE FROM app_types WHERE id = ?', [id])

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '应用类型不存在' })
      }

      res.json({
        success: true,
        message: '应用类型删除成功',
        affectedRows: result.affectedRows,
      })
    } catch (error) {
      console.error('删除应用类型失败:', error)
      res.status(500).json({ error: '删除应用类型失败: ' + error.message })
    }
  }
}
