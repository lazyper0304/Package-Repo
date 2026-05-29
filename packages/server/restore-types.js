import mysql from 'mysql2/promise';
import fs from 'fs';

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

    console.log('读取备份文件...');
    const content = fs.readFileSync('C:/Users/hexu/Downloads/app_search.sql', 'utf8');

    // 解析备份中的 type 数据：通过 id 和 app_name 匹配
    const backupTypes = new Map(); // id -> [type1, type2, ...]
    const backupNameToTypes = new Map(); // app_name -> [type1, type2, ...]

    // 解析 SQL 行
    function parseSqlRow(line) {
      const inner = line.replace(/^\(/, '').replace(/\)[,\s]*$/, '');
      const fields = [];
      let i = 0;
      while (i < inner.length) {
        while (i < inner.length && (inner[i] === ' ' || inner[i] === ',')) i++;
        if (i >= inner.length) break;
        if (inner[i] === "'") {
          i++;
          let val = '';
          while (i < inner.length) {
            if (inner[i] === '\\') {
              val += inner[i + 1] || '';
              i += 2;
            } else if (inner[i] === "'") {
              if (inner[i + 1] === "'") {
                val += "'";
                i += 2;
              } else {
                i++;
                break;
              }
            } else {
              val += inner[i];
              i++;
            }
          }
          fields.push(val);
        } else if (inner[i] === 'N' && inner.substring(i, i + 4) === 'NULL') {
          fields.push(null);
          i += 4;
        } else {
          let val = '';
          while (i < inner.length && inner[i] !== ',') {
            val += inner[i];
            i++;
          }
          fields.push(val.trim());
        }
      }
      return fields;
    }

    const lines = content.split('\n');
    let totalParsed = 0;

    for (const line of lines) {
      if (!line.startsWith('(')) continue;

      const fields = parseSqlRow(line);
      if (fields.length >= 7) {
        const id = parseInt(fields[0]);
        const appName = fields[1];
        const typeStr = fields[6];

        if (typeStr && typeStr !== '[]') {
          try {
            const types = JSON.parse(typeStr);
            if (Array.isArray(types) && types.length > 0) {
              backupTypes.set(id, types);
              backupNameToTypes.set(appName, types);
              totalParsed++;
            }
          } catch {}
        }
      }
    }

    console.log(`备份解析完成: ${totalParsed} 条有分类的记录`);

    // 获取当前数据库数据
    console.log('加载当前数据库...');
    const [currentRows] = await pool.execute('SELECT id, app_name, type FROM apps');
    console.log(`当前数据库: ${currentRows.length} 条记录`);

    // 加载 app_types 映射
    const [typeRows] = await pool.execute('SELECT id, type_name FROM app_types');
    const typeNameToId = new Map();
    for (const t of typeRows) typeNameToId.set(t.type_name, t.id);

    // 分析需要补充的分类
    const updates = []; // { id, app_name, currentTypes, backupTypes, mergedTypes }

    for (const row of currentRows) {
      const currentTypes = Array.isArray(row.type) ? row.type : [];
      let bTypes = backupTypes.get(row.id);

      // 如果通过 id 没找到，尝试通过 app_name 匹配
      if (!bTypes) {
        bTypes = backupNameToTypes.get(row.app_name);
      }

      if (!bTypes || bTypes.length === 0) continue;

      // 计算需要补充的分类
      const missingTypes = bTypes.filter(t => !currentTypes.includes(t));
      if (missingTypes.length > 0) {
        const mergedTypes = [...new Set([...currentTypes, ...bTypes])];
        updates.push({
          id: row.id,
          app_name: row.app_name,
          currentTypes,
          missingTypes,
          mergedTypes,
        });
      }
    }

    console.log(`\n需要补充分类的记录: ${updates.length} 条`);

    if (updates.length > 0) {
      // 统计涉及的分类
      const allMissingTypes = new Set();
      for (const u of updates) {
        for (const t of u.missingTypes) allMissingTypes.add(t);
      }
      console.log(`涉及的分类: ${[...allMissingTypes].join(', ')}`);

      console.log('\n前 20 条更新预览:');
      for (const u of updates.slice(0, 20)) {
        console.log(`  #${u.id} (${u.app_name}): ${JSON.stringify(u.currentTypes)} + ${JSON.stringify(u.missingTypes)} -> ${JSON.stringify(u.mergedTypes)}`);
      }
      if (updates.length > 20) {
        console.log(`  ... 还有 ${updates.length - 20} 条`);
      }
    }

    if (!clean) {
      console.log('\n如需执行恢复，请加 --clean 参数');
      await pool.end().catch(() => {});
      return;
    }

    // 执行更新
    console.log('\n开始恢复分类...');

    // 先补充缺失的分类到 app_types 表
    const allTypeNames = new Set();
    for (const u of updates) {
      for (const t of u.mergedTypes) allTypeNames.add(t);
    }
    const missingInAppTypes = [...allTypeNames].filter(t => !typeNameToId.has(t));
    if (missingInAppTypes.length > 0) {
      console.log(`补充 ${missingInAppTypes.length} 个缺失的分类到 app_types 表...`);
      for (const t of missingInAppTypes) {
        await pool.execute('INSERT IGNORE INTO app_types (type_name) VALUES (?)', [t]);
      }
      // 重新加载
      const [updatedTypes] = await pool.execute('SELECT id, type_name FROM app_types');
      typeNameToId.clear();
      for (const t of updatedTypes) typeNameToId.set(t.type_name, t.id);
    }

    let updatedCount = 0;
    for (const u of updates) {
      const newTypeJson = JSON.stringify(u.mergedTypes);

      // 更新 apps.type 字段
      await pool.execute('UPDATE apps SET type = ? WHERE id = ?', [newTypeJson, u.id]);

      // 更新关联表
      await pool.execute('DELETE FROM app_type_relations WHERE app_id = ?', [u.id]);
      const relValues = [];
      for (const t of u.mergedTypes) {
        if (typeNameToId.has(t)) {
          relValues.push([u.id, typeNameToId.get(t)]);
        }
      }
      if (relValues.length > 0) {
        const ph = relValues.map(() => '(?, ?)').join(',');
        const params = relValues.flat();
        await pool.execute(
          `INSERT IGNORE INTO app_type_relations (app_id, type_id) VALUES ${ph}`,
          params
        );
      }

      updatedCount++;
      process.stdout.write(`\r  已恢复 ${updatedCount}/${updates.length} 条`);
    }
    console.log('');

    // 验证
    const [finalStats] = await pool.execute(`
      SELECT COUNT(*) as total, SUM(CASE WHEN JSON_LENGTH(type) > 0 THEN 1 ELSE 0 END) as has_types FROM apps
    `);
    console.log(`\n恢复完成:`);
    console.log(`  更新记录: ${updatedCount} 条`);
    console.log(`  有分类记录: ${finalStats[0].has_types}/${finalStats[0].total}`);

    await pool.end().catch(() => {});
  } catch (error) {
    console.error('\n执行失败:', error.message);
    console.error(error.stack);
    await pool.end().catch(() => {});
  }
}

main();
