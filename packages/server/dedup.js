import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'app_search',
  waitForConnections: true,
  connectionLimit: 10,
});

async function main() {
  try {
    const args = process.argv.slice(2);
    const clean = args.includes('--clean');

    if (!clean) {
      const [h] = await pool.execute(`
        SELECT COUNT(*) as dupes, COALESCE(SUM(cnt - 1), 0) as waste FROM (
          SELECT harmony_package, COUNT(*) as cnt FROM apps
          WHERE harmony_package IS NOT NULL AND harmony_package != ''
          GROUP BY harmony_package HAVING cnt > 1
        ) t
      `);
      const [a] = await pool.execute(`
        SELECT COUNT(*) as dupes, COALESCE(SUM(cnt - 1), 0) as waste FROM (
          SELECT android_package, COUNT(*) as cnt FROM apps
          WHERE android_package IS NOT NULL AND android_package != ''
          GROUP BY android_package HAVING cnt > 1
        ) t
      `);
      console.log(`harmony_package 重复: ${h[0].dupes} 组, 待删除 ${h[0].waste} 条`);
      console.log(`android_package 重复: ${a[0].dupes} 组, 待删除 ${a[0].waste} 条`);
      console.log(`\n如需清理请加 --clean 参数`);
      await pool.end();
      return;
    }

    // 先查出要保留的 id
    console.log('查找需要保留的记录...');

    // harmony_package: 每组保留 id 最大的
    const [hKeep] = await pool.execute(`
      SELECT MAX(id) as keep_id FROM apps
      WHERE harmony_package IS NOT NULL AND harmony_package != ''
      GROUP BY harmony_package
      HAVING COUNT(*) > 1
    `);
    const hKeepIds = hKeep.map(r => r.keep_id);

    // android_package: 每组保留 id 最大的（排除上面已保留的）
    const [aKeep] = await pool.execute(`
      SELECT MAX(id) as keep_id FROM apps
      WHERE android_package IS NOT NULL AND android_package != ''
      GROUP BY android_package
      HAVING COUNT(*) > 1
    `);
    const aKeepIds = aKeep.map(r => r.keep_id);

    const allKeepIds = [...new Set([...hKeepIds, ...aKeepIds])];

    if (allKeepIds.length === 0) {
      console.log('没有重复数据');
      await pool.end();
      return;
    }

    console.log(`保留 ${allKeepIds.length} 条，开始批量删除重复数据...`);

    // 用临时表加速删除
    await pool.execute('CREATE TEMPORARY TABLE IF NOT EXISTS tmp_keep_ids (id INT PRIMARY KEY)');

    // 清空临时表
    await pool.execute('TRUNCATE TABLE tmp_keep_ids');

    // 分批插入保留 id 到临时表
    const BATCH = 1000;
    for (let i = 0; i < allKeepIds.length; i += BATCH) {
      const batch = allKeepIds.slice(i, i + BATCH);
      const ph = batch.map(() => '(?)').join(',');
      await pool.execute(`INSERT INTO tmp_keep_ids VALUES ${ph}`, batch);
    }

    // 有重复的 harmony_package 的 id
    const [hDupes] = await pool.execute(`
      SELECT id FROM apps
      WHERE harmony_package IS NOT NULL AND harmony_package != ''
      AND harmony_package IN (
        SELECT harmony_package FROM apps
        WHERE harmony_package IS NOT NULL AND harmony_package != ''
        GROUP BY harmony_package HAVING COUNT(*) > 1
      )
    `);
    const hDupeIds = hDupes.map(r => r.id);

    // 有重复的 android_package 的 id
    const [aDupes] = await pool.execute(`
      SELECT id FROM apps
      WHERE android_package IS NOT NULL AND android_package != ''
      AND android_package IN (
        SELECT android_package FROM apps
        WHERE android_package IS NOT NULL AND android_package != ''
        GROUP BY android_package HAVING COUNT(*) > 1
      )
    `);
    const aDupeIds = aDupes.map(r => r.id);

    const allDupeIds = [...new Set([...hDupeIds, ...aDupeIds])];
    const deleteIds = allDupeIds.filter(id => !allKeepIds.includes(id));

    console.log(`共 ${deleteIds.length} 条待删除`);

    // 分批删除
    let deleted = 0;
    for (let i = 0; i < deleteIds.length; i += BATCH) {
      const batch = deleteIds.slice(i, i + BATCH);
      const ph = batch.map(() => '?').join(',');
      const [r] = await pool.execute(`DELETE FROM apps WHERE id IN (${ph})`, batch);
      deleted += r.affectedRows;
      process.stdout.write(`\r  已删除 ${deleted}/${deleteIds.length}`);
    }
    console.log('');

    // 清理临时表
    await pool.execute('DROP TEMPORARY TABLE IF EXISTS tmp_keep_ids');

    const [total] = await pool.execute('SELECT COUNT(*) as cnt FROM apps');
    console.log(`清理完成，剩余 ${total[0].cnt} 条记录`);
  } catch (error) {
    console.error('\n执行失败:', error.message);
  } finally {
    await pool.end();
  }
}

main();
