import { pool } from './db.js';

async function checkTableStructure() {
  try {
    const connection = await pool.getConnection();
    
    // 检查apps表结构
    console.log('检查apps表结构:');
    const [columns] = await connection.execute('SHOW COLUMNS FROM apps');
    columns.forEach(column => {
      console.log(`${column.Field}: ${column.Type}`);
    });
    
    connection.release();
  } catch (error) {
    console.error('检查数据库表结构失败:', error);
  }
}

checkTableStructure();