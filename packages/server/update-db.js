import mysql from 'mysql2/promise';

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'app_search',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 修改数据库表结构
async function updateDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 检查是否存在 package_name 字段
    const [columns] = await connection.execute('DESCRIBE apps');
    const hasPackageName = columns.some(col => col.Field === 'package_name');
    const hasHarmonyPackage = columns.some(col => col.Field === 'harmony_package');
    const hasAndroidPackage = columns.some(col => col.Field === 'android_package');
    
    console.log('当前表结构:', columns.map(col => col.Field));
    
    // 如果存在 package_name 字段，将其改为 harmony_package
    if (hasPackageName && !hasHarmonyPackage) {
      await connection.execute('ALTER TABLE apps CHANGE COLUMN package_name harmony_package VARCHAR(255) NOT NULL');
      console.log('已将 package_name 字段改为 harmony_package');
    }
    
    // 如果不存在 android_package 字段，添加它
    if (!hasAndroidPackage) {
      await connection.execute('ALTER TABLE apps ADD COLUMN android_package VARCHAR(255)');
      console.log('已添加 android_package 字段');
    }
    
    // 检查修改后的表结构
    const [newColumns] = await connection.execute('DESCRIBE apps');
    console.log('修改后的表结构:', newColumns.map(col => col.Field));
    
    connection.release();
  } catch (error) {
    console.error('修改表结构失败:', error);
  } finally {
    await pool.end();
  }
}

// 执行修改
updateDatabase();
