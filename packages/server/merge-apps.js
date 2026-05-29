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

function hasValue(v) {
  return v != null && v !== '' && v !== 'null';
}

function getRecordStatus(r) {
  const h = hasValue(r.harmony_package);
  const a = hasValue(r.android_package);
  if (h && a) return 'both';
  if (h) return 'harmony_only';
  if (a) return 'android_only';
  return 'neither';
}

function parseTypes(typeField) {
  if (!typeField) return [];
  if (Array.isArray(typeField)) return typeField.filter(t => t && t !== '');
  try {
    const parsed = JSON.parse(typeField);
    return Array.isArray(parsed) ? parsed.filter(t => t && t !== '') : [];
  } catch {
    return [];
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const clean = args.includes('--clean');

    console.log('加载所有记录...');
    const [allRows] = await pool.execute(
      'SELECT id, app_name, harmony_package, android_package, type FROM apps'
    );
    console.log(`共 ${allRows.length} 条记录`);

    // 解析 type 字段
    for (const r of allRows) {
      r._types = parseTypes(r.type);
    }

    // 按状态分组
    const bothRecords = [];
    const singleRecords = [];

    for (const r of allRows) {
      const status = getRecordStatus(r);
      r._status = status;
      if (status === 'both') bothRecords.push(r);
      else if (status !== 'neither') singleRecords.push(r);
    }

    console.log(`\n分类统计:`);
    console.log(`  完整记录（安卓+鸿蒙）: ${bothRecords.length}`);
    console.log(`  仅安卓: ${singleRecords.filter(r => r._status === 'android_only').length}`);
    console.log(`  仅鸿蒙: ${singleRecords.filter(r => r._status === 'harmony_only').length}`);

    // 建立单条记录的包名索引
    const androidIndex = new Map();
    const harmonyIndex = new Map();

    for (const r of singleRecords) {
      if (r._status === 'android_only') {
        if (!androidIndex.has(r.android_package)) androidIndex.set(r.android_package, []);
        androidIndex.get(r.android_package).push(r);
      } else {
        if (!harmonyIndex.has(r.harmony_package)) harmonyIndex.set(r.harmony_package, []);
        harmonyIndex.get(r.harmony_package).push(r);
      }
    }

    // 收集合并信息：keepId -> { record, typesToAdd: Set, deleteIds: [] }
    const mergeMap = new Map(); // keepId -> { record, typesToAdd, deleteIds }
    const deleteIds = new Set();

    function getOrCreateMerge(keepRecord) {
      if (!mergeMap.has(keepRecord.id)) {
        mergeMap.set(keepRecord.id, {
          record: keepRecord,
          typesToAdd: new Set(),
          deleteIds: [],
        });
      }
      return mergeMap.get(keepRecord.id);
    }

    // 场景1: 完整记录 vs 单一记录（包名匹配即重复）
    for (const full of bothRecords) {
      const merge = getOrCreateMerge(full);

      // 匹配 android_package
      const androidMatches = androidIndex.get(full.android_package) || [];
      for (const single of androidMatches) {
        if (!deleteIds.has(single.id)) {
          deleteIds.add(single.id);
          merge.deleteIds.push(single.id);
          // 收集被删除记录的分类
          for (const t of single._types) merge.typesToAdd.add(t);
        }
      }

      // 匹配 harmony_package
      const harmonyMatches = harmonyIndex.get(full.harmony_package) || [];
      for (const single of harmonyMatches) {
        if (!deleteIds.has(single.id)) {
          deleteIds.add(single.id);
          merge.deleteIds.push(single.id);
          for (const t of single._types) merge.typesToAdd.add(t);
        }
      }
    }

    // 场景2: 两条都只有安卓包名且一致 -> 保留 id 最大的，合并分类
    const androidOnlyRecords = singleRecords.filter(r => r._status === 'android_only');
    const androidGroups = new Map();
    for (const r of androidOnlyRecords) {
      if (!androidGroups.has(r.android_package)) androidGroups.set(r.android_package, []);
      androidGroups.get(r.android_package).push(r);
    }
    for (const [pkg, records] of androidGroups) {
      if (records.length > 1) {
        records.sort((a, b) => b.id - a.id);
        const keep = records[0];
        const merge = getOrCreateMerge(keep);
        for (let i = 1; i < records.length; i++) {
          if (!deleteIds.has(records[i].id)) {
            deleteIds.add(records[i].id);
            merge.deleteIds.push(records[i].id);
            for (const t of records[i]._types) merge.typesToAdd.add(t);
          }
        }
      }
    }

    // 场景3: 两条都只有鸿蒙包名且一致 -> 保留 id 最大的，合并分类
    const harmonyOnlyRecords = singleRecords.filter(r => r._status === 'harmony_only');
    const harmonyGroups = new Map();
    for (const r of harmonyOnlyRecords) {
      if (!harmonyGroups.has(r.harmony_package)) harmonyGroups.set(r.harmony_package, []);
      harmonyGroups.get(r.harmony_package).push(r);
    }
    for (const [pkg, records] of harmonyGroups) {
      if (records.length > 1) {
        records.sort((a, b) => b.id - a.id);
        const keep = records[0];
        const merge = getOrCreateMerge(keep);
        for (let i = 1; i < records.length; i++) {
          if (!deleteIds.has(records[i].id)) {
            deleteIds.add(records[i].id);
            merge.deleteIds.push(records[i].id);
            for (const t of records[i]._types) merge.typesToAdd.add(t);
          }
        }
      }
    }

    // 过滤出真正需要合并分类的记录（有新分类要添加的）
    const mergesWithTypes = [...mergeMap.values()].filter(m => m.typesToAdd.size > 0);

    console.log(`\n发现 ${deleteIds.size} 条待删除记录`);
    console.log(`其中 ${mergesWithTypes.length} 条需要合并分类`);

    if (mergesWithTypes.length > 0) {
      console.log('\n分类合并详情（前 20 组）:');
      for (const m of mergesWithTypes.slice(0, 20)) {
        const existingTypes = m.record._types.join(', ') || '(无)';
        const newTypes = [...m.typesToAdd].join(', ');
        console.log(`  #${m.record.id} (${m.record.app_name}): [${existingTypes}] + [${newTypes}] -> 删除 ${m.deleteIds.length} 条`);
      }
      if (mergesWithTypes.length > 20) {
        console.log(`  ... 还有 ${mergesWithTypes.length - 20} 组`);
      }
    }

    if (!clean) {
      console.log('\n如需执行清理，请加 --clean 参数');
      await pool.end().catch(() => {});
      return;
    }

    // Step 1: 合并分类到保留记录
    if (mergesWithTypes.length > 0) {
      console.log(`\n开始合并分类...`);

      // 加载 app_types 映射
      const [typeRows] = await pool.execute('SELECT id, type_name FROM app_types');
      const typeNameToId = new Map();
      for (const t of typeRows) typeNameToId.set(t.type_name, t.id);

      let mergedCount = 0;
      for (const m of mergesWithTypes) {
        // 合并后的完整分类列表
        const allTypes = [...new Set([...m.record._types, ...m.typesToAdd])];
        const newTypeJson = JSON.stringify(allTypes);

        // 更新 apps.type 字段
        await pool.execute('UPDATE apps SET type = ? WHERE id = ?', [newTypeJson, m.record.id]);

        // 更新关联表：删除旧关联，插入新关联
        await pool.execute('DELETE FROM app_type_relations WHERE app_id = ?', [m.record.id]);

        const relValues = [];
        for (const t of allTypes) {
          if (typeNameToId.has(t)) {
            relValues.push([m.record.id, typeNameToId.get(t)]);
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

        mergedCount++;
        process.stdout.write(`\r  已合并 ${mergedCount}/${mergesWithTypes.length} 条`);
      }
      console.log('');
    }

    // Step 2: 删除重复记录
    const idsToDelete = [...deleteIds];
    console.log(`\n开始批量删除 ${idsToDelete.length} 条记录...`);

    let deleted = 0;
    for (let i = 0; i < idsToDelete.length; i += BATCH) {
      const batch = idsToDelete.slice(i, i + BATCH);
      const ph = batch.map(() => '?').join(',');
      const [r] = await pool.execute(`DELETE FROM apps WHERE id IN (${ph})`, batch);
      deleted += r.affectedRows;
      process.stdout.write(`\r  已删除 ${deleted}/${idsToDelete.length}`);
    }
    console.log('');

    const [total] = await pool.execute('SELECT COUNT(*) as cnt FROM apps');
    console.log(`清理完成，剩余 ${total[0].cnt} 条记录`);
    await pool.end().catch(() => {});
  } catch (error) {
    console.error('\n执行失败:', error.message);
    console.error(error.stack);
    await pool.end().catch(() => {});
  }
}

main();
