// ─────────────────────────────────────────────────────────────
// scripts/tests/firestore.rules.test.mjs
//
// ทดสอบ firestore.rules (สัปดาห์ที่ 8) ด้วย Firebase Emulator Suite +
// @firebase/rules-unit-testing — จำลองผู้ใช้ 3 บทบาท (employee / manager / hr)
// โดยไม่ต้องพึ่ง Firebase Authentication จริง (provider ยังไม่เปิดใช้งาน)
//
// วิธีรัน:
//   1) เปิด emulator ไว้ก่อนในอีกหน้าต่างหนึ่ง (หรือรันสคริปต์นี้ผ่าน npm script ที่ครอบด้วย firebase emulators:exec)
//      npx --yes firebase-tools emulators:exec --only firestore "node scripts/tests/firestore.rules.test.mjs"
// ─────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection,
} from "firebase/firestore";

const PROJECT_ID = "leaveeasy-rules-test";

let ผ่าน = 0;
let ไม่ผ่าน = 0;
const รายละเอียด = [];

async function เช็ก(ชื่อ, งาน) {
  try {
    await งาน();
    ผ่าน++;
    รายละเอียด.push("PASS  " + ชื่อ);
  } catch (err) {
    ไม่ผ่าน++;
    รายละเอียด.push("FAIL  " + ชื่อ + "  -> " + err.message);
  }
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

  // ── ใส่ข้อมูลตั้งต้น (bypass rules) จำลองผู้ใช้ 3 คนจาก seed หัวข้อ 7 ──
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/u001"), { name: "สมชาย ใจดี", email: "somchai@example.com", role: "employee" });
    await setDoc(doc(db, "users/u002"), { name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" });
    await setDoc(doc(db, "users/u003"), { name: "สมศรี ตั้งใจ", email: "somsri@example.com", role: "hr" });
    // employee คนที่สอง ไว้ทดสอบว่า "ผู้ขอลาคนหนึ่งเปิดใบลาของอีกคนไม่ได้"
    await setDoc(doc(db, "users/u004"), { name: "สมปอง ขยัน", email: "sompong@example.com", role: "employee" });

    await setDoc(doc(db, "leaveTypes/lt001"), { name: "ลาพักร้อน" });

    await setDoc(doc(db, "leaveRequests/lr001"), {
      title: "ลาพักร้อนไปเที่ยวกับครอบครัว", reason: "…", status: "รอพิจารณา",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002", approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-07", endDate: "2026-09-09", createdAt: "2026-09-01 09:15",
    });
    await setDoc(doc(db, "leaveRequests/lr002"), {
      title: "ลาป่วยไข้หวัดใหญ่", reason: "…", status: "อนุมัติ",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002", approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-08-24", endDate: "2026-08-25", createdAt: "2026-08-24 08:05",
    });
    await setDoc(doc(db, "leaveRequests/lr003"), {
      title: "ลากิจไปทำบัตรประชาชน", reason: "…", status: "รอพิจารณา",
      requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
      approverId: "", approverName: "",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-15", endDate: "2026-09-15", createdAt: "2026-09-10 16:30",
    });
  });

  const employee = testEnv.authenticatedContext("u001").firestore();  // เจ้าของ lr001, lr002
  const otherEmployee = testEnv.authenticatedContext("u004").firestore(); // employee อีกคน ไม่มีใบลาเป็นของตัวเอง
  const manager = testEnv.authenticatedContext("u002").firestore();
  const hr = testEnv.authenticatedContext("u003").firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  // =====================================================================
  // 1) users
  // =====================================================================
  await เช็ก("users: ไม่ล็อกอิน อ่านไม่ได้เลย", async () => {
    await assertFails(getDoc(doc(anon, "users/u001")));
  });
  await เช็ก("users: ล็อกอินแล้ว อ่านเอกสารของคนอื่นได้ (ต้องใช้แสดงชื่อ/role)", async () => {
    await assertSucceeds(getDoc(doc(employee, "users/u002")));
  });
  await เช็ก("users: สมัครสมาชิก สร้างเอกสารของตัวเองด้วย role=employee ได้", async () => {
    const newUser = testEnv.authenticatedContext("u005").firestore();
    await assertSucceeds(setDoc(doc(newUser, "users/u005"), { name: "ทดสอบ", email: "test5@example.com", role: "employee" }));
  });
  await เช็ก("users: สมัครสมาชิกแล้วตั้ง role เป็น hr เอง ต้องถูกปฏิเสธ (กันยกระดับสิทธิ์)", async () => {
    const newUser = testEnv.authenticatedContext("u006").firestore();
    await assertFails(setDoc(doc(newUser, "users/u006"), { name: "แอบอ้าง", email: "fake@example.com", role: "hr" }));
  });
  await เช็ก("users: สร้างเอกสารแทนคนอื่นไม่ได้ (uid ไม่ตรง)", async () => {
    await assertFails(setDoc(doc(employee, "users/u999"), { name: "x", email: "x@example.com", role: "employee" }));
  });
  await เช็ก("users: แก้ไขชื่อของตัวเองได้", async () => {
    await assertSucceeds(updateDoc(doc(employee, "users/u001"), { name: "สมชาย ใจดี (แก้ไข)" }));
  });
  await เช็ก("users: แก้ไข role ของตัวเองเป็น hr ไม่ได้ (ป้องกันยกระดับสิทธิ์ตัวเอง)", async () => {
    await assertFails(updateDoc(doc(employee, "users/u001"), { role: "hr" }));
  });
  await เช็ก("users: แก้ไขเอกสารของคนอื่นไม่ได้", async () => {
    await assertFails(updateDoc(doc(employee, "users/u002"), { name: "ยึดบัญชี" }));
  });

  // =====================================================================
  // 2) leaveTypes
  // =====================================================================
  await เช็ก("leaveTypes: ทุกคนที่ login อ่านได้", async () => {
    await assertSucceeds(getDoc(doc(employee, "leaveTypes/lt001")));
  });
  await เช็ก("leaveTypes: ไม่ล็อกอิน อ่านไม่ได้", async () => {
    await assertFails(getDoc(doc(anon, "leaveTypes/lt001")));
  });
  await เช็ก("leaveTypes: employee เพิ่มประเภทการลาไม่ได้", async () => {
    await assertFails(addDoc(collection(employee, "leaveTypes"), { name: "ลาแอบอ้าง" }));
  });
  await เช็ก("leaveTypes: manager เพิ่มประเภทการลาไม่ได้", async () => {
    await assertFails(addDoc(collection(manager, "leaveTypes"), { name: "ลาแอบอ้าง" }));
  });
  await เช็ก("leaveTypes: hr เพิ่มประเภทการลาได้", async () => {
    await assertSucceeds(addDoc(collection(hr, "leaveTypes"), { name: "ลาบวช" }));
  });
  await เช็ก("leaveTypes: hr แก้ไข/ลบ ได้", async () => {
    await assertSucceeds(updateDoc(doc(hr, "leaveTypes/lt001"), { name: "ลาพักร้อน (แก้ไข)" }));
    await assertSucceeds(deleteDoc(doc(hr, "leaveTypes/lt001")));
    // ใส่กลับคืนไว้ให้เทสต์อื่นใช้ต่อ
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "leaveTypes/lt001"), { name: "ลาพักร้อน" });
    });
  });

  // =====================================================================
  // 3) leaveRequests
  // =====================================================================
  await เช็ก("leaveRequests: employee ยื่นใบลาใหม่ของตัวเองได้ (status เริ่มต้น รอพิจารณา)", async () => {
    await assertSucceeds(addDoc(collection(employee, "leaveRequests"), {
      title: "ทดสอบ", reason: "…", status: "รอพิจารณา",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "", approverName: "",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-25", endDate: "2026-09-25", createdAt: "2026-09-20 10:00",
    }));
  });
  await เช็ก("leaveRequests: ยื่นใบลาแทนคนอื่น (requesterId ไม่ตรง auth.uid) ไม่ได้", async () => {
    await assertFails(addDoc(collection(employee, "leaveRequests"), {
      title: "สวมรอย", reason: "…", status: "รอพิจารณา",
      requesterId: "u004", requesterName: "สมปอง ขยัน",
      approverId: "", approverName: "",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-25", endDate: "2026-09-25", createdAt: "2026-09-20 10:00",
    }));
  });
  await เช็ก("leaveRequests: ยื่นใบลาใหม่โดยตั้งสถานะเองเป็นอนุมัติ ไม่ได้ (ต้องเป็นรอพิจารณาเสมอ)", async () => {
    await assertFails(addDoc(collection(employee, "leaveRequests"), {
      title: "โกงสถานะ", reason: "…", status: "อนุมัติ",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "", approverName: "",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-25", endDate: "2026-09-25", createdAt: "2026-09-20 10:00",
    }));
  });
  await เช็ก("leaveRequests: เจ้าของเปิดดูใบลาของตัวเองได้", async () => {
    await assertSucceeds(getDoc(doc(employee, "leaveRequests/lr001")));
  });
  await เช็ก("★ leaveRequests: employee อีกคนเปิดดูใบลาของ u001 ไม่ได้ (หัวใจของ US-08 สัปดาห์ที่ 8)", async () => {
    await assertFails(getDoc(doc(otherEmployee, "leaveRequests/lr001")));
  });
  await เช็ก("leaveRequests: manager เปิดดูใบลาของใครก็ได้ทุกใบ", async () => {
    await assertSucceeds(getDoc(doc(manager, "leaveRequests/lr001")));
    await assertSucceeds(getDoc(doc(manager, "leaveRequests/lr003")));
  });
  await เช็ก("leaveRequests: hr เปิดดูใบลาของใครก็ได้ทุกใบ", async () => {
    await assertSucceeds(getDoc(doc(hr, "leaveRequests/lr001")));
  });
  await เช็ก("leaveRequests: employee เปลี่ยนสถานะใบของตัวเองไม่ได้ (หัวข้อ 6 — เปลี่ยนสถานะได้เฉพาะ manager/hr)", async () => {
    await assertFails(updateDoc(doc(employee, "leaveRequests/lr001"), { status: "อนุมัติ" }));
  });
  await เช็ก("leaveRequests: manager เปลี่ยนสถานะจากรอพิจารณา -> อนุมัติ ได้", async () => {
    await assertSucceeds(updateDoc(doc(manager, "leaveRequests/lr001"), { status: "อนุมัติ" }));
    // คืนค่าเดิมไว้ให้เทสต์อื่นใช้ต่อ
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "leaveRequests/lr001"), { status: "รอพิจารณา" });
    });
  });
  await เช็ก("leaveRequests: manager เปลี่ยนสถานะย้อนกลับจากอนุมัติ -> ไม่อนุมัติ ไม่ได้ (ปลายทางเปลี่ยนต่อไม่ได้)", async () => {
    await assertFails(updateDoc(doc(manager, "leaveRequests/lr002"), { status: "ไม่อนุมัติ" }));
  });
  await เช็ก("leaveRequests: manager แก้ status พร้อมช่องอื่นในคำสั่งเดียว ไม่ได้ (ต้องแก้เฉพาะ status)", async () => {
    await assertFails(updateDoc(doc(manager, "leaveRequests/lr003"), { status: "อนุมัติ", title: "แก้หัวข้อด้วย" }));
  });
  await เช็ก("leaveRequests: manager กำหนดผู้อนุมัติ (approverId/approverName) ไม่ได้ — เป็นสิทธิ์ hr เท่านั้น", async () => {
    await assertFails(updateDoc(doc(manager, "leaveRequests/lr003"), { approverId: "u002", approverName: "สมหญิง รักงาน" }));
  });
  await เช็ก("leaveRequests: hr กำหนดผู้อนุมัติ (approverId/approverName) ได้", async () => {
    await assertSucceeds(updateDoc(doc(hr, "leaveRequests/lr003"), { approverId: "u002", approverName: "สมหญิง รักงาน" }));
  });
  await เช็ก("leaveRequests: เจ้าของลบใบของตัวเองตอนยังรอพิจารณาได้", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "leaveRequests/lr-del-test"), {
        title: "จะลบทิ้ง", reason: "…", status: "รอพิจารณา",
        requesterId: "u001", requesterName: "สมชาย ใจดี",
        approverId: "", approverName: "",
        leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
        startDate: "2026-09-25", endDate: "2026-09-25", createdAt: "2026-09-20 10:00",
      });
    });
    await assertSucceeds(deleteDoc(doc(employee, "leaveRequests/lr-del-test")));
  });
  await เช็ก("leaveRequests: เจ้าของลบใบที่สถานะไม่ใช่รอพิจารณาไม่ได้ (lr002 อนุมัติแล้ว)", async () => {
    await assertFails(deleteDoc(doc(employee, "leaveRequests/lr002")));
  });
  await เช็ก("leaveRequests: manager ลบใบลาของคนอื่นไม่ได้ แม้จะยังรอพิจารณาอยู่", async () => {
    await assertFails(deleteDoc(doc(manager, "leaveRequests/lr003")));
  });

  // =====================================================================
  // 4) leaveRequests/{id}/approvals — subcollection
  // =====================================================================
  await เช็ก("approvals: เจ้าของอ่านความเห็นในใบของตัวเองได้ (แม้เอกสารนั้นจะยังไม่มีจริง ก็ต้องผ่านสิทธิ์อ่าน)", async () => {
    await assertSucceeds(getDoc(doc(employee, "leaveRequests/lr001/approvals/apX")));
  });
  await เช็ก("★ approvals: employee อีกคนอ่านความเห็นในใบของ u001 ไม่ได้", async () => {
    await assertFails(getDoc(doc(otherEmployee, "leaveRequests/lr001/approvals/apX")));
  });
  await เช็ก("approvals: manager/hr อ่านความเห็นในใบของใครก็ได้", async () => {
    await assertSucceeds(getDoc(doc(manager, "leaveRequests/lr001/approvals/apX")));
    await assertSucceeds(getDoc(doc(hr, "leaveRequests/lr001/approvals/apX")));
  });
  await เช็ก("approvals: เจ้าของ (employee) เขียนความเห็นเพิ่มในใบของตัวเองได้ (ตามหัวข้อ 2)", async () => {
    await assertSucceeds(addDoc(collection(employee, "leaveRequests/lr001/approvals"), {
      authorId: "u001", authorName: "สมชาย ใจดี", message: "ขอเลื่อนวันลาได้ไหมครับ", createdAt: "2026-09-20 12:00",
    }));
  });
  await เช็ก("★ approvals: employee อีกคน (ไม่ใช่เจ้าของ ไม่ใช่ manager/hr) เขียนความเห็นในใบของ u001 ไม่ได้", async () => {
    await assertFails(addDoc(collection(otherEmployee, "leaveRequests/lr001/approvals"), {
      authorId: "u004", authorName: "สมปอง ขยัน", message: "แอบมาคอมเมนต์", createdAt: "2026-09-20 12:00",
    }));
  });
  await เช็ก("approvals: manager เขียนความเห็นในใบของคนอื่นได้ (เขียนได้ในทุกใบ)", async () => {
    await assertSucceeds(addDoc(collection(manager, "leaveRequests/lr003/approvals"), {
      authorId: "u002", authorName: "สมหญิง รักงาน", message: "รับเรื่องแล้ว", createdAt: "2026-09-20 12:05",
    }));
  });
  await เช็ก("approvals: hr เขียนความเห็นในใบของคนอื่นได้", async () => {
    await assertSucceeds(addDoc(collection(hr, "leaveRequests/lr003/approvals"), {
      authorId: "u003", authorName: "สมศรี ตั้งใจ", message: "ตรวจแล้ว", createdAt: "2026-09-20 12:10",
    }));
  });
  await เช็ก("approvals: สวมรอยเขียนความเห็นโดยตั้ง authorId เป็นคนอื่น ไม่ได้ (กัน spoof)", async () => {
    await assertFails(addDoc(collection(manager, "leaveRequests/lr003/approvals"), {
      authorId: "u999", authorName: "ปลอมตัว", message: "…", createdAt: "2026-09-20 12:15",
    }));
  });
  await เช็ก("approvals: แก้ไขความเห็นที่ส่งไปแล้ว ไม่ได้ (สเปคไม่ได้ให้สิทธิ์นี้ไว้)", async () => {
    let apId;
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const ref = await addDoc(collection(context.firestore(), "leaveRequests/lr003/approvals"), {
        authorId: "u002", authorName: "สมหญิง รักงาน", message: "ของเดิม", createdAt: "2026-09-20 12:20",
      });
      apId = ref.id;
    });
    await assertFails(updateDoc(doc(manager, "leaveRequests/lr003/approvals/" + apId), { message: "แก้ไขแล้ว" }));
  });

  console.log("\n──────────────────────────────────────");
  รายละเอียด.forEach((บรรทัด) => console.log(บรรทัด));
  console.log("──────────────────────────────────────");
  console.log("ผ่าน " + ผ่าน + " ข้อ / ไม่ผ่าน " + ไม่ผ่าน + " ข้อ / รวม " + (ผ่าน + ไม่ผ่าน) + " ข้อ");

  await testEnv.cleanup();
  process.exit(ไม่ผ่าน > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("รันเทสต์ไม่สำเร็จ:", err);
  process.exit(1);
});
