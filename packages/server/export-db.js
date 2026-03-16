import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'app_search',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function exportDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // 获取所有表
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    let sqlContent = `-- Database: app_search\n`;
    sqlContent += `-- Generated on: ${new Date().toISOString()}\n\n`;
    sqlContent += `CREATE DATABASE IF NOT EXISTS app_search;\n`;
    sqlContent += `USE app_search;\n\n`;
    sqlContent += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;
    
    for (const tableName of tableNames) {
      // 获取表结构
      const [createTable] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
      sqlContent += `-- Table structure for table ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS ${tableName};\n`;
      sqlContent += `${createTable[0]['Create Table']};\n\n`;
      
      // 获取表数据
      const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
      
      if (rows.length > 0) {
        sqlContent += `-- Data for table ${tableName}\n`;
        sqlContent += `INSERT INTO ${tableName} VALUES\n`;
        
        const values = rows.map(row => {
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "\\'")}'`;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return val;
          });
          return `(${values.join(', ')})`;
        });
        
        sqlContent += `${values.join(',\n')};\n\n`;
      }
    }
    
    sqlContent += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    
    connection.release();
    
    // 写入文件
    const outputPath = path.join(process.cwd(), 'app_search.sql');
    fs.writeFileSync(outputPath, sqlContent, 'utf8');
    
    console.log('数据库导出成功！');
    console.log('文件路径:', outputPath);
    console.log('表数量:', tableNames.length);
    
  } catch (error) {
    console.error('导出数据库失败:', error);
  } finally {
    await pool.end();
  }
}

exportDatabase();