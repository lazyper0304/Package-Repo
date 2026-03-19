import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import AppController from './routes/app.js'
import ExcelController, { uploadExcel, uploadHarmony } from './routes/excel.js'
import UtilController from './routes/util.js'
import TokenUtil from './utils/token.js'
import { initialize } from './init.js'
import AppTypeController from './routes/appType.js'

// 配置静态文件服务
const app = express()

app.use(cors())

app.use(express.json())

// 创建上传目录
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// 初始化获取token
TokenUtil.getToken()

// 执行初始化
initialize()

// Excel文件上传和处理路由
app.post('/api/excel/upload', uploadExcel.single('file'), ExcelController.upload)

// 搜索应用数据
app.get('/api/app/search', AppController.appSearch)

// 新增应用的API
app.post('/api/app', AppController.addApp)

app.put('/api/app', AppController.editApp)

// 删除应用
app.delete('/api/app', AppController.deleteApp)

// 苹果应用商店图标获取API
app.get('/api/app/apple-store-icon', AppController.getIconFromAppleStore)

app.get('/api/app-types/list', AppTypeController.typeList)

app.post('/api/app-types', AppTypeController.addAppType)

app.put('/api/app-types', AppTypeController.updateAppType)

app.delete('/api/app-types', AppTypeController.deleteAppType)

// 鸿蒙双层图标处理API - 生成两个版本的图标并返回下载链接
app.post('/api/excel/harmony-icon', uploadHarmony.single('file'), ExcelController.harmonyIcon)

// 下载图标文件的API
app.get('/api/util/download-icon', UtilController.downloadIcon)

// 测试路由
app.get('/test', (req, res) => {
  res.send('服务器运行正常')
})

// 提供 dist 目录中的静态文件
app.use(express.static(path.join(process.cwd(), 'dist')))

const PORT = 3001

app.listen(PORT, () => {
  console.log(`代理服务运行在 http://localhost:${PORT}`)
})
