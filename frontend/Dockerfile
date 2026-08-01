# frontend/Dockerfile
# مرحله ۱: بیلد کردن پروژه React
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# مرحله ۲: سرو کردن فایل‌های استاتیک با Nginx
FROM nginx:alpine
# کپی کردن فایل کانفیگ سفارشی Nginx (در گام ۴ می‌سازیم)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# کپی کردن خروجی بیلد شده از مرحله قبل
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]