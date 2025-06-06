# استخدم نسخة Node الحديثة
FROM node:20-alpine

# تحديد مجلد العمل داخل الكونتينر
WORKDIR /app

# نسخ ملفات المشروع
COPY . .

# تثبيت الحزم
RUN npm install

# بناء مشروع NestJS (لو TypeScript)
RUN npm run build

# تحديد البيئة
ENV NODE_ENV=production

# تشغيل التطبيق
CMD ["npm", "run", "start:prod"]
