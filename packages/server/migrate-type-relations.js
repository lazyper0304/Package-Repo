import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'app_search',
  waitForConnections: true,
  connectionLimit: 10,
});

const BATCH = 500;

async function main() {
  try {
    const args = process.argv.slice(2);
    const clean = args.includes('--clean');

    // 检查关联表是否存在
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'app_type_relations'"
    );
    if (tables.length === 0) {
      console.log('app_type_relations 表不存在，请先启动服务创建表结构');
      await pool.end().catch(() => {});
      return;
    }

    console.log('加载 app_types 表...');
    const [typeRows] = await pool.execute('SELECT id, type_name FROM app_types');
    const typeNameToId = new Map();
    for (const t of typeRows) {
      typeNameToId.set(t.type_name, t.id);
    }
    console.log(`已有 ${typeRows.length} 个分类`);

    console.log('加载 apps 表中的 type 字段...');
    const [appRows] = await pool.execute(
      'SELECT id, type FROM apps WHERE JSON_LENGTH(type) > 0'
    );
    console.log(`共 ${appRows.length} 条有分类数据的记录`);

    // 提取所有唯一的类型名
    const allTypeNames = new Set();
    for (const app of appRows) {
      try {
        // mysql2 自动将 JSON 解析为数组
        const types = Array.isArray(app.type) ? app.type : JSON.parse(app.type);
        if (Array.isArray(types)) {
          for (const t of types) {
            if (t && t !== '') allTypeNames.add(t);
          }
        }
      } catch {}
    }
    console.log(`发现 ${allTypeNames.size} 个唯一类型名`);

    // 补充缺失的类型到 app_types 表
    const missingTypes = [...allTypeNames].filter(t => !typeNameToId.has(t));
    if (missingTypes.length > 0) {
      console.log(`补充 ${missingTypes.length} 个缺失的分类...`);
      for (let i = 0; i < missingTypes.length; i += BATCH) {
        const batch = missingTypes.slice(i, i + BATCH);
        const ph = batch.map(() => '(?)').join(',');
        await pool.execute(`INSERT IGNORE INTO app_types (type_name) VALUES ${ph}`, batch);
      }
      // 重新加载类型映射
      const [updatedTypes] = await pool.execute('SELECT id, type_name FROM app_types');
      typeNameToId.clear();
      for (const t of updatedTypes) {
        typeNameToId.set(t.type_name, t.id);
      }
      console.log(`app_types 表现在有 ${updatedTypes.length} 个分类`);
    }

    // 统计现有关联数据
    const [existingRels] = await pool.execute('SELECT COUNT(*) as cnt FROM app_type_relations');
    console.log(`\n现有关联记录: ${existingRels[0].cnt} 条`);

    if (!clean) {
      // 计算预期关联数
      let expectedCount = 0;
      for (const app of appRows) {
        try {
          // mysql2 自动将 JSON 解析为数组
          const types = Array.isArray(app.type) ? app.type : JSON.parse(app.type);
          if (Array.isArray(types)) {
            for (const t of types) {
              if (t && t !== '' && typeNameToId.has(t)) {
                expectedCount++;
              }
            }
          }
        } catch {}
      }
      console.log(`预期关联记录: ${expectedCount} 条`);
      console.log(`需要补充: ${expectedCount - existingRels[0].cnt} 条`);
      console.log('\n如需执行迁移，请加 --clean 参数');
      await pool.end().catch(() => {});
      return;
    }

    // 清空关联表（重新迁移）
    console.log('\n清空关联表...');
    await pool.execute('TRUNCATE TABLE app_type_relations');

    // 分批创建关联
    console.log('开始创建关联记录...');
    let totalInserted = 0;
    let skipped = 0;

    for (let i = 0; i < appRows.length; i += BATCH) {
      const batch = appRows.slice(i, i + BATCH);
      const relValues = [];

      for (const app of batch) {
        try {
          // mysql2 自动将 JSON 解析为数组
          const types = Array.isArray(app.type) ? app.type : JSON.parse(app.type);
          if (Array.isArray(types)) {
            for (const t of types) {
              if (t && t !== '' && typeNameToId.has(t)) {
                relValues.push([app.id, typeNameToId.get(t)]);
              }
            }
          }
        } catch {
          skipped++;
        }
      }

      if (relValues.length > 0) {
        const ph = relValues.map(() => '(?, ?)').join(',');
        const params = relValues.flat();
        const [result] = await pool.execute(
          `INSERT IGNORE INTO app_type_relations (app_id, type_id) VALUES ${ph}`,
          params
        );
        totalInserted += result.affectedRows;
      }

      process.stdout.write(`\r  已处理 ${Math.min(i + BATCH, appRows.length)}/${appRows.length} 记录`);
    }
    console.log('');

    // 验证
    const [finalCount] = await pool.execute('SELECT COUNT(*) as cnt FROM app_type_relations');
    console.log(`\n迁移完成:`);
    console.log(`  插入关联记录: ${totalInserted} 条`);
    console.log(`  最终关联记录: ${finalCount[0].cnt} 条`);
    if (skipped > 0) {
      console.log(`  跳过无效记录: ${skipped} 条`);
    }

    await pool.end().catch(() => {});
  } catch (error) {
    console.error('\n执行失败:', error.message);
    console.error(error.stack);
    await pool.end().catch(() => {});
  }
}

main();
