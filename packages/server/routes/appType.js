import { pool } from '../db.js';

export default class AppTypeController {
  static async typeList(req, res) {
    try {
      // 使用关联表统计每个类型的应用数量
      const [rows] = await pool.execute(`
      SELECT
        t.id,
        t.type_name,
        t.created_at,
        t.sort,
        COUNT(r.app_id) as app_count
      FROM app_types t
      LEFT JOIN app_type_relations r ON r.type_id = t.id
      GROUP BY t.id, t.type_name, t.created_at, t.sort
      ORDER BY t.sort ASC, t.id ASC
    `);

      res.json({
        success: true,
        data: rows,
        total: rows.length,
      });
    } catch (error) {
      console.error('获取应用类型失败:', error);
      res.status(500).json({
        success: false,
        error: '获取应用类型失败: ' + error.message,
      });
    }
  }

  /**
   * 创建应用类型
   */
  static async addAppType(req, res) {
    try {
      const { typeName, sort = 0 } = req.body;

      // 参数验证
      if (!typeName || typeName.trim() === '') {
        return res.status(400).json({ error: 'type_name不能为空' });
      }

      const newTypeName = String(typeName).trim();

      // 检查是否已存在相同名称的类型
      const [existingTypes] = await pool.execute(
        'SELECT id FROM app_types WHERE type_name = ?',
        [newTypeName]
      );

      if (existingTypes.length > 0) {
        return res.status(400).json({ error: '该类型名称已存在' });
      }

      // 插入新类型
      const [result] = await pool.execute(
        'INSERT INTO app_types (type_name, sort) VALUES (?, ?)',
        [newTypeName, 0]
      );

      // 获取刚创建的记录
      const [newType] = await pool.execute(
        'SELECT id, type_name, created_at, sort FROM app_types WHERE id = ?',
        [result.insertId]
      );

      res.json({
        success: true,
        message: '应用类型创建成功',
        data: newType[0],
        insertId: result.insertId,
      });
    } catch (error) {
      console.error('创建应用类型失败:', error);
      res.status(500).json({ error: '创建应用类型失败: ' + error.message });
    }
  }

  /**
   * 更新应用类型
   */
  static async updateAppType(req, res) {
    try {
      const { id, typeName, sort } = req.body;

      // 参数验证
      if (!id) {
        return res.status(400).json({ error: '必须提供id' });
      }
      if (!typeName || typeName.trim() === '') {
        return res.status(400).json({ error: 'type_name不能为空' });
      }

      const newTypeName = String(typeName).trim();

      // 获取旧类型信息
      const [oldTypeResult] = await pool.execute(
        'SELECT type_name, sort FROM app_types WHERE id = ?',
        [id]
      );

      if (oldTypeResult.length === 0) {
        return res.status(404).json({ error: '应用类型不存在' });
      }

      const oldType = oldTypeResult[0];
      const oldTypeName = oldType.type_name;
      const oldSort = oldType.sort || 0;

      // 如果类型名称和 sort 值都没有变化，直接返回
      if (oldTypeName === newTypeName && oldSort === sort) {
        const [currentType] = await pool.execute(
          'SELECT id, type_name, created_at, sort FROM app_types WHERE id = ?',
          [id]
        );
        return res.json({
          success: true,
          message: '类型名称和排序未变化',
          data: currentType[0],
        });
      }

      // 检查是否与其他类型重名
      const [existingTypes] = await pool.execute(
        'SELECT id FROM app_types WHERE type_name = ? AND id != ?',
        [newTypeName, id]
      );

      if (existingTypes.length > 0) {
        return res.status(400).json({ error: '该类型名称已存在' });
      }

      // 构建更新语句
      const updateFields = ['type_name = ?'];
      const updateParams = [newTypeName];
      
      if (sort !== undefined) {
        updateFields.push('sort = ?');
        updateParams.push(sort);
      }
      
      updateParams.push(id);
      
      // 更新 app_types 表
      await pool.execute(
        `UPDATE app_types SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams
      );

      // 关联表通过 type_id 关联，不需要同步更新

      console.log(`已更新类型 ${id}: ${oldTypeName} -> ${newTypeName}`);

      // 获取更新后的记录
      const [updatedType] = await pool.execute(
        'SELECT id, type_name, created_at, sort FROM app_types WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: '应用类型更新成功',
        data: updatedType[0],
      });
    } catch (error) {
      console.error('更新应用类型失败:', error);
      res.status(500).json({ error: '更新应用类型失败: ' + error.message });
    }
  }

  /**
   * 删除应用类型
   */
  static async deleteAppType(req, res) {
    try {
      const { id } = req.body;

      // 参数验证
      if (!id) {
        return res.status(400).json({ error: '必须提供id' });
      }

      // 获取要删除的类型名称
      const [typeToDelete] = await pool.execute(
        'SELECT id, type_name FROM app_types WHERE id = ?',
        [id]
      );

      if (typeToDelete.length === 0) {
        return res.status(404).json({ error: '应用类型不存在' });
      }

      const typeName = typeToDelete[0].type_name;

      // 检查是否有应用使用了该类型（通过关联表）
      const [appsUsingType] = await pool.execute(
        'SELECT COUNT(*) as count FROM app_type_relations WHERE type_id = ?',
        [id]
      );

      const appsCount = appsUsingType[0].count;

      if (appsCount > 0) {
        return res.status(400).json({
          error: `该类型下还有 ${appsCount} 个应用，无法删除`,
          appsCount: appsCount,
        });
      }

      // 删除 app_types 表中的记录
      const [result] = await pool.execute(
        'DELETE FROM app_types WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '应用类型不存在' });
      }

      res.json({
        success: true,
        message: '应用类型删除成功',
        affectedRows: result.affectedRows,
      });
    } catch (error) {
      console.error('删除应用类型失败:', error);
      res.status(500).json({ error: '删除应用类型失败: ' + error.message });
    }
  }
}
