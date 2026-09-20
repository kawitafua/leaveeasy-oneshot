// ─────────────────────────────────────────────────────────────
// scripts/seed.js — ใส่ข้อมูลตัวอย่าง (seed) ลง Firestore ตามหัวข้อ 7 ของ leaveeasy-spec.md
//
// รันด้วยคำสั่ง: npm run seed   (หรือ node scripts/seed.js)
//
// ⚠️ Idempotent: ใช้ setDoc ทับ doc id ที่กำหนดไว้แน่นอนเสมอ (u001, lt001, lr001, ap001 ...)
//    รันซ้ำกี่ครั้งก็ได้ ไม่สร้างข้อมูลซ้ำซ้อน
//
// ⚠️ สคริปต์นี้ใช้ Firebase Web SDK (modular) เขียนข้อมูลแบบไม่ล็อกอิน
//    จึงต้องรันตอนที่ firestore.rules ยังเปิดให้เขียนได้ก่อน (ดูขั้นตอนใน CLAUDE.md)
//    หลังใส่ข้อมูลเสร็จแล้ว ต้อง deploy firestore.rules ตัวจริง (ต้องล็อกอินก่อน) ทับอีกที
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvDKCZbEZ_PFPgBTbKzgmYMQQct6Z4V50",
  authDomain: "leaveeasy-oneshot-kawitafua.firebaseapp.com",
  projectId: "leaveeasy-oneshot-kawitafua",
  storageBucket: "leaveeasy-oneshot-kawitafua.firebasestorage.app",
  messagingSenderId: "280866755588",
  appId: "1:280866755588:web:6db18f2ec964629d239151"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── 7.1 ผู้ใช้ 3 คน — โฟลเดอร์ users ──
const users = {
  u001: { name: "สมชาย ใจดี",   email: "somchai@example.com", role: "employee" },
  u002: { name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" },
  u003: { name: "สมศรี ตั้งใจ",  email: "somsri@example.com",  role: "hr" }
};

// ── 7.2 ประเภทการลา 3 แบบ — โฟลเดอร์ leaveTypes ──
const leaveTypes = {
  lt001: { name: "ลาพักร้อน" },
  lt002: { name: "ลาป่วย" },
  lt003: { name: "ลากิจ" }
};

// ── 7.3 ใบขอลา 5 ใบ — โฟลเดอร์ leaveRequests ──
const leaveRequests = {
  lr001: {
    title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
    reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-09-07", endDate: "2026-09-09",
    createdAt: "2026-09-01 09:15"
  },
  lr002: {
    title: "ลาป่วยไข้หวัดใหญ่",
    reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
    status: "อนุมัติ",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-08-24", endDate: "2026-08-25",
    createdAt: "2026-08-24 08:05"
  },
  lr003: {
    title: "ลากิจไปทำบัตรประชาชน",
    reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
    status: "รอพิจารณา",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "",      approverName: "",
    leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
    startDate: "2026-09-15", endDate: "2026-09-15",
    createdAt: "2026-09-10 16:30"
  },
  lr004: {
    title: "ลาพักร้อนช่วงวันหยุดยาว",
    reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
    status: "ไม่อนุมัติ",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-10-12", endDate: "2026-10-16",
    createdAt: "2026-09-20 11:00"
  },
  lr005: {
    title: "ลาป่วยไปพบแพทย์ตามนัด",
    reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-09-22", endDate: "2026-09-22",
    createdAt: "2026-09-18 14:45"
  }
};

// ── 7.4 ความเห็นการอนุมัติ — โฟลเดอร์ย่อย leaveRequests/{id}/approvals ──
// lr003 และ lr005 ตั้งใจไม่มีความเห็น (ยังไม่มีใครพิจารณา)
const approvals = {
  lr001: [
    { id: "ap001", authorId: "u002", authorName: "สมหญิง รักงาน",
      message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ",
      createdAt: "2026-09-01 13:40" },
    { id: "ap002", authorId: "u003", authorName: "สมศรี ตั้งใจ",
      message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล",
      createdAt: "2026-09-02 10:05" }
  ],
  lr002: [
    { id: "ap003", authorId: "u002", authorName: "สมหญิง รักงาน",
      message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้",
      createdAt: "2026-08-24 09:20" }
  ],
  lr004: [
    { id: "ap004", authorId: "u002", authorName: "สมหญิง รักงาน",
      message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ",
      createdAt: "2026-09-20 15:10" }
  ]
};

async function main() {
  console.log("🌱 กำลังใส่ข้อมูลตัวอย่างลง Firestore project: " + firebaseConfig.projectId);

  for (const [id, data] of Object.entries(users)) {
    await setDoc(doc(db, "users", id), data);
    console.log("  users/" + id + " ✔");
  }

  for (const [id, data] of Object.entries(leaveTypes)) {
    await setDoc(doc(db, "leaveTypes", id), data);
    console.log("  leaveTypes/" + id + " ✔");
  }

  for (const [id, data] of Object.entries(leaveRequests)) {
    await setDoc(doc(db, "leaveRequests", id), data);
    console.log("  leaveRequests/" + id + " ✔");
  }

  for (const [requestId, list] of Object.entries(approvals)) {
    for (const { id, ...rest } of list) {
      await setDoc(doc(db, "leaveRequests", requestId, "approvals", id), rest);
      console.log("  leaveRequests/" + requestId + "/approvals/" + id + " ✔");
    }
  }

  console.log("✅ ใส่ข้อมูลตัวอย่างเสร็จแล้ว");
  process.exit(0);
}

main().catch(function (err) {
  console.error("❌ ใส่ข้อมูลไม่สำเร็จ:", err);
  process.exit(1);
});
