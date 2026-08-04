import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcssAnimate from "tailwindcss-animate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss(), tailwindcssAnimate()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  build: {
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
});