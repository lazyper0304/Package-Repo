import mysql from 'mysql2/promise';

// ========== 修改这里的连接配置为线上数据库 ==========
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'app_search',
  waitForConnections: true,
  connectionLimit: 10,
});
// ==================================================

const BATCH = 500;

async function main() {
  try {
    // Step 1: 添加索引
    console.log('Step 1: 检查并添加索引...');

    const [indexes] = await pool.execute("SHOW INDEX FROM app_type_relations");
    const indexNames = new Set(indexes.map(i => i.Key_name));

    if (!indexNames.has('idx_app_type')) {
      await pool.execute('ALTER TABLE app_type_relations ADD UNIQUE KEY idx_app_type (app_id, type_id)');
      console.log('  添加索引 idx_app_type');
    } else {
      console.log('  索引 idx_app_type 已存在');
    }

    if (!indexNames.has('idx_type_id')) {
      await pool.execute('ALTER TABLE app_type_relations ADD KEY idx_type_id (type_id)');
      console.log('  添加索引 idx_type_id');
    } else {
      console.log('  索引 idx_type_id 已存在');
    }

    // Step 2: 加载类型映射
    console.log('\nStep 2: 加载类型映射...');
    const [typeRows] = await pool.execute('SELECT id, type_name FROM app_types');
    const typeNameToId = new Map();
    for (const t of typeRows) {
      typeNameToId.set(t.type_name, t.id);
    }
    console.log(`  ${typeRows.length} 个分类`);

    // Step 3: 加载有分类的应用
    console.log('\nStep 3: 加载应用数据...');
    const [appRows] = await pool.execute('SELECT id, type FROM apps WHERE JSON_LENGTH(type) > 0');
    console.log(`  ${appRows.length} 条有分类的记录`);

    // Step 4: 清空关联表重新迁移
    console.log('\nStep 4: 清空关联表并重新迁移...');
    await pool.execute('TRUNCATE TABLE app_type_relations');

    let totalInserted = 0;

    for (let i = 0; i < appRows.length; i += BATCH) {
      const batch = appRows.slice(i, i + BATCH);
      const relValues = [];

      for (const app of batch) {
        try {
          const types = Array.isArray(app.type) ? app.type : JSON.parse(app.type);
          if (Array.isArray(types)) {
            for (const t of types) {
              if (t && typeNameToId.has(t)) {
                relValues.push([app.id, typeNameToId.get(t)]);
              }
            }
          }
        } catch {}
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

      process.stdout.write(`\r  已处理 ${Math.min(i + BATCH, appRows.length)}/${appRows.length}`);
    }
    console.log('');

    // Step 5: 验证
    const [finalCount] = await pool.execute('SELECT COUNT(*) as cnt FROM app_type_relations');
    console.log(`\n完成! 共插入 ${totalInserted} 条关联记录`);

    // 按分类统计
    const [stats] = await pool.execute(`
      SELECT t.type_name, COUNT(r.app_id) as cnt
      FROM app_types t
      LEFT JOIN app_type_relations r ON r.type_id = t.id
      GROUP BY t.id, t.type_name
      ORDER BY cnt DESC
    `);
    console.log('\n各分类应用数量:');
    for (const s of stats) {
      console.log(`  ${s.type_name}: ${s.cnt}`);
    }

    await pool.end().catch(() => {});
  } catch (error) {
    console.error('\n执行失败:', error.message);
    await pool.end().catch(() => {});
  }
}

main();
