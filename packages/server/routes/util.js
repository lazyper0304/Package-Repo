import fs from 'fs'
import path from 'path'

export default class UtilController {
  static downloadIcon(req, res) {
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
  }
}
