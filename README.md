<p align="center">
  <img src="https://github.com/SATR-ATM/.github/blob/main/assets/banner.png?raw=true" alt="SafeHome Banner" width="100%" />
</p>

<div dir="rtl">

# المنزل الآمن — Backend (elFulk-Backend)

## 👈🏻 تعريف بالمستودع

هذا المستودع يحتوي على الجزء الخلفي (Backend) لمشروع **المنزل الآمن**.

يهدف إلى بناء نظام قوي وآمن لإدارة:

- حسابات الآباء والأطفال
- سياسات الرقابة الأبوية
- تتبع الاستخدام
- تسجيل الأنشطة
- الإشعارات
- إدارة المحتوى

تم تطويره باستخدام:

- NestJS
- TypeScript
- PostgreSQL

---

## 🚀 حالة المشروع الحالية

### ✅ مكتمل

- تهيئة المشروع
- إعداد الأدوات (Lint, Tests, Hooks)
- تقسيم النظام إلى Modules
- ربط قاعدة البيانات
- تصميم النماذج (Domain Design)

### 🚧 قيد الإنجاز

- بناء الـ Entities
- ربط العلاقات بين الجداول

### ⏳ مخطط لاحقًا

- نظام المصادقة (Auth)
- بناء الـ API
- النشر (Deployment)

---

### 🎯 التركيز الحالي

> تنفيذ نماذج قاعدة البيانات والعلاقات بينها.

---

## ⚙️ طريقة التشغيل

### 1️⃣ تثبيت المتطلبات

تأكد من توفر:

- Node.js v24+
- PostgreSQL

ثم:

```bash
npm install
```

### 2️⃣ إعداد البيئة

أنشئ ملف `.env`:

```bash
cp .env.example .env
```

وعدّل القيم داخله.

### 3️⃣ إعداد قاعدة البيانات

أنشئ قاعدة بيانات:

```sql
CREATE DATABASE safehome;
```

### 4️⃣ تشغيل المشروع

```bash
# وضع التطوير
npm run start:dev
```

سيعمل السيرفر على:

```
http://localhost:3000
```

---

## 🧱 هيكلة المشروع

<div dir="ltr">

```
src/
 ├── users
 ├── parents
 ├── children
 ├── admins
 ├── access-policy
 ├── sessions
 ├── activity-log
 ├── notifications
 └── content
 │
 └── main.ts
 test/
 dist/
```

</div>

<div dir="rtl">
كل Module يحتوي على:

- Entity
- Service
- Controller
- DTOs

---

## 📌 النماذج الأساسية

- User
- Parent
- Child
- Admin
- AccessPolicy
- Session
- ActivityLog
- Notification
- Content

### العلاقات:

```
Parent → Children
Child → AccessPolicy
Child → Sessions → ActivityLogs
User → Notifications
Admin → Content
```

---

## ⚠️ تنبيه مهم

**يمنع استخدام `--force`**

لا تقم أبدًا بتشغيل:

```bash
npm install --force
npm install --legacy-peer-deps
```

لأنه قد يسبب:

- مشاكل في الاعتمادات
- أخطاء خفية
- أعطال مستقبلية

في حال وجود تعارض → يتم إصلاحه يدويًا.

---

## 🤝 المساهمة

نرحب بكل مساهمة: (تصميم، تطوير، اختبار، توثيق، اقتراحات محتوى…)

ابدأ من هنا:

https://github.com/SATR-ATM/.github/blob/main/CONTRIBUTING.md

---

## 📚 مصادر مفيدة

- [NestJS Documentation](https://docs.nestjs.com)

</div>
