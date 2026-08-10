import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // ✅ همان مقصدی که apiConfig.ts هم برای VITE_API_URL پیش‌فرض می‌گیرد —
  // اینجا برای پروکسی dev server هم استفاده می‌شود، تا تنها یک جا برای
  // تغییرش لازم باشد.
  const backendTarget = env.VITE_API_URL || "http://127.0.0.1:8000";

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // ✅ چرا این پروکسی لازم است:
    // localhost و 127.0.0.1 برای مرورگر دو host کاملاً جدا هستند (نه فقط
    // origin متفاوت — کوکی‌هایی که 127.0.0.1 می‌سازد اصلاً برای
    // document.cookie روی localhost دیده نمی‌شوند، چون domain کوکی هر دو
    // فرق دارد). بدون این پروکسی، اگر کسی به‌جای همان hostی که Vite رویش
    // bind شده (127.0.0.1) از localhost:5173 وارد سایت شود — که پیش‌فرض
    // خیلی از مرورگرها/بوکمارک‌هاست — کوکی XSRF-TOKEN و laravel-session
    // هیچ‌وقت به بک‌اند برنمی‌گردند و هر POST با ۴۱۹ رد می‌شود، مهم نیست
    // چطور در کد جاوااسکریپت کوکی خوانده شود.
    // با این پروکسی، فرانت‌اند و بک‌اند از دید مرورگر واقعاً هم‌مبدأ‌اند —
    // درخواست‌ها به /api و /sanctum از همان origin صفحه (هرچی که باشد،
    // localhost یا 127.0.0.1) به سرور Vite می‌روند و از آنجا (سمت سرور،
    // نه مرورگر) به بک‌اند واقعی فوروارد می‌شوند.
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/sanctum": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/storage": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
        target: 'esnext', // ✅ این خط را برای خروجی مدرن‌تر و سبک‌تر اضافه کنی
    // کاهش هشدار حجم chunk
    chunkSizeWarningLimit: 600,
    
    // تنظیمات Rollup برای Code Splitting
    rollupOptions: {
      output: {
        // الگوی نام‌گذاری فایل‌ها
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // تقسیم دستی dependencies به chunk های جداگانه
        manualChunks: {
          // React Core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // State Management
          'vendor-state': ['zustand', '@tanstack/react-query'],
          
          // UI Libraries
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'swiper'],
          
          // Forms
          'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
          
          // Utils
          'vendor-utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    
    // بهینه‌سازی CSS
    cssCodeSplit: true,
    
    // Minification
    minify: 'esbuild',
    
    // Source maps فقط در development
    sourcemap: false,
  },
  };
});