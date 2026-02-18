<p align="center">
  <img src="https://github.com/SATR-ATM/.github/blob/main/assets/banner.png?raw=true" alt="SafeHome Banner" width="100%" />
</p>

<div align="center">
  <h1>SafeHome Backend (elFulk-Backend)</h1>
  <p><b>المنزل الآمن - الجزء الخلفي<b> (Backend)</p>
</div>

<div dir="rtl" align="right">

## نظرة عامة

هذا المستودع يحتوي على هيكلة و code لمشروع **المنزل الآمن**.
الهدف هو بناء نظام قوي وآمن لإدارة الرقابة الأبوية، حسابات المستخدمين، وتتبع الأنشطة.

التقنيات المستخدمة حاليًا:

- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Docker Compose

## حالة المشروع

✅ مكتمل:

- تهيئة مشروع NestJS
- إعداد ESLint و Prettier و Husky
- ربط قاعدة البيانات PostgreSQL عبر TypeORM
- بناء أول Module فعلي: `users`
- إنشاء مستخدم تجريبي (Sample User) للتحقق من التدفق الأساسي
- تفعيل التحقق على مستوى التطبيق عبر `ValidationPipe`

🚧 قيد التنفيذ:

- توسيع نماذج قاعدة البيانات (Entities)
- إضافة العلاقات بين الجداول
- تقسيم الدومين إلى Modules إضافية
- بقية الفريق سيكمل الوحدات المتبقية تمهيدًا لبناء نظام المصادقة (Auth)

⏳ مخطط لاحقًا:

- نظام المصادقة (Auth)
- واجهات API لباقي الدومينات
- الإشعارات وإدارة المحتوى
- النشر (Deployment)

## ما هو موجود فعليًا الآن

تم تنفيذ `UsersModule` مع:

- كيان `Users` يحتوي على نوع المستخدم: `parent | child | admin`
- إنشاء مستخدم جديد: `POST /Users`
- جلب المستخدمين: `GET /Users`

> ملاحظة: بقية النماذج المذكورة في الخطة (Parent, Child, AccessPolicy, Sessions, ActivityLog, Notification, Content) ما زالت ضمن مراحل التنفيذ القادمة.

## المتطلبات

- Node.js **20+** (مطابق لصورة Docker الحالية)
- npm
- PostgreSQL 16+ (أو استخدام Docker Compose)

## التشغيل محليًا

1. تثبيت الاعتمادات:

```bash
npm install
```

2. إعداد متغيرات البيئة:

```bash
cp .env.example .env
```

ثم عدّل القيم داخل `.env` مثل:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `TYPEORM_SYNC`
- `JWT_SECRET`

3. إنشاء قاعدة البيانات (مثال):

```sql
CREATE DATABASE parental_control_db;
```

4. تشغيل المشروع:

```bash
npm run start:dev
```

الخادم يعمل افتراضيًا على:
`http://localhost:3000`

## التشغيل عبر Docker

من داخل مجلد المشروع:

```bash
docker compose -f docker/docker-compose.yml up --build
```

الخدمات الحالية:

- `api`: تطبيق NestJS على المنفذ `3000`
- `db`: PostgreSQL 16

ملف البيئة الخاص بـ Docker:

- `docker/.env.docker`

## الأوامر المهمة

```bash
# Build
npm run build

# تشغيل
npm run start
npm run start:dev
npm run start:prod

# الفحص والجودة
npm run lint
npm run format

# الاختبارات
npm run test
npm run test:e2e
npm run test:cov
```

## هيكلة المشروع الحالية

<div dir="ltr" align="left">

```text
src/
├── app.module.ts
├── main.ts
└── modules/
    └── user/
        ├── dto/
        ├── user.controller.ts
        ├── user.entity.ts
        ├── user.module.ts
        └── user.service.ts
docker/
├── docker-compose.yml
├── Dockerfile
└── .env.docker
```

</div>
## خارطة الدومين المستهدفة
النماذج الأساسية المستهدفة في النظام:
- User
- Parent
- Child
- Admin
- AccessPolicy
- Session
- ActivityLog
- Notification
- Content

العلاقات المتوقعة:

- Parent -> Children
- Child -> AccessPolicy
- Child -> Sessions -> ActivityLogs
- User -> Notifications
- Admin -> Content

## تنبيه مهم

يمنع استخدام الأوامر التالية:

```bash
npm install --force
npm install --legacy-peer-deps
```

لأنها قد تسبب:

- مشاكل في الاعتمادات
- أخطاء خفية
- أعطال مستقبلية

عند وجود تعارض، يتم إصلاحه بشكل يدوي وصحيح.

## المساهمة

نرحب بالمساهمة في التطوير، الاختبارات، التوثيق، وتحسين التصميم المعماري.

ابدأ من دليل المساهمة:

- https://github.com/SATR-ATM/.github/blob/main/profile/CONTRIBUTING.md

## مصادر مفيدة

- NestJS Documentation: https://docs.nestjs.com

</div>
