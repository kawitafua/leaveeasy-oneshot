// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// สัปดาห์ที่ 6 เป็นต้นไป: อ่านข้อมูลจริงจาก Firestore แบบเรียลไทม์ (onSnapshot)
// แก้ข้อมูลใน Firebase Console แล้วหน้านี้จะเปลี่ยนตามทันทีโดยไม่ต้องกด F5
// ─────────────────────────────────────────────────────────────

ต้องล็อกอินก่อน(function () {
  var กล่อง = document.getElementById("ผลลัพธ์");

  // ถ้ามีสถานะติดมาท้าย URL (มาจากหน้าแดชบอร์ด) ให้กรองเฉพาะสถานะนั้น
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    document.querySelector(".subtitle").textContent =
      "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
  }

  db.collection("leaveRequests")
    .orderBy("createdAt", "desc")
    .onSnapshot(function (snapshot) {
      var รายการ = [];
      snapshot.forEach(function (docSnap) {
        var ใบ = docSnap.data();
        ใบ.id = docSnap.id;
        รายการ.push(ใบ);
      });

      if (สถานะที่กรอง) {
        รายการ = รายการ.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
      }

      แสดงตาราง(รายการ);
    }, function (err) {
      กล่อง.innerHTML = "<p>อ่านข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
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
