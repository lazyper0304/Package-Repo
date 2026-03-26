import mysql from 'mysql2/promise';

// 先创建数据库的连接（不指定数据库）
const createDbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 创建数据库
async function createDatabase() {
  try {
    const connection = await createDbPool.getConnection();
    await connection.execute('CREATE DATABASE IF NOT EXISTS app_search');
    console.log('数据库创建成功');
    connection.release();
  } catch (error) {
    console.error('数据库创建失败:', error);
  }
}

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'app_search',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

// 初始化数据库表
async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    // 创建应用表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS apps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        app_name VARCHAR(255) NOT NULL,
        harmony_package VARCHAR(255),
        android_package VARCHAR(255),
        icon_url VARCHAR(512),
        type VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_unique_app (app_name, harmony_package, android_package)
      )
    `);

    // 检查表结构，升级 type 字段为 JSON 类型
    try {
      // 检查 type 字段类型
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM apps WHERE Field = 'type'"
      );

      if (columns.length > 0 && columns[0].Type === 'varchar(255)') {
        console.log('检测到 type 字段为 VARCHAR 类型，开始升级为 JSON 类型...');

        // 添加临时列
        await connection.execute('ALTER TABLE apps ADD COLUMN type_temp JSON');

        // 将现有数据转换为数组格式
        await connection.execute(
          `UPDATE apps SET type_temp = CASE 
            WHEN type IS NOT NULL AND type != '' THEN JSON_ARRAY(type) 
            ELSE JSON_ARRAY() 
          END`
        );

        // 删除原 type 列
        await connection.execute('ALTER TABLE apps DROP COLUMN type');

        // 将临时列重命名为 type
        await connection.execute(
          'ALTER TABLE apps CHANGE COLUMN type_temp type JSON'
        );

        console.log('type 字段升级为 JSON 类型成功');
      }
    } catch (upgradeError) {
      console.error('升级 type 字段失败:', upgradeError);
      // 继续执行，不中断初始化过程
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('数据库表初始化成功');
    connection.release();
  } catch (error) {
    console.error('数据库表初始化失败:', error);
  }
}

export { pool, testConnection, initDatabase, createDatabase };
