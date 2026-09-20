// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าล็อกอิน
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");

  // ล็อกอินอยู่แล้ว → ไม่ต้องมาหน้านี้อีก พาไปหน้ารายการเลย
  auth.onAuthStateChanged(function (user) {
    if (user) location.href = "leave-requests.html";
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    กล่องเตือน.classList.add("hidden");

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    if (!email || !password) {
      เตือน("กรอกอีเมลและรหัสผ่านให้ครบก่อน");
      return;
    }

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "กำลังเข้าสู่ระบบ…";

    auth.signInWithEmailAndPassword(email, password).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = "เข้าสู่ระบบ";
      เตือน(ข้อความErrorล็อกอิน(err));
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
