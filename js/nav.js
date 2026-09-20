// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// แก้เมนูที่ไฟล์นี้ที่เดียว ทุกหน้าเปลี่ยนตามพร้อมกัน
//
// วิธีใช้: ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
// ต้องโหลดไฟล์นี้ "หลัง" js/firebase-config.js เพื่อให้รู้สถานะล็อกอิน
// ─────────────────────────────────────────────────────────────

(function () {
  var เมนู = [
    { href: "index.html",             ชื่อ: "หน้าแรก" },
    { href: "leave-requests.html",    ชื่อ: "รายการใบลา" },
    { href: "new-leave-request.html", ชื่อ: "ยื่นใบลาใหม่" },
    { href: "leave-types.html",       ชื่อ: "ประเภทการลา" },
    { href: "dashboard.html",         ชื่อ: "แดชบอร์ด" }
  ];

  // ชื่อไฟล์ของหน้าที่กำลังเปิดอยู่ เอาไว้ขีดเส้นใต้เมนูที่ตรงกัน
  var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

  var html = '<div class="navbar"><span class="brand">🔧 LeaveEasy</span>';
  เมนู.forEach(function (m) {
    var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
    // เมนู "ประเภทการลา" ใช้ได้เฉพาะ hr (สเปคหัวข้อ 4 หน้าที่ 4) — ทำเครื่องหมาย data-hr-only ไว้
    // เพื่อให้ซ่อน/แสดงพร้อมกับ element อื่น ๆ ที่จำกัดเฉพาะ hr (เช่นลิงก์เดียวกันในหน้า index.html)
    var hrOnly = m.href === "leave-types.html" ? " data-hr-only" : "";
    html += '<a href="' + m.href + '"' + active + hrOnly + ">" + m.ชื่อ + "</a>";
  });
  // ช่องแสดงชื่อคนที่ล็อกอินอยู่ / ลิงก์เข้าสู่ระบบ (เติมค่าด้านล่าง)
  html += '<span class="nav-user" id="navUser"></span></div>';

  var ที่วาง = document.getElementById("nav");
  if (ที่วาง) ที่วาง.innerHTML = html;

  // ── ซ่อนลิงก์/ปุ่มเฉพาะ hr ไว้ก่อนเป็นค่าเริ่มต้นเสมอ (ทั้งเมนูบนสุดและ element อื่นในหน้า
  //    เช่นลิงก์ในหน้า index.html) จนกว่าจะรู้ role จริงว่าเป็น hr — กันไม่ให้กะพริบเห็นก่อนโดนซ่อน ──
  document.querySelectorAll("[data-hr-only]").forEach(function (el) { el.classList.add("hidden"); });

  // ── แสดงสถานะล็อกอินจริงจาก Firebase Authentication ──
  // (window.auth มาจาก js/firebase-config.js ที่ต้องโหลดไว้ก่อนไฟล์นี้)
  if (window.auth) {
    auth.onAuthStateChanged(function (user) {
      var กล่องผู้ใช้ = document.getElementById("navUser");
      if (!กล่องผู้ใช้) return;

      if (!user) {
        กล่องผู้ใช้.innerHTML =
          '<a href="login.html" class="btn-ghost">เข้าสู่ระบบ</a> ' +
          '<a href="register.html" class="btn-ghost">สมัครสมาชิก</a>';
        return;
      }

      // ล็อกอินอยู่ → ไปหาชื่อจริงจากโฟลเดอร์ users มาแสดง (ถ้าหาไม่เจอ ใช้อีเมลแทน)
      db.collection("users").doc(user.uid).get().then(function (snap) {
        var ข้อมูลผู้ใช้ = snap.exists ? snap.data() : {};
        var ชื่อที่แสดง = ข้อมูลผู้ใช้.name || user.email;
        กล่องผู้ใช้.innerHTML =
          "👤 " + esc(ชื่อที่แสดง) +
          ' <button type="button" id="ปุ่มออกจากระบบ" class="btn-ghost">ออกจากระบบ</button>';
        document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", function () {
          auth.signOut().then(function () { location.href = "login.html"; });
        });

        // เป็น hr เท่านั้น ถึงจะแสดงลิงก์/element ที่ทำเครื่องหมาย data-hr-only ไว้
        if (ข้อมูลผู้ใช้.role === "hr") {
          document.querySelectorAll("[data-hr-only]").forEach(function (el) { el.classList.remove("hidden"); });
        }
      });
    });
  }
})();

// แถบเตือนสีเหลือง ใช้กรณีเรียก Firebase ไม่สำเร็จ (เช่น ยังไม่ได้เปิดใช้ provider)
function showConfigWarning(ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML = "⚠️ " + (ข้อความ || "เกิดปัญหาในการเชื่อมต่อ Firebase");
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
