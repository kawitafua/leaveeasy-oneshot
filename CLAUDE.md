# CLAUDE.md — คู่มือสำหรับ AI ที่มาทำงานต่อ

> อ่านไฟล์นี้ก่อน แล้วอ่าน `leaveeasy-spec.md` ทั้งไฟล์ต่อ (ไฟล์นั้นคือใบสั่งงานจริง — ไฟล์นี้แค่บอก "ตอนนี้ระบบอยู่ตรงไหนแล้ว")

## ระบบนี้คืออะไร

LeaveEasy คือเว็บขอลาออนไลน์ ทำด้วย **HTML/CSS/JavaScript ธรรมดา ไม่มี framework ไม่มี build step**
หน้าเว็บคุยกับ **Firestore** และ **Firebase Authentication** ตรง ๆ ผ่าน Firebase Web SDK (compat)
ไม่มีเซิร์ฟเวอร์ของตัวเอง และ deploy ขึ้น **Firebase Hosting**

สถานะปัจจุบัน: **ทำเสร็จถึงสัปดาห์ที่ 7** ตามตารางหัวข้อ 8 ของ `leaveeasy-spec.md`

## โครงไฟล์

```
index.html                    หน้าแรก — รวมลิงก์ไปทุกหน้า
login.html · register.html    หน้าล็อกอิน / สมัครสมาชิก (Firebase Authentication)
leave-requests.html           หน้าที่ 1 รายการใบลา (อ่านแบบเรียลไทม์ด้วย onSnapshot)
new-leave-request.html        หน้าที่ 2 ยื่นใบลาใหม่
leave-request-detail.html     หน้าที่ 3 รายละเอียด + อนุมัติ/ไม่อนุมัติ/ลบ/เขียนความเห็น
leave-types.html              หน้าที่ 4 จัดการประเภทการลา (CRUD)
dashboard.html                หน้าที่ 5 แดชบอร์ดสรุป (โครงจาก prototype ต่อข้อมูลจริงแล้ว)

css/style.css                 หน้าตาของทุกหน้า (ไฟล์เดียว ใช้ร่วมกันหมด)

js/firebase-config.js         ตั้งค่า Firebase + ตัวแปรกลาง db / auth
                               + ฟังก์ชัน ต้องล็อกอินก่อน(callback) ที่ทุกหน้าที่อ่าน Firestore ใช้ครอบโค้ด
                               + ฟังก์ชัน ข้อความErrorล็อกอิน(err) แปล error code ของ Auth เป็นไทย
js/util.js                    ตัวช่วยเล็ก ๆ: esc() ป้ายสถานะ() เวลาตอนนี้() ค่าจากURL()
js/nav.js                     แถบเมนูบนสุด + แสดงสถานะล็อกอิน/ปุ่มออกจากระบบ (ใช้ทุกหน้า)
js/login.js · js/register.js  โค้ดของหน้าล็อกอิน/สมัครสมาชิก
js/<ชื่อหน้า>.js               โค้ดเฉพาะของแต่ละหน้าจอ 5 หน้า

scripts/seed.js                สคริปต์ Node ใส่ข้อมูลตัวอย่างลง Firestore (ดูหัวข้อ "การใส่ seed" ด้านล่าง)

firebase.json · firestore.rules · .firebaserc    ตั้งค่า Firebase Hosting/Firestore
```

⚠️ **สังเกตว่าตัวแปรและ id หลายจุดในโค้ดเป็นภาษาไทย** (เช่น `ต้องล็อกอินก่อน`, `กล่องใบลา`) — เป็นธรรมเนียมที่ตั้งไว้ตั้งแต่ starter kit ของโปรเจกต์นี้ ให้เขียนโค้ดใหม่ตามธรรมเนียมเดิมเพื่อความสม่ำเสมอ ส่วนชื่อไฟล์และชื่อ field ใน Firestore ต้องเป็นอังกฤษตามหัวข้อ 5 ของสเปคเป๊ะ (ตัวพิมพ์เล็ก-ใหญ่มีผล)

## โครงสร้าง Firestore (ดูหัวข้อ 5 ของสเปคสำหรับรายละเอียดเต็ม)

```
users/{uid}            { name, email, role }        ← role: employee | manager | hr
leaveTypes/{id}         { name }
leaveRequests/{id}      { title, reason, status, requesterId, requesterName,
                          approverId, approverName, leaveTypeId, leaveTypeName,
                          startDate, endDate, createdAt }
   └─ approvals/{id}    { authorId, authorName, message, createdAt }
```

- `status` ใช้ได้ 3 ค่าเท่านั้น: `รอพิจารณา` → `อนุมัติ` หรือ `ไม่อนุมัติ` (ปลายทาง เปลี่ยนต่อไม่ได้)
- `createdAt` เก็บเป็น**ข้อความธรรมดา** รูปแบบ `YYYY-MM-DD HH:MM` (ไม่ใช่ Firestore Timestamp) — สร้างด้วย `เวลาตอนนี้()` ใน `js/util.js` เพื่อให้เรียงลำดับด้วย string compare ได้ตรงกับข้อมูล seed
- `requesterId` / `approverId` / `authorId` ของผู้ใช้จริง (ที่สมัครผ่าน `register.html`) จะเป็น **uid ของ Firebase Auth** ส่วนผู้ใช้ seed (`u001` `u002` `u003`) เป็น doc id สมมติที่ไม่ผูกกับบัญชี Auth จริง (ยังไม่มีบัญชีจริงให้ล็อกอินเป็นคนเหล่านี้ได้ จนกว่าจะสมัครสมาชิกด้วยอีเมลเดียวกัน)
- ผู้ขอลาใหม่ที่สมัครผ่านหน้าเว็บจะมี `role: "employee"` เสมอ (ตั้งค่าอัตโนมัติตอนสมัคร)

## Security Rules ตอนนี้ (สัปดาห์ที่ 7)

`firestore.rules` มีกฎขั้นต่ำข้อเดียว: **ต้องล็อกอินก่อน (`request.auth != null`) ถึงอ่าน/เขียนได้** ครอบทุกโฟลเดอร์รวม subcollection `approvals` (ใช้ `match /{document=**}`)

**ยังไม่มี** การแยกสิทธิ์ตามบทบาท หรือตามเจ้าของข้อมูล — ตอนนี้ใครก็ตามที่ล็อกอินแล้ว อ่าน/เขียน/ลบข้อมูลของทุกคนได้หมด (นี่คือขอบเขตของสัปดาห์ที่ 7 ตามสเปคเป๊ะ) งานสัปดาห์ที่ 8 คือ Security Rules รายห้องแบบเต็ม (เช่น ผู้ขอลาเห็นเฉพาะใบของตัวเอง, เปลี่ยน `status` ได้เฉพาะ manager/hr) — **ห้ามทำล่วงหน้า**

## ⚠️ ข้อจำกัดที่ต้องแก้ก่อนใช้งานได้จริง

**Email/Password sign-in provider ของ Firebase Authentication ยังไม่ได้เปิดใช้งาน** — ลองเปิดผ่าน REST API และผ่าน `firebase-tools` แล้วไม่มีคำสั่งที่ทำได้ (ดูเหมือน Google บังคับให้เปิดครั้งแรกผ่านหน้าเว็บ Console เท่านั้น)

**ต้องทำก่อนสมัคร/ล็อกอินได้จริง:**
1. เข้า https://console.firebase.google.com/project/leaveeasy-oneshot-kawitafua/authentication/providers
2. กด **Get started** (ถ้ายังไม่เคยเปิด Authentication) แล้วเปิดใช้ **Email/Password**

โค้ด Auth ทั้งหมดเขียนไว้ครบแล้ว รอแค่ provider เปิดใช้งาน ถ้ายังไม่เปิด ผู้ใช้จะเห็นข้อความ "ระบบยังไม่เปิดใช้งานการสมัคร/ล็อกอินด้วยอีเมล" (จาก `ข้อความErrorล็อกอิน()` ที่ดักรหัส error `auth/operation-not-allowed` ไว้)

## การใส่ seed data (`scripts/seed.js`)

สคริปต์นี้ใช้ Firebase Web SDK (modular) เขียนตรงไปที่ Firestore แบบไม่ล็อกอิน (เขียนทับด้วย doc id คงที่เสมอ = idempotent รันซ้ำได้) เพราะงั้น**ต้องรันตอนที่กฎยังเปิดให้เขียนได้ก่อน**:

```bash
# 1) เปิดกฎชั่วคราวให้เขียนได้โดยไม่ต้องล็อกอิน (แก้ firestore.rules ให้เป็น allow read, write: if true;)
npx firebase-tools deploy --only firestore:rules

# 2) รัน seed
npm install
npm run seed

# 3) เปลี่ยน firestore.rules กลับเป็นกฎจริง (if request.auth != null;) แล้ว deploy อีกที
npx firebase-tools deploy --only firestore:rules
```

ถ้าต้องเพิ่ม/แก้ข้อมูลตัวอย่างในอนาคต แก้ที่ `scripts/seed.js` แล้วรันคำสั่งเดิมซ้ำได้เลย ไม่ต้องลบของเก่าก่อน

## คำสั่งที่ใช้บ่อย

```bash
npm run dev                                  # เปิดเว็บดูในเครื่อง (http://localhost:3000)
npx --yes firebase-tools deploy --only hosting          # deploy หน้าเว็บขึ้น Firebase Hosting
npx --yes firebase-tools deploy --only firestore:rules  # deploy security rules
```

> เครื่องนี้ไม่ได้ติดตั้ง `firebase` CLI แบบ global ให้ใช้ `npx --yes firebase-tools <command>` แทนเสมอ

## กติกาเดิมที่ยังต้องยึดไว้

- ห้ามใช้ framework ห้ามเขียนเซิร์ฟเวอร์เอง (อ่านหัวข้อ 0.2 ของสเปค)
- ห้ามทำงานของสัปดาห์ถัดไปล่วงหน้า (ดูตารางหัวข้อ 8) — ตอนนี้คือ**ห้ามแตะ**: Security Rules รายห้อง, ปุ่ม AI จัดประเภทการลา, การแนบเอกสาร, การทดสอบอัตโนมัติ
- ชื่อ field ใน Firestore ตัวพิมพ์เล็ก-ใหญ่ต้องตรงเป๊ะกับหัวข้อ 5 ของสเปค
- ห้ามใส่ข้อมูลจริงของบุคคลใด ๆ ลง seed หรือโค้ดตัวอย่าง
