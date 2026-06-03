/**
 * @file fetch-swagger.js
 * @description 用于从指定的 baseURL 路径自动抓取 swagger.json 文件到 swagger 目录
 * @author lijiapeng
 * @created 2026-01-06
 */

const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')

// 读取 configBaseUrl.js 文件
const configPath = path.join(__dirname, '../public/configBaseUrl.js')
const configContent = fs.readFileSync(configPath, 'utf8')

// 使用正则表达式提取 baseURL（排除注释行）
const baseURLMatch = configContent.match(/^\s*[^\/]*baseURL:\s*["']([^"']+)["']/m);
if (!baseURLMatch) {
  console.error('错误: 无法从 configBaseUrl.js 中提取 baseURL')
  process.exit(1)
}

const baseURL = baseURLMatch[1]
const swaggerUrl = `${baseURL}/swagger/v1/swagger.json`
const outputPath = path.join(__dirname, '../swagger/swagger.json')
const swaggerDir = path.dirname(outputPath)

// 如果 swagger 目录不存在，则创建
if (!fs.existsSync(swaggerDir)) {
  try {
    fs.mkdirSync(swaggerDir, { recursive: true })
    console.log(`已创建目录: ${swaggerDir}`)
  } catch (error) {
    console.error(`错误: 无法创建目录 ${swaggerDir}:`, error.message)
    process.exit(1)
  }
}

// 如果文件已存在且为只读，先移除只读属性以便覆盖
if (fs.existsSync(outputPath)) {
  try {
    fs.chmodSync(outputPath, 0o666) // 0o666 = 读写权限，以便覆盖文件
  } catch (error) {
    // 忽略错误，继续执行
  }
}

console.log(`正在从 ${swaggerUrl} 下载 swagger.json...`)

// 根据协议选择 http 或 https
const client = swaggerUrl.startsWith('https://') ? https : http

client
  .get(swaggerUrl, (response) => {
    if (response.statusCode !== 200) {
      console.error(`错误: 下载失败，状态码: ${response.statusCode}`)
      process.exit(1)
    }

    const fileStream = fs.createWriteStream(outputPath)
    response.pipe(fileStream)

    fileStream.on('finish', () => {
      fileStream.close()
      // 设置文件为只读，防止被修改
      try {
        fs.chmodSync(outputPath, 0o444) // 0o444 = 只读权限（所有用户）
        console.log(`成功! swagger.json 已保存到 ${outputPath}，并设置为只读`)
      } catch (chmodError) {
        console.warn(`警告: 无法设置文件为只读: ${chmodError.message}`)
        console.log(`成功! swagger.json 已保存到 ${outputPath}`)
      }
    })
  })
  .on('error', (error) => {
    console.error('下载失败:', error.message)
    process.exit(1)
  })
