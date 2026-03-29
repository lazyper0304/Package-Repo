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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

    // 检查并添加 updated_at 字段（如果不存在）
    try {
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM apps WHERE Field = 'updated_at'"
      );

      if (columns.length === 0) {
        console.log('检测到 apps 表缺少 updated_at 字段，开始添加...');
        await connection.execute('ALTER TABLE apps ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        console.log('updated_at 字段添加成功');
      }
    } catch (addUpdatedAtError) {
      console.error('添加 updated_at 字段失败:', addUpdatedAtError);
      // 继续执行，不中断初始化过程
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS app_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(255) NOT NULL UNIQUE,
        sort INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查并添加 sort 字段（如果不存在）
    try {
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM app_types WHERE Field = 'sort'"
      );

      if (columns.length === 0) {
        console.log('检测到 app_types 表缺少 sort 字段，开始添加...');
        await connection.execute('ALTER TABLE app_types ADD COLUMN sort INT DEFAULT 0');
        console.log('sort 字段添加成功');
      }
    } catch (addSortError) {
      console.error('添加 sort 字段失败:', addSortError);
      // 继续执行，不中断初始化过程
    }

    console.log('数据库表初始化成功');
    connection.release();
  } catch (error) {
    console.error('数据库表初始化失败:', error);
  }
}

// 执行初始化
async function runInit() {
  try {
    await createDatabase();
    await testConnection();
    await initDatabase();
  } catch (error) {
    console.error('初始化过程中出错:', error);
  }
}

// 只有当直接运行此文件时才执行初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  runInit().then(() => {
    console.log('初始化完成');
  }).catch((error) => {
    console.error('初始化失败:', error);
  });
}

export { pool, testConnection, initDatabase, createDatabase };
