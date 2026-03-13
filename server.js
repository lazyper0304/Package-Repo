import express from 'express'
import axios from 'axios'
import cors from 'cors'
import multer from 'multer'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { pool, testConnection, initDatabase, createDatabase } from './db.js'

// 配置静态文件服务
const app = express()
app.use(cors())
app.use(express.json())

// 简化版本：直接返回_bg版本的图标文件
// 注意：由于浏览器一次只能下载一个文件，我们返回_bg版本
// 用户可以根据需要重命名为_fg版本

// 配置Excel文件上传
const uploadExcel = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制文件大小为10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传Excel文件'), false)
    }
  },
})

// 配置鸿蒙图标文件上传
const uploadHarmony = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true)
    } else {
      cb(new Error('只允许上传PNG格式的文件'), false)
    }
  },
})

// 创建上传目录
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// 存储token
let token = null

// 获取token
async function getToken() {
  try {
    const response = await axios.get('https://app.mi.com', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    // 从响应中提取token
    const tokenMatch = response.data.match(/token:\s*["']([^"']+)["']/)
    if (tokenMatch) {
      token = tokenMatch[1]
      console.log('获取到token:', token)
    }
  } catch (error) {
    console.error('获取token失败:', error)
  }
}

// 初始化获取token
getToken()

// 初始化数据库
async function initialize() {
  await createDatabase()
  await testConnection()
  await initDatabase()
}

// 执行初始化
initialize()

// Excel文件上传和处理路由
app.post('/api/upload-excel', uploadExcel.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const filePath = req.file.path

    // 读取Excel文件
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    // 清理临时文件
    fs.unlinkSync(filePath)

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel文件为空或格式不正确' })
    }

    // 验证数据格式
    const validData = []
    for (const row of data) {
      const appName = row['应用名称'] || row['应用名'] || row['name'] || row['app_name']
      const harmonyPackage = row['鸿蒙包名'] || row['包名'] || row['package'] || row['package_name']
      const androidPackage = row['安卓包名'] || row['android_package'] || ''

      if (appName && harmonyPackage) {
        validData.push({
          appName: String(appName).trim(),
          harmonyPackage: String(harmonyPackage).trim(),
          androidPackage: String(androidPackage).trim(),
        })
      }
    }

    if (validData.length === 0) {
      return res.status(400).json({ error: '未找到有效的应用数据，请确保包含"应用名称"和"包名"列' })
    }

    // 将数据插入数据库
    let successCount = 0
    let errorCount = 0

    for (const app of validData) {
      try {
        await pool.execute('INSERT IGNORE INTO apps (app_name, harmony_package, android_package) VALUES (?, ?, ?)', [
          app.appName,
          app.harmonyPackage,
          app.androidPackage,
        ])
        successCount++
      } catch (dbError) {
        console.error('插入数据失败:', dbError)
        errorCount++
      }
    }

    res.json({
      success: true,
      message: `成功导入 ${successCount} 个应用，失败 ${errorCount} 个`,
      total: validData.length,
      successCount,
      errorCount,
    })
  } catch (error) {
    console.error('处理Excel文件失败:', error)
    res.status(500).json({ error: '处理文件失败: ' + error.message })
  }
})

// 获取所有应用数据
app.get('/api/apps', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, app_name, harmony_package, android_package, created_at FROM apps ORDER BY created_at DESC',
    )

    res.json({
      success: true,
      data: rows,
      total: rows.length,
    })
  } catch (error) {
    console.error('获取应用列表失败:', error)
    res.status(500).json({ error: '获取应用列表失败: ' + error.message })
  }
})

// 搜索应用数据
app.get('/api/search-apps', async (req, res) => {
  try {
    const { keyword, current = 1, pageSize = 20 } = req.query

    // 参数处理，确保是正整数
    const currentPage = Math.max(1, parseInt(current) || 1)
    const pageLimit = Math.max(1, parseInt(pageSize) || 20) // 默认每页20条
    const offset = (currentPage - 1) * pageLimit

    // 构建基础查询
    let query = 'SELECT id, app_name, harmony_package, android_package, created_at FROM apps'
    let countQuery = 'SELECT COUNT(*) as total FROM apps'
    const params = []
    const countParams = []

    // 如果有keyword，添加搜索条件
    if (keyword && keyword.trim()) {
      const searchPattern = `%${keyword.trim()}%`
      const whereCondition = ' WHERE app_name LIKE ? OR harmony_package LIKE ? OR android_package LIKE ?'
      query += whereCondition
      countQuery += whereCondition

      // 为两个查询都添加参数
      params.push(searchPattern, searchPattern, searchPattern)
      countParams.push(searchPattern, searchPattern, searchPattern)
    }

    // 添加排序，使用字符串拼接LIMIT和OFFSET来避免prepared statements的问题
    query += ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`

    // 执行查询
    const [rows] = await pool.execute(query, params)
    const [countResult] = await pool.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      success: true,
      data: rows,
      total: total,
      currentPage: currentPage,
      pageSize: pageLimit,
      totalPages: Math.ceil(total / pageLimit),
    })
  } catch (error) {
    console.error('搜索应用失败:', error)
    res.status(500).json({
      success: false,
      error: '搜索应用失败: ' + error.message,
    })
  }
})

// 添加新应用
app.post('/api/apps', async (req, res) => {
  try {
    const { appName, harmonyPackage, androidPackage } = req.body

    if (!appName) {
      return res.status(400).json({ error: '应用名称不能为空' })
    }

    await pool.execute('INSERT INTO apps (app_name, harmony_package, android_package) VALUES (?, ?, ?)', [
      appName.trim(),
      harmonyPackage.trim(),
      (androidPackage || '').trim(),
    ])

    res.json({
      success: true,
      message: '应用添加成功',
    })
  } catch (error) {
    console.error('添加应用失败:', error)
    res.status(500).json({ error: '添加应用失败: ' + error.message })
  }
})

// 删除应用
app.delete('/api/apps/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [result] = await pool.execute('DELETE FROM apps WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '应用不存在' })
    }

    res.json({
      success: true,
      message: '应用删除成功',
    })
  } catch (error) {
    console.error('删除应用失败:', error)
    res.status(500).json({ error: '删除应用失败: ' + error.message })
  }
})

// 更新应用
app.put('/api/apps/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { appName, harmonyPackage, androidPackage } = req.body

    if (!appName) {
      return res.status(400).json({ error: '应用名称不能为空' })
    }

    const [result] = await pool.execute(
      'UPDATE apps SET app_name = ?, harmony_package = ?, android_package = ? WHERE id = ?',
      [appName.trim(), harmonyPackage.trim(), (androidPackage || '').trim(), id],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '应用不存在' })
    }

    res.json({
      success: true,
      message: '应用更新成功',
    })
  } catch (error) {
    console.error('更新应用失败:', error)
    res.status(500).json({ error: '更新应用失败: ' + error.message })
  }
})

// 导出Excel文件
app.get('/api/export-excel', async (req, res) => {
  try {
    // 从数据库获取所有应用数据
    const [rows] = await pool.execute(
      'SELECT app_name, harmony_package, android_package, created_at FROM apps ORDER BY created_at DESC',
    )

    if (rows.length === 0) {
      return res.status(400).json({ error: '没有数据可以导出' })
    }

    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    const worksheetData = rows.map((row) => ({
      应用名称: row.app_name,
      鸿蒙包名: row.harmony_package,
      安卓包名: row.android_package,
      创建时间: row.created_at,
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)

    // 设置列宽
    worksheet['!cols'] = [
      { width: 30 }, // 应用名称列宽
      { width: 40 }, // 鸿蒙包名列宽
      { width: 40 }, // 安卓包名列宽
      { width: 20 }, // 创建时间列宽
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, '应用列表')

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const fileName = '应用列表.xlsx'
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    res.setHeader('Content-Length', excelBuffer.length)

    // 发送文件
    res.send(excelBuffer)
  } catch (error) {
    console.error('导出Excel失败:', error)
    res.status(500).json({ error: '导出Excel失败: ' + error.message })
  }
})

// 苹果应用商店图标获取API
app.get('/api/apple-store-icon', async (req, res) => {
  try {
    const { appName } = req.query

    if (!appName) {
      return res.status(400).json({ error: '应用名称不能为空' })
    }

    const encodedKeyword = encodeURIComponent(appName)
    const searchUrl = `https://www.apple.com.cn/cn/search/${encodedKeyword}?src=globalnav`

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
      },
    })

    if (response.status === 200) {
      const html = response.data

      // 查找应用图标链接
      const iconPattern = /http[s]?:\/\/is[0-9]-ssl\.mzstatic\.com\/image\/thumb\/[^"\s]+\/AppIcon-[^"\s]+\.png/g
      const iconLinks = html.match(iconPattern) || []

      if (iconLinks.length > 0) {
        const iconUrl = iconLinks[0].replace('http://', 'https://')
        return res.json({
          success: true,
          iconUrl: iconUrl,
        })
      }

      // 尝试查找其他格式的图标链接
      const otherIconPattern = /http[s]?:\/\/[^"\s]+\/AppIcon[^"\s]+/g
      const otherIcons = html.match(otherIconPattern) || []

      if (otherIcons.length > 0) {
        const iconUrl = otherIcons[0].replace('http://', 'https://')
        return res.json({
          success: true,
          iconUrl: iconUrl,
        })
      }
    }

    res.json({
      success: false,
      error: '未找到应用图标',
    })
  } catch (error) {
    console.error('获取苹果应用商店图标失败:', error)
    res.status(500).json({
      success: false,
      error: '获取图标失败: ' + error.message,
    })
  }
})

// 鸿蒙双层图标处理API - 生成两个版本的图标并返回下载链接
app.post('/api/harmony-icon', uploadHarmony.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const filePath = req.file.path
    const fileName = req.file.originalname

    // 检查文件扩展名
    if (!fileName.toLowerCase().endsWith('.png')) {
      fs.unlinkSync(filePath)
      return res.status(400).json({ error: '只支持PNG格式的文件' })
    }

    // 创建output文件夹
    const outputDir = path.join(process.cwd(), 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 获取文件名（不含扩展名）
    const baseName = path.parse(fileName).name

    // 生成_bg和_fg版本
    const bgDestFile = path.join(outputDir, `${baseName}_bg.png`)
    const fgDestFile = path.join(outputDir, `${baseName}_fg.png`)

    // 复制文件
    fs.copyFileSync(filePath, bgDestFile)
    fs.copyFileSync(filePath, fgDestFile)

    // 清理临时文件
    fs.unlinkSync(filePath)

    // 返回两个文件的下载链接
    res.json({
      success: true,
      bgUrl: `/api/download-icon?file=${encodeURIComponent(`${baseName}_bg.png`)}`,
      fgUrl: `/api/download-icon?file=${encodeURIComponent(`${baseName}_fg.png`)}`,
      message: '鸿蒙双层图标生成完成，点击链接下载文件',
    })
  } catch (error) {
    console.error('处理鸿蒙双层图标失败:', error)
    res.status(500).json({ error: '处理图标失败: ' + error.message })
  }
})

// 下载图标文件的API
app.get('/api/download-icon', async (req, res) => {
  try {
    const fileName = req.query.file
    if (!fileName) {
      return res.status(400).json({ error: '文件名不能为空' })
    }

    // 安全检查：防止路径遍历攻击
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ error: '无效的文件名' })
    }

    const outputDir = path.join(process.cwd(), 'output')
    const filePath = path.join(outputDir, fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' })
    }

    // 设置响应头，使浏览器下载文件
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', fs.statSync(filePath).size)

    // 发送文件
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    // 发送完成后删除临时文件
    fileStream.on('end', () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        } catch (err) {
          console.error('清理临时文件失败:', err)
        }
      }, 1000)
    })
  } catch (error) {
    console.error('下载图标文件失败:', error)
    res.status(500).json({ error: '下载文件失败: ' + error.message })
  }
})

// 测试路由
app.get('/test', (req, res) => {
  res.send('服务器运行正常')
})

// 提供 dist 目录中的静态文件
app.use(express.static(path.join(process.cwd(), 'dist')))

// 对于所有其他路由，返回 index.html，支持 SPA 应用
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'))
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`代理服务运行在 http://localhost:${PORT}`)
})
