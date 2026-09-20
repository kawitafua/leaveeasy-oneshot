// ─────────────────────────────────────────────────────────────
// js/register.js — หน้าสมัครสมาชิก
// สมัครสำเร็จ → สร้างไฟล์ใหม่ในโฟลเดอร์ users พร้อม role เริ่มต้น "employee"
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัคร");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มสมัคร");

  // ⚠️ ป้องกัน race condition: onAuthStateChanged นี้ยิงทันทีที่ createUserWithEmailAndPassword
  // สำเร็จด้วย (นับเป็น auth state เปลี่ยนเหมือนกัน) ซึ่งจะแข่งกับ db.collection("users").doc(uid).set(...)
  // ด้านล่างที่ยังเขียนไม่เสร็จ ถ้าปล่อยให้ redirect ไปก่อน จะตัดคำขอเขียน Firestore ทิ้งกลางทาง
  // ทำให้เอกสาร users/{uid} ไม่ถูกสร้าง — จึงต้องเช็ค flag กำลังสมัครอยู่ ก่อน redirect เสมอ
  var กำลังสมัครอยู่ = false;

  // ล็อกอินอยู่แล้ว (และไม่ได้อยู่ระหว่างขั้นตอนสมัครสมาชิก) → ไม่ต้องมาหน้านี้อีก
  auth.onAuthStateChanged(function (user) {
    if (user && !กำลังสมัครอยู่) location.href = "leave-requests.html";
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    กล่องเตือน.classList.add("hidden");

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    if (!name || !email || !password) {
      เตือน("กรอกชื่อ อีเมล และรหัสผ่านให้ครบก่อน");
      return;
    }

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังสมัครสมาชิก…";
    กำลังสมัครอยู่ = true;

    auth.createUserWithEmailAndPassword(email, password).then(function (credential) {
      var uid = credential.user.uid;
      // ⚠️ ช่อง role ต้องเป็นค่าเริ่มต้น "employee" เสมอ ตามหัวข้อ 5 ของสเปค
      return db.collection("users").doc(uid).set({
        name: name,
        email: email,
        role: "employee"
      });
    }).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      กำลังสมัครอยู่ = false;
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = "สมัครสมาชิก";
      เตือน(ข้อความErrorล็อกอิน(err));
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
