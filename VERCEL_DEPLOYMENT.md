# 在 Vercel 上部署指南

## 问题说明
这个项目使用了AI生成例句功能，需要一个后端服务器来处理API调用。之前在本地是用 Express 服务器，但 Vercel 等前端托管平台无法运行完整的 Express 服务器。

## 解决方案
已为 Vercel 创建了 **API Routes**，可以处理所有 AI 相关的API请求。

## 部署步骤

### 1. 在 Vercel 上连接你的 GitHub 仓库
- 访问 https://vercel.com
- 点击 "Add New..." → "Project"
- 导入你的 GitHub 仓库 (huyaxin1217/NEW-APP)
- 选择 "Import" 并信任 Vercel

### 2. 配置环境变量
部署前，**必须**在 Vercel 项目设置中配置以下环境变量：

#### 选项A: 使用 Google Gemini API（推荐）
1. 在 Vercel Dashboard 中打开你的项目
2. 进入 Settings → Environment Variables
3. 添加以下变量：
   ```
   GEMINI_API_KEY = 你的Gemini API密钥
   ```
4. 获取 Gemini API Key:
   - 访问 https://ai.google.dev/
   - 点击 "Get API Key"
   - 复制你的 API Key

#### 选项B: 使用 DeepSeek API（可选）
如果你有 DeepSeek API Key，也可以在环境变量中添加：
```
DEEPSEEK_API_KEY = 你的DeepSeek API密钥
```
系统会优先使用 DeepSeek，如果失败则自动回退到 Gemini。

### 3. 部署
1. 在 Vercel Dashboard 中，配置完环境变量后点击 "Deploy"
2. 部署完成后，你会获得一个生产 URL（例如：https://new-app-xxx.vercel.app）

### 4. 验证部署
部署完成后：
1. 打开生产 URL
2. 登录你的账户
3. 进入"背单词"页面
4. 点击"生成AI例句"或其他 AI 功能
5. 如果现在能成功生成例句，则部署成功！

## 常见问题

### Q: "API错误"或"无法连接到后端"
**A:** 检查环境变量配置：
- 确保 `GEMINI_API_KEY` 或 `DEEPSEEK_API_KEY` 已在 Vercel 设置中配置
- 部署后需要**重新部署**一次环境变量才能生效
- 检查 API Key 是否正确（是否有复制空格）

### Q: 如何查看 API 错误日志？
**A:** 在 Vercel Dashboard：
1. 打开你的项目
2. 进入 "Deployments"
3. 选择最新的部署
4. 点击 "Functions" 标签查看 API 日志
5. 或在 "Runtime Logs" 中查看实时日志

### Q: 能否同时使用多个 AI 服务？
**A:** 可以！系统优先级如下：
1. 优先使用 DeepSeek API（如果已配置且有效）
2. 回退到 Gemini API（如果已配置且有效）
3. 回退到公开的字典 API（无需 API Key，但功能有限）

### Q: 为什么我的本地开发环境不同步？
**A:** 如果使用 `npm run dev` 本地测试：
1. 确保本地 `.env` 文件中也配置了 `GEMINI_API_KEY` 或 `DEEPSEEK_API_KEY`
2. 重启开发服务器使环境变量生效

## 文件说明

- **api/** - Vercel API Routes 目录
  - `generate-example.ts` - 生成单个例句的 API
  - `lookup-words.ts` - 批量查词的 API
- **vercel.json** - Vercel 构建配置
- **package.json** - 已更新 build 脚本，只构建前端资源

## 本地测试（可选）

如果想在部署前本地测试 API 路由，可以使用 Vercel CLI：
```bash
npm install -g vercel
vercel dev
```

这会在本地模拟 Vercel 环境运行你的 API Routes。

## 支持

如果部署过程中遇到问题，可以：
1. 查看 Vercel 文档：https://vercel.com/docs
2. 检查 API Route 日志：https://vercel.com/docs/functions/runtime-logs
3. 确认 API Key 有效性：在各自的 AI 服务官网测试

---

恭喜！现在你的应用已可以在 Vercel 上正常运行 AI 功能了！🎉
