import { pool } from '../db.js'
import multer from 'multer'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

// 配置Excel文件上传
export const uploadExcel = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 限制文件大小为10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/json'
    ) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传Excel或者Json文件'), false)
    }
  },
})

// 配置鸿蒙图标文件上传
export const uploadHarmony = multer({
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

export default class ExcelController {
  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' })
      }

      const filePath = req.file.path
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase()

      let data = []

      // 根据文件类型解析数据
      if (fileExtension === 'json') {
        // 解析JSON文件
        const jsonContent = fs.readFileSync(filePath, 'utf8')
        const jsonData = JSON.parse(jsonContent)

        // 如果是数组，直接使用；如果是对象，转换为数组
        if (Array.isArray(jsonData)) {
          data = jsonData
        } else if (typeof jsonData === 'object' && jsonData !== null) {
          data = [jsonData]
        }

        // 清理临时文件
        fs.unlinkSync(filePath)
      } else {
        // 解析Excel文件
        const workbook = XLSX.readFile(filePath)
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)

        // 清理临时文件
        fs.unlinkSync(filePath)
      }

      if (data.length === 0) {
        return res.status(400).json({ error: '文件为空或格式不正确' })
      }

      // 验证数据格式
      const validData = []
      for (const row of data) {
        let appName, harmonyPackage, androidPackage, iconUrl

        if (fileExtension === 'json') {
          // JSON格式字段映射
          appName = (row['a'] || row['app_name'] || row['应用名称']).toString()
          harmonyPackage = (row['h'] || row['harmony_package'] || row['harmony包名'] || '').toString()
          androidPackage = (row['k'] || row['android_package'] || row['android包名'] || '').toString()
          // iconUrl = row['i'] || row['icon_url'] || ''
        } else {
          // Excel格式字段映射
          appName = (row['应用名称'] || row['应用名'] || row['name'] || row['app_name']).toString()
          harmonyPackage = (row['鸿蒙包名'] || row['包名'] || row['package'] || row['package_name']).toString()
          androidPackage = (row['安卓包名'] || row['android_package'] || '').toString()
          // iconUrl = row['图标URL'] || row['icon_url'] || ''
        }

        // 验证必填字段：app_name必须存在
        if (appName && appName.trim() !== '') {
          validData.push({
            appName: String(appName).trim(),
            harmonyPackage: harmonyPackage ? String(harmonyPackage).trim() : '',
            androidPackage: androidPackage ? String(androidPackage).trim() : '',
            // iconUrl: iconUrl ? String(iconUrl).trim() : '',
          })
        }
      }

      if (validData.length === 0) {
        return res.status(400).json({ error: '未找到有效的应用数据' })
      }

      // 第一步：Excel内部去重
      const uniqueData = []
      const internalDuplicateSet = new Set()
      let internalDuplicateCount = 0

      for (const app of validData) {
        // 构建唯一标识，处理NULL值
        const uniqueKey = JSON.stringify({
          app_name: app.appName,
          harmony_package: app.harmonyPackage || null,
          android_package: app.androidPackage || null,
        })

        if (internalDuplicateSet.has(uniqueKey)) {
          internalDuplicateCount++
        } else {
          internalDuplicateSet.add(uniqueKey)
          uniqueData.push(app)
        }
      }

      // 第二步：查询数据库中已存在的数据
      const [existingRows] = await pool.execute(`SELECT app_name, harmony_package, android_package FROM apps`)

      // 构建查找表
      const harmonyPackageSet = new Set()
      const appNameSet = new Set()

      existingRows.forEach((row) => {
        if (row.harmony_package) {
          harmonyPackageSet.add(row.harmony_package)
        }
        appNameSet.add(row.app_name)
      })

      // 第三步：插入不存在的数据
      let databaseDuplicateCount = 0
      let successCount = 0
      let errorCount = 0

      for (const app of uniqueData) {
        try {
          let isDuplicate = false

          // 重复判断逻辑：
          // 1. 如果导入数据有 harmony_package，检查数据库中是否有相同 harmony_package
          // 2. 如果导入数据没有 harmony_package，检查数据库中是否有相同 app_name
          if (app.harmonyPackage) {
            // 如果有 harmony_package，优先按 harmony_package 判断
            if (harmonyPackageSet.has(app.harmonyPackage)) {
              isDuplicate = true
              databaseDuplicateCount++
            }
          } else {
            // 如果没有 harmony_package，按 app_name 判断
            if (appNameSet.has(app.appName)) {
              isDuplicate = true
              databaseDuplicateCount++
            }
          }

          if (!isDuplicate) {
            const [result] = await pool.execute(
              'INSERT INTO apps (app_name, harmony_package, android_package, icon_url) VALUES (?, ?, ?, ?)',
              [app.appName, app.harmonyPackage || null, app.androidPackage || null, app.iconUrl || null],
            )

            if (result.affectedRows === 1) {
              successCount++
              // 插入成功后，更新查找表
              if (app.harmonyPackage) {
                harmonyPackageSet.add(app.harmonyPackage)
              }
              appNameSet.add(app.appName)
            }
          }
        } catch (dbError) {
          console.error('插入数据失败:', dbError)
          errorCount++
        }
      }

      // 验证计数是否正确
      const calculatedTotal = successCount + databaseDuplicateCount + internalDuplicateCount + errorCount
      if (calculatedTotal !== validData.length) {
        console.error(`计数错误！计算总数(${calculatedTotal}) != 实际总数(${validData.length})`)
      }

      res.json({
        success: true,
        message: `成功导入 ${successCount} 个应用，与数据库重复 ${databaseDuplicateCount} 个，Excel内部重复 ${internalDuplicateCount} 个，失败 ${errorCount} 个`,
        total: validData.length,
        successCount,
        databaseDuplicateCount,
        duplicateCount: databaseDuplicateCount + internalDuplicateCount,
        internalDuplicateCount,
        errorCount,
      })
    } catch (error) {
      console.error('处理文件失败:', error)
      res.status(500).json({ error: '处理文件失败: ' + error.message })
    }
  }

  static async harmonyIcon(req, res) {
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
        bgUrl: `/api/util/download-icon?file=${encodeURIComponent(`${baseName}_bg.png`)}`,
        fgUrl: `/api/util/download-icon?file=${encodeURIComponent(`${baseName}_fg.png`)}`,
        message: '鸿蒙双层图标生成完成，点击链接下载文件',
      })
    } catch (error) {
      console.error('处理鸿蒙双层图标失败:', error)
      res.status(500).json({ error: '处理图标失败: ' + error.message })
    }
  }
}
