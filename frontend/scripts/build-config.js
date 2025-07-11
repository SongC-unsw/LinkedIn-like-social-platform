const fs = require("fs");
const path = require("path");

// 获取环境变量
const backendUrl =
  process.env.BACKEND_URL || "https://your-backend-app-name.onrender.com";

console.log("🔧 Building with BACKEND_URL:", backendUrl);

// 生成配置文件内容
const configContent = `// 自动生成的配置文件 - 请勿手动编辑
// 构建时间: ${new Date().toISOString()}

// 环境配置 - 运行时检测部署环境
const getBackendUrl = () => {
  // 如果是构建时注入的URL，直接使用
  const buildTimeUrl = '${backendUrl}';
  if (buildTimeUrl && buildTimeUrl !== 'https://your-backend-app-name.onrender.com') {
    return buildTimeUrl;
  }
  
  // 运行时检测逻辑
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // 本地开发环境
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5005';
    }
    
    // 检查是否在 Vercel 部署环境
    if (hostname.includes('vercel.app') || hostname.includes('your-domain.com')) {
      // 替换为你的 Render 后端 URL
      return '${backendUrl}';
    }
  }
  
  // 默认生产环境 URL
  return '${backendUrl}';
};

// 导出配置
export const BACKEND_URL = getBackendUrl();
export const BACKEND_PORT = 5005;

// 调试信息 - 在控制台显示当前配置
console.log('🔧 Backend URL:', BACKEND_URL);
console.log('🌍 Current hostname:', window.location?.hostname || 'unknown');
console.log('⏰ Config built at:', '${new Date().toISOString()}');
`;

// 确保目录存在
const configDir = path.join(__dirname, "..", "src");
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// 写入配置文件
const configPath = path.join(configDir, "config.js");
fs.writeFileSync(configPath, configContent);

console.log("✅ Configuration file generated successfully");
console.log("📍 File location:", configPath);
