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
  var ปุ่มขอAI = document.getElementById("ปุ่มขอAI");
  var กล่องข้อเสนอAI = document.getElementById("ข้อเสนอAI");
  var ข้อความเสนอAI = document.getElementById("ข้อความเสนอAI");
  var ประเภทการลาทั้งหมด = {}; // เก็บเป็น { id: name }

  // เติมรายการเลื่อนลงด้วยประเภทการลาจากโฟลเดอร์ leaveTypes จริง (สัปดาห์ที่ 7 เป็นต้นไป)
  db.collection("leaveTypes").get().then(function (snapshot) {
    snapshot.forEach(function (docSnap) {
      var ประเภท = docSnap.data();
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = docSnap.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
      // เก็บไว้สำหรับปุ่ม AI ใช้
      ประเภทการลาทั้งหมด[docSnap.id] = ประเภท.name;
    });
  }).catch(function (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
  });

  // ปุ่มให้ AI ช่วยจัดประเภทการลา (US-09)
  ปุ่มขอAI.addEventListener("click", function (e) {
    e.preventDefault();

    var เหตุผล = document.getElementById("reason").value.trim();
    if (!เหตุผล) {
      เตือน("ต้องกรอกเหตุผลการลาก่อนขอ AI ช่วยจัดประเภท");
      return;
    }

    // ตรวจว่า config AI มีจริง
    if (!window.AI_CONFIG || !window.AI_CONFIG.openRouterApiKey || window.AI_CONFIG.openRouterApiKey.includes("ใส่คีย์")) {
      เตือน("ระบบยังไม่ได้ตั้งค่าคีย์ OpenRouter — ไม่สามารถขอ AI ช่วยได้");
      return;
    }

    ปุ่มขอAI.disabled = true;
    ปุ่มขอAI.textContent = "กำลังวิเคราะห์...";
    กล่องข้อเสนอAI.classList.add("hidden");

    // รายชื่อประเภทการลาที่มีอยู่
    var รายชื่อประเภท = Object.values(ประเภทการลาทั้งหมด).join(", ");

    // สร้างข้อความให้ AI ตัดสินใจจัดประเภท (ไม่ส่งข้อมูลส่วนบุคคลจริงไป)
    var promptAI = "ผู้ใช้เขียนว่า: \"" + เหตุผล + "\"\n\n" +
                   "โปรดเลือกประเภทการลาที่เหมาะสมจากรายชื่อต่อไปนี้ เพียงตัวเดียว:\n" +
                   "- " + Object.values(ประเภทการลาทั้งหมด).join("\n- ") + "\n\n" +
                   "ตอบแค่ชื่อประเภทการลา ไม่ต้องอธิบาย";

    // เรียก OpenRouter API ด้วย AbortController (timeout 15 วินาที)
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 15000);

    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + window.AI_CONFIG.openRouterApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: window.AI_CONFIG.model,
        messages: [
          {
            role: "user",
            content: promptAI
          }
        ],
        max_tokens: 50
      }),
      signal: controller.signal
    })
    .then(function (res) {
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error("API ตอบ: " + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      var ข้อความAI = data.choices[0].message.content.trim();

      // ค้นหาประเภทการลาที่ตรงกับคำตอบ AI
      var ประเภทที่เลือก = null;
      var idที่เลือก = null;

      for (var id in ประเภทการลาทั้งหมด) {
        if (ข้อความAI.includes(ประเภทการลาทั้งหมด[id])) {
          ประเภทที่เลือก = ประเภทการลาทั้งหมด[id];
          idที่เลือก = id;
          break;
        }
      }

      if (!ประเภทที่เลือก) {
        เตือน("AI ไม่สามารถจัดประเภทได้ - ชื่อที่ AI ตอบ \"" + ข้อความAI + "\" ไม่ตรงกับประเภทในระบบ");
        ปุ่มขอAI.disabled = false;
        ปุ่มขอAI.textContent = "ให้ AI ช่วยจัดประเภท";
        return;
      }

      // กำหนดประเภทใน dropdown
      ช่องประเภท.value = idที่เลือก;

      // แสดงข้อเสนอ
      ข้อความเสนอAI.textContent = "AI เสนอให้เลือก: " + ประเภทที่เลือก;
      กล่องข้อเสนอAI.classList.remove("hidden");

      ปุ่มขอAI.disabled = false;
      ปุ่มขอAI.textContent = "ให้ AI ช่วยจัดประเภท";
    })
    .catch(function (err) {
      clearTimeout(timeoutId);

      // Handle timeout และ error โดยไม่ทำให้ระบบค้าง
      if (err.name === "AbortError") {
        เตือน("ขออ AI ใช้เวลานาน - ปุ่มบันทึกยังใช้ได้ตามปกติ");
      } else {
        เตือน("ขออ AI ไม่สำเร็จ - ปุ่มบันทึกยังใช้ได้ตามปกติ");
      }

      ปุ่มขอAI.disabled = false;
      ปุ่มขอAI.textContent = "ให้ AI ช่วยจัดประเภท";
    });
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
