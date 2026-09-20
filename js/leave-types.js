// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// สัปดาห์ที่ 7: เพิ่ม แก้ ลบ ลง Firestore จริง (โฟลเดอร์ leaveTypes)
// ─────────────────────────────────────────────────────────────

ต้องล็อกอินก่อน(function () {
  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");

  db.collection("leaveTypes").onSnapshot(function (snapshot) {
    var รายการ = [];
    snapshot.forEach(function (docSnap) {
      รายการ.push({ id: docSnap.id, name: docSnap.data().name });
    });
    วาดตาราง(รายการ);
  }, function (err) {
    ที่วางตาราง.innerHTML = "<p>อ่านข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  document.getElementById("ปุ่มเพิ่ม").addEventListener("click", เพิ่มประเภท);

  function วาดตาราง(รายการ) {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      html +=
        "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
        '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
        '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>' +
        "</td></tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit, รายการ); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del, รายการ); });
    });
  }

  function เพิ่มประเภท() {
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      กล่องเตือน.textContent = "⚠️ พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้";
      กล่องเตือน.classList.remove("hidden");
      return;
    }
    กล่องเตือน.classList.add("hidden");
    db.collection("leaveTypes").add({ name: ชื่อ }).then(function () {
      ช่องชื่อใหม่.value = "";
    }).catch(function (err) {
      กล่องเตือน.textContent = "⚠️ เพิ่มไม่สำเร็จ: " + err.message;
      กล่องเตือน.classList.remove("hidden");
    });
  }

  function แก้ประเภท(id, รายการ) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท.name);
    if (ชื่อใหม่ === null) return;              // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
    db.collection("leaveTypes").doc(id).update({ name: ชื่อใหม่.trim() }).catch(function (err) {
      alert("แก้ไขไม่สำเร็จ: " + err.message);
    });
  }

  function ลบประเภท(id, รายการ) {
    var ประเภท = รายการ.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + ประเภท.name + '" หรือไม่')) return;
    db.collection("leaveTypes").doc(id).delete().catch(function (err) {
      alert("ลบไม่สำเร็จ: " + err.message);
    });
  }
});
