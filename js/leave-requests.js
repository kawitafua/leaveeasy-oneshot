// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6 เป็นต้นไป: อ่านข้อมูลจริงจาก Firestore แบบเรียลไทม์ (onSnapshot)
// แก้ข้อมูลใน Firebase Console แล้วหน้านี้จะเปลี่ยนตามทันทีโดยไม่ต้องกด F5
// ─────────────────────────────────────────────────────────────

ต้องล็อกอินก่อน(function (user) {
  var กล่อง = document.getElementById("ผลลัพธ์");

  // ถ้ามีสถานะติดมาท้าย URL (มาจากหน้าแดชบอร์ด) ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  // ── สัปดาห์ที่ 8: Security Rules ปฏิเสธการอ่านทั้ง collection แบบไม่กรอง
  //     employee ต้องกรองด้วย .where("requesterId","==",uid) ถึงจะอ่านผ่านกฎ (เห็นเฉพาะใบของตัวเอง)
  //     ส่วน manager/hr อ่านได้ทุกใบเหมือนเดิม ต้องไปอ่าน role จาก users/{uid} ก่อนตัดสินใจ query ──
  db.collection("users").doc(user.uid).get().then(function (snap) {
    var role = snap.exists ? snap.data().role : "employee";
    var เป็นผู้ขอลาเท่านั้น = !(role === "manager" || role === "hr");

    // employee: กรองด้วย requesterId เท่านั้น (ไม่ใช้ orderBy ร่วมกับ where ต่างฟิลด์ เพราะ Firestore
    //           ต้องมี composite index) แล้วเรียงลำดับเองด้วย JS แทนหลังอ่านข้อมูลมา
    var query = เป็นผู้ขอลาเท่านั้น
      ? db.collection("leaveRequests").where("requesterId", "==", user.uid)
      : db.collection("leaveRequests").orderBy("createdAt", "desc");

    query.onSnapshot(function (snapshot) {
      var รายการ = [];
      snapshot.forEach(function (docSnap) {
        var ใบ = docSnap.data();
        ใบ.id = docSnap.id;
        รายการ.push(ใบ);
      });

      if (เป็นผู้ขอลาเท่านั้น) {
        รายการ.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
      }

      if (สถานะที่กรอง) {
        รายการ = รายการ.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
      }

      แสดงตาราง(รายการ);
    }, function (err) {
      กล่อง.innerHTML = "<p>อ่านข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
    });
  }).catch(function (err) {
    กล่อง.innerHTML = "<p>อ่านข้อมูลผู้ใช้ไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }
});
