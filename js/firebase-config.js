// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าการเชื่อมต่อ Firebase (ใช้ร่วมทุกหน้า)
//
// ค่า apiKey ด้านล่างเป็นค่าตั้งค่าฝั่งเว็บของ Firebase (ไม่ใช่รหัสลับ)
// เอาไว้บอกเบราว์เซอร์ว่า "จะคุยกับโปรเจกต์ Firebase ไหน" เท่านั้น
// commit ขึ้น GitHub ได้ตามปกติ — ของจริงที่ต้องกันคือ Security Rules ต่างหาก
//
// ไฟล์นี้ต้องโหลด "หลัง" สคริปต์ Firebase SDK (compat) และ "ก่อน" ไฟล์อื่นทุกไฟล์
// เพราะไฟล์อื่นจะเรียกใช้ตัวแปร db / auth ที่สร้างไว้ที่นี่
// ─────────────────────────────────────────────────────────────

var firebaseConfig = {
  apiKey: "AIzaSyAvDKCZbEZ_PFPgBTbKzgmYMQQct6Z4V50",
  authDomain: "leaveeasy-oneshot-kawitafua.firebaseapp.com",
  projectId: "leaveeasy-oneshot-kawitafua",
  storageBucket: "leaveeasy-oneshot-kawitafua.firebasestorage.app",
  messagingSenderId: "280866755588",
  appId: "1:280866755588:web:6db18f2ec964629d239151"
};

firebase.initializeApp(firebaseConfig);

// ตัวแปรกลางที่ทุกไฟล์ .js อื่นเรียกใช้ได้ทันที (ประกาศแบบ var บนสุดของสคริปต์ธรรมดา
// จะกลายเป็นตัวแปรระดับ window โดยอัตโนมัติ)
var db = firebase.firestore();
var auth = firebase.auth();

// ── ตัวช่วย: หน้าไหนต้องล็อกอินก่อนถึงจะใช้ได้ ให้เรียกฟังก์ชันนี้ครอบ ──
// วิธีใช้:
//   ต้องล็อกอินก่อน(function (user) {
//     // เขียนโค้ดของหน้านั้นในนี้ ใช้ user.uid ได้เลย
//   });
// ถ้ายังไม่ล็อกอิน จะพาไปหน้า login.html ให้อัตโนมัติ
function ต้องล็อกอินก่อน(เมื่อพร้อม) {
  auth.onAuthStateChanged(function (user) {
    if (!user) {
      location.href = "login.html";
      return;
    }
    เมื่อพร้อม(user);
  });
}

// ── ตัวช่วย: แปลรหัส error ของ Firebase Auth เป็นข้อความไทยอ่านง่าย ──
function ข้อความErrorล็อกอิน(err) {
  var รหัส = err && err.code ? err.code : "";
  switch (รหัส) {
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "ระบบยังไม่เปิดใช้งานการสมัคร/ล็อกอินด้วยอีเมล — ผู้ดูแลระบบต้องเข้า Firebase Console แล้วเปิด Email/Password ก่อน";
    case "auth/email-already-in-use":
      return "อีเมลนี้สมัครไว้แล้ว ลองล็อกอินแทน";
    case "auth/invalid-email":
      return "รูปแบบอีเมลไม่ถูกต้อง";
    case "auth/weak-password":
      return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/too-many-requests":
      return "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
    default:
      return "เกิดข้อผิดพลาด: " + (err && err.message ? err.message : "ไม่ทราบสาเหตุ");
  }
}
