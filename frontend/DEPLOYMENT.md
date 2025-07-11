# Vercel 部署与环境变量设置指南

## 快速部署步骤

### 1. 获取 Render 后端 URL

1. 登录到 [Render Dashboard](https://dashboard.render.com/)
2. 找到你的后端服务
3. 复制服务的 URL（格式类似：`https://your-backend-app-name.onrender.com`）

### 2. 在 Vercel 中设置环境变量

#### 方法一：通过 Vercel Dashboard（推荐）

1. 登录到 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的前端项目
3. 点击 "Settings" 标签
4. 点击左侧 "Environment Variables"
5. 点击 "Add New" 按钮
6. 填写环境变量：
   - **Name**: `BACKEND_URL`
   - **Value**: `https://your-backend-app-name.onrender.com`（替换为你的实际 URL）
   - **Environments**: 勾选 `Production`, `Preview`, 和 `Development`
7. 点击 "Save"

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 添加环境变量
vercel env add BACKEND_URL
# 然后输入你的后端 URL
```

### 3. 重新部署

- **自动部署**：推送代码到 GitHub，Vercel 会自动重新部署
- **手动部署**：在 Vercel Dashboard 中点击 "Redeploy"

## 本地开发

### 设置本地环境

```bash
# 进入前端目录
cd LinkedIn-like-social-platform/frontend

# 安装依赖
npm install

# 构建配置（可选）
npm run build

# 启动本地服务器
npm start
```

### 本地环境变量

创建 `.env.local` 文件（仅用于本地测试）：

```
BACKEND_URL=http://localhost:5005
```

## 配置验证

### 在浏览器中验证

部署后，打开浏览器控制台（F12），你应该看到：

```
🔧 Backend URL: https://your-backend-app-name.onrender.com
🌍 Current hostname: your-app.vercel.app
⏰ Config built at: 2025-07-11T04:12:04.393Z
```

### 测试 API 连接

1. 在浏览器控制台中运行：

```javascript
fetch(window.BACKEND_URL || "your-backend-url")
  .then((response) => console.log("Backend connection:", response.status))
  .catch((error) => console.error("Backend error:", error));
```

## 故障排除

### 常见问题

#### 1. CORS 错误

确保后端已配置 CORS：

```javascript
// 后端代码示例
app.use(
  cors({
    origin: ["https://your-frontend-app.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);
```

#### 2. 环境变量未生效

- 检查 Vercel Dashboard 中的环境变量设置
- 确认环境变量名称为 `BACKEND_URL`
- 重新部署项目

#### 3. 本地开发连接问题

- 确保后端在 localhost:5005 运行
- 检查防火墙设置

### 调试技巧

1. **查看构建日志**：

   - 在 Vercel Dashboard 中查看 "Functions" 标签
   - 检查构建输出中的配置信息

2. **控制台调试**：
   ```javascript
   // 查看当前配置
   console.log("Current BACKEND_URL:", BACKEND_URL);
   ```

## 高级配置

### 多环境部署

可以为不同分支设置不同的后端 URL：

- **Production** (main 分支): `https://prod-backend.onrender.com`
- **Preview** (develop 分支): `https://dev-backend.onrender.com`
- **Development**: `http://localhost:5005`

### 自定义域名

如果使用自定义域名，更新 `config.js` 中的域名检测逻辑：

```javascript
if (hostname.includes("your-custom-domain.com")) {
  return "https://your-backend-app-name.onrender.com";
}
```

## 文件结构

```
frontend/
├── scripts/
│   └── build-config.js     # 构建时配置生成脚本
├── src/
│   ├── config.js          # 自动生成的配置文件
│   └── main.js            # 主应用文件
├── package.json           # NPM 配置
├── vercel.json           # Vercel 部署配置
└── DEPLOYMENT.md         # 本文档
```
