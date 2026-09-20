// ─────────────────────────────────────────────────────────────
// js/dashboard.js — หน้าที่ 5 แดชบอร์ดสรุป
// สัปดาห์ที่ 7: นับจากข้อมูลจริงใน Firestore (การกรองตามสิทธิ์ผู้ใช้เป็นงานสัปดาห์ที่ 8)
// ─────────────────────────────────────────────────────────────

ต้องล็อกอินก่อน(function () {
  var กล่องตัวเลข = document.getElementById("กล่องตัวเลข");
  var กล่องล่าสุด = document.getElementById("ล่าสุด");

  var สถานะทั้งหมด = ["รอพิจารณา", "อนุมัติ", "ไม่อนุมัติ"];

  db.collection("leaveRequests").onSnapshot(function (snapshot) {
    var รายการ = [];
    snapshot.forEach(function (docSnap) {
      var ใบ = docSnap.data();
      ใบ.id = docSnap.id;
      รายการ.push(ใบ);
    });

    วาดกล่องตัวเลข(รายการ);
    วาดล่าสุด(รายการ);
  }, function (err) {
    กล่องตัวเลข.innerHTML = "<p>อ่านข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  function วาดกล่องตัวเลข(รายการ) {
    var html = "";
    สถานะทั้งหมด.forEach(function (สถานะ) {
      var จำนวน = รายการ.filter(function (ใบ) { return ใบ.status === สถานะ; }).length;
      html +=
        '<a class="stat" href="leave-requests.html?status=' + encodeURIComponent(สถานะ) + '">' +
        '<div class="number">' + จำนวน + "</div>" +
        "<div>" + esc(สถานะ) + "</div>" +
        "</a>";
    });
    กล่องตัวเลข.innerHTML = html;
  }

  function วาดล่าสุด(รายการ) {
    var ล่าสุด = รายการ.slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })
      .slice(0, 5);

    if (ล่าสุด.length === 0) {
      กล่องล่าสุด.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>หัวข้อ</th><th>สถานะ</th><th>ผู้ขอลา</th><th>วันที่ยื่น</th></tr></thead><tbody>";
    ล่าสุด.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        "<td>" + esc(ใบ.requesterName) + "</td>" +
        "<td>" + esc(ใบ.createdAt) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table>";
    กล่องล่าสุด.innerHTML = html;

    กล่องล่าสุด.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + แถว.dataset.id;
      });
    });
  }
});
