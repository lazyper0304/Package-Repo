import { testConnection, initDatabase, createDatabase } from './db.js'

// 初始化数据库
export async function initialize() {
  await createDatabase()
  await testConnection()
  await initDatabase()
}
