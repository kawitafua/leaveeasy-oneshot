// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลง Firestore จริง
// requesterId = uid ของคนที่ล็อกอินอยู่จริง (ไม่ใช่ค่าสมมติอีกต่อไป)
// ─────────────────────────────────────────────────────────────

ต้องล็อกอินก่อน(function (user) {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

  // เติมรายการเลื่อนลงด้วยประเภทการลาจากโฟลเดอร์ leaveTypes จริง (สัปดาห์ที่ 7 เป็นต้นไป)
  db.collection("leaveTypes").get().then(function (snapshot) {
    snapshot.forEach(function (docSnap) {
      var ประเภท = docSnap.data();
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = docSnap.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  }).catch(function (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    ปุ่มบันทึก.disabled = true;
    ปุ่มบันทึก.textContent = "กำลังบันทึก…";

    var ชื่อประเภท = ช่องประเภท.options[ช่องประเภท.selectedIndex].textContent;

    // ต้องรู้ชื่อผู้ขอลาก่อน (จดชื่อซ้ำไว้ใน requesterName ตามหัวข้อ 5)
    db.collection("users").doc(user.uid).get().then(function (snap) {
      var ชื่อผู้ขอลา = (snap.exists && snap.data().name) ? snap.data().name : (user.email || "");

      var ใบใหม่ = {
        title: ค่า.title,
        reason: ค่า.reason,
        status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ ตั้งอัตโนมัติ
        requesterId: user.uid, requesterName: ชื่อผู้ขอลา,
        approverId: "",         approverName: "",
        leaveTypeId: ค่า.leaveTypeId, leaveTypeName: ชื่อประเภท,
        startDate: ค่า.startDate,
        endDate: ค่า.endDate,
        createdAt: เวลาตอนนี้()
      };

      return db.collection("leaveRequests").add(ใบใหม่);
    }).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่มบันทึก.disabled = false;
      ปุ่มบันทึก.textContent = "บันทึก";
      เตือน("บันทึกไม่สำเร็จ: " + err.message);
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
});
