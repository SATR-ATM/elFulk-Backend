<p align="center">
  <img src="https://github.com/SATR-ATM/.github/blob/main/assets/banner.png?raw=true" alt="SafeHome Banner" width="100%" />
</p>

<div align="center">
  <h1>SafeHome Backend (elFulk-Backend)</h1>
  <p><b>المنزل الآمن - الجزء الخلفي<b> (Backend)</p>
</div>

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

* `UsersModule` — إنشاء وجلب المستخدمين
* `ParentModule` — كيان الأبوين مع حقول المصادقة
* `AdminModule` — كيان المدير مع الأدوار والصلاحيات
* `ChildModule` — كيان الأبناء مرتبط بالأب
* `AccessPolicyModule` — سياسات الاستخدام لكل طفل (CRUD كامل)
* `AuthModule` — تسجيل الدخول بالبريد وكلمة المرور، إصدار JWT، نقطة `/auth/me` محمية

🚧 قيد التنفيذ:

- توسيع نماذج قاعدة البيانات (Entities)
- إضافة العلاقات بين الجداول
- تقسيم الدومين إلى Modules إضافية
- بقية الفريق سيكمل الوحدات المتبقية تمهيدًا لبناء نظام المصادقة (Auth)

⏳ مخطط لاحقًا:

- نظام المصادقة (Auth)
- واجهات API لباقي الدومينات
- الإشعارات وإدارة المحتوى

* نظام OTP
* تدوير Refresh Tokens
* تسجيل الدخول عبر Google OAuth
* النشر (Deployment)

## ما هو موجود فعليًا الآن


| Module               | Endpoints                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UsersModule`        | `POST /Users` — `GET /Users`                                                                                                                                         |
| `ParentModule`       | `POST /parents` — `GET /parents` — `GET /parents/:id` — `PATCH /parents/:id` — `DELETE /parents/:id`                                                              |
| `AdminModule`        | `POST /admins` — `GET /admins` — `GET /admins/:id` — `PATCH /admins/:id` — `PATCH /admins/:id/role-status` — `PATCH /admins/:id/approve` — `DELETE /admins/:id` |
| `ChildModule`        | `POST /children` — `GET /children` — `GET /children/:id` — `PATCH /children/:id` — `DELETE /children/:id`                                                         |
| `AccessPolicyModule` | `POST /access-policies` — `GET /access-policies` — `GET /access-policies/:id` — `PATCH /access-policies/:id` — `DELETE /access-policies/:id`                      |
| `AuthModule`         | `POST /auth/login` — `GET /auth/me` — `POST /auth/activate-pin`                                                                                                   |

## المتطلبات

- Node.js **20+** (مطابق لصورة Docker الحالية)
- npm
- PostgreSQL 16+ (أو استخدام Docker Compose)

## التشغيل محليًا

1. تثبيت الاعتمادات:

```bash npm install
```2. إعداد متغيرات البيئة:

```bashcp .env.example .env
```ثم عدّل القيم داخل `.env` مثل:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `TYPEORM_SYNC`
- `JWT_SECRET`

3. إنشاء قاعدة البيانات (مثال):

```sqlCREATE DATABASE parental_control_db;
```4. تشغيل المشروع:

```bashnpm run start:dev
```الخادم يعمل افتراضيًا على:
`http://localhost:3000`

## التشغيل عبر Docker

من داخل مجلد المشروع:

```bashdocker compose -f docker/docker-compose.yml up --build
```الخدمات الحالية:

- `api`: تطبيق NestJS على المنفذ `3000`
- `db`: PostgreSQL 16

ملف البيئة الخاص بـ Docker:

- `docker/.env.docker`

## الأوامر المهمة

```bash#npm#npm run start
npm run start:dev
npm run start:prod

# الفحص والجودة
npm run lint
npm run format

# الاختبارات
npm run test
npm run test:e2e
npm run test:cov
```## هيكلة المشروع الحالية

```textsrc/
├── app.module.ts
├── main.ts
└── modules/
    ├── access-policy/
    │   ├── dto/
    │   ├── access-policy.controller.ts
    │   ├── access-policy.entity.ts
    │   ├── access-policy.module.ts
    │   └── access-policy.service.ts
    ├── admin/
    │   ├── dto/
    │   ├── admin.controller.ts
    │   ├── admin.entity.ts
    │   ├── admin.module.ts
    │   └── admin.service.ts
    ├── auth/
    │   ├── dto/
    │   ├── guards/
    │   ├── strategies/
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   └── auth.service.ts
    ├── child/
    │   ├── dto/
    │   ├── child.controller.ts
    │   ├── child.entity.ts
    │   ├── child.module.ts
    │   └── child.service.ts
    ├── parent/
    │   ├── dto/
    │   ├── parent.entity.ts
    │   ├── parent.module.ts
    │   └── parent.service.ts
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
```## خارطة الدومين المستهدفة

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

```bashnpm install --force
npm install --legacy-peer-deps
```لأنها قد تسبب:

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
