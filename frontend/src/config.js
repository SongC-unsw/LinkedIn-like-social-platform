// 🌟 动态环境配置 - 支持 Vercel 环境变量
const getBackendURL = () => {
  // 1. 尝试从全局变量获取（Vercel 注入）
  if (typeof window !== "undefined" && window.BACKEND_URL) {
    console.log("🔧 Using injected BACKEND_URL:", window.BACKEND_URL);
    return window.BACKEND_URL;
  }

  // 2. 根据域名判断环境
  const hostname = window.location.hostname;
  console.log("🌍 Current hostname:", hostname);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    console.log("🏠 Local development mode");
    return "http://localhost:5005";
  } else {
    console.log("🚀 Production mode - using default backend");
    // 这里填入你的 Render 后端 URL 作为默认值
    return "https://your-backend-app-name.onrender.com";
  }
};

export const BACKEND_URL = getBackendURL();
export const BACKEND_PORT = 5005; // 保留兼容性

// 调试信息
console.log("🔧 Final Backend URL:", BACKEND_URL);
console.log("🌍 Current hostname:", window.location.hostname);
console.log("⏰ Config loaded at:", new Date().toISOString());
