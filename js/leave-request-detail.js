// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่าน/แก้/ลบ ข้อมูลจริงใน Firestore
// ─────────────────────────────────────────────────────────────

ต้องล็อกอินก่อน(function (user) {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");

  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — ลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  var refใบลา = db.collection("leaveRequests").doc(รหัสใบลา);
  var ใบปัจจุบัน = null;      // เก็บข้อมูลใบลาล่าสุดที่อ่านมาจาก Firestore
  var ความเห็นปัจจุบัน = [];  // เก็บรายการความเห็นล่าสุด
  var บทบาทผู้ใช้ = null;     // เก็บ role ของผู้ใช้ที่ล็อกอินอยู่ ไว้ตัดสินใจว่าจะแสดงปุ่มอนุมัติ/ไม่อนุมัติหรือไม่

  // ── อ่าน role ของผู้ใช้ที่ล็อกอินอยู่จาก users/{uid} (pattern เดียวกับ leave-requests.js/dashboard.js)
  //    ต้องรู้ role ก่อน ถึงจะตัดสินใจได้ว่าควรแสดงปุ่มอนุมัติ/ไม่อนุมัติหรือไม่ (สเปคหัวข้อ 2: employee เปลี่ยนสถานะไม่ได้) ──
  db.collection("users").doc(user.uid).get().then(function (snap) {
    บทบาทผู้ใช้ = snap.exists ? snap.data().role : "employee";
    วาดใบลา();
  }).catch(function () {
    บทบาทผู้ใช้ = "employee"; // อ่าน role ไม่ได้ ให้ถือว่าไม่มีสิทธิ์ไว้ก่อน (ปลอดภัยกว่า)
    วาดใบลา();
  });

  // ── อ่านตัวใบลาแบบเรียลไทม์ ──
  refใบลา.onSnapshot(function (snap) {
    if (!snap.exists) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      กล่องความเห็น.classList.add("hidden");
      return;
    }
    ใบปัจจุบัน = snap.data();
    ใบปัจจุบัน.id = snap.id;
    กล่องความเห็น.classList.remove("hidden");
    วาดใบลา();
  }, function (err) {
    กล่องใบลา.innerHTML = "<p>อ่านข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  // ── อ่านความเห็นการอนุมัติแบบเรียลไทม์ เรียงเก่าไปใหม่ ──
  refใบลา.collection("approvals").orderBy("createdAt", "asc").onSnapshot(function (snapshot) {
    ความเห็นปัจจุบัน = [];
    snapshot.forEach(function (docSnap) {
      var c = docSnap.data();
      c.id = docSnap.id;
      ความเห็นปัจจุบัน.push(c);
    });
    วาดความเห็น();
  }, function (err) {
    // ไม่มี error callback ตัวนี้มาก่อน ทำให้กรณี permission-denied (เช่น employee แก้ URL เปิดใบคนอื่น)
    // หน้าจะค้างเงียบ ๆ ไม่มีอะไรขึ้นเลย — เพิ่ม callback นี้ให้ขึ้นข้อความแทน
    var ที่วางความเห็น = document.getElementById("รายการความเห็น");
    if (ที่วางความเห็น) {
      ที่วางความเห็น.innerHTML = "<p>อ่านความเห็นไม่สำเร็จ: " + esc(err.message) + "</p>";
    }
  });

  document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    if (!ใบปัจจุบัน) return; // ยังไม่มีข้อมูลใบลา หรือยังไม่รู้ role ผู้ใช้ — รอรอบถัดไป
    var ใบ = ใบปัจจุบัน;
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ ขึ้นเฉพาะใบที่ยังรอพิจารณา และเฉพาะ manager/hr เท่านั้น
    // (สเปคหัวข้อ 2 และ 6: employee เปลี่ยนสถานะไม่ได้ — Security Rules ปฏิเสธไว้แล้ว
    //  แต่ถ้าไม่ซ่อนปุ่มด้วย employee จะกดแล้วเจอ error ดิบจาก Firestore)
    var มีสิทธิ์อนุมัติ = บทบาทผู้ใช้ === "manager" || บทบาทผู้ใช้ === "hr";
    if (ใบ.status === "รอพิจารณา" && มีสิทธิ์อนุมัติ) {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>";
    } else if (ใบ.status !== "รอพิจารณา") {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    // ปุ่มลบ — กดได้เฉพาะใบที่ยังรอพิจารณาเท่านั้น
    html += '<div class="btn-row">';
    if (ใบ.status === "รอพิจารณา") {
      html += '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบขอลานี้</button>';
    } else {
      html += '<button type="button" class="btn-danger" disabled title="ลบได้เฉพาะใบที่ยังรอพิจารณา">ลบใบขอลานี้</button>';
    }
    html += "</div>";

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา" && มีสิทธิ์อนุมัติ) {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
    }
    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── เปลี่ยนสถานะ — แก้เฉพาะช่อง status ห้ามเขียนทับช่องอื่น ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็นปัจจุบัน.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }
    refใบลา.update({ status: สถานะใหม่ }).catch(function (err) {
      alert("เปลี่ยนสถานะไม่สำเร็จ: " + err.message);
    });
  }

  // ── ลบใบลา (เฉพาะใบที่ยังรอพิจารณา) ──
  function ลบใบลา() {
    if (ใบปัจจุบัน.status !== "รอพิจารณา") return;
    if (!confirm('ยืนยันการลบใบขอลา "' + ใบปัจจุบัน.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;
    refใบลา.delete().then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      alert("ลบไม่สำเร็จ: " + err.message);
    });
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็นปัจจุบัน.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็นปัจจุบัน.map(function (c) {
      return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
             "</div><div>" + esc(c.message) + "</div></div>";
    }).join("");
  }

  // ── ส่งความเห็นใหม่ ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    db.collection("users").doc(user.uid).get().then(function (snap) {
      var ชื่อผู้เขียน = (snap.exists && snap.data().name) ? snap.data().name : (user.email || "");
      return refใบลา.collection("approvals").add({
        authorId: user.uid, authorName: ชื่อผู้เขียน,
        message: ข้อความ,
        createdAt: เวลาตอนนี้()
      });
    }).then(function () {
      ช่อง.value = "";
    }).catch(function (err) {
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
      เตือน.classList.remove("hidden");
    });
  }
});
