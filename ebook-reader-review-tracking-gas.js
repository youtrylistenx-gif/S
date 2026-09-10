// ════════════════════════════════════════════════════════════
//  หลังบ้าน มึงลองฟัง.❤️‍🔥 — นับผู้อ่าน + ระบบรีวิว (รองรับหลายอีบุ๊ค)
//  Google Apps Script Web App
//
//  ⭐ ใช้ร่วมกันได้ทุกอีบุ๊ค ทั้งที่มีตอนนี้ (ปลุกไฟในตัวมึง / ฮีลใจ / ชีวิตที่มึงไม่เสียใจภายหลัง)
//  และเล่มใหม่ในอนาคต — แค่ให้หน้าเว็บของแต่ละเล่มส่งชื่อเล่ม (ebook) มาด้วยทุกครั้ง
//  ระบบจะสร้างแท็บแยกให้เองอัตโนมัติตามชื่อเล่ม ไม่ต้องแก้โค้ดเพิ่มตอนมีเล่มใหม่เลย
//
//  โครงสร้างแท็บ: ทุกเล่มจะมี 2 แท็บแยกกันชัดเจน (สร้างเองอัตโนมัติตอนมีข้อมูลครั้งแรก)
//    - "ผู้อ่าน - <ชื่อเล่ม>"  คอลัมน์: เวลา, รหัสผู้อ่าน
//    - "รีวิว - <ชื่อเล่ม>"    คอลัมน์: เวลา, ชื่อ, คะแนน, รีวิว, อนุมัติแล้ว
//  เช่น "ผู้อ่าน - ฮีลใจ", "รีวิว - ฮีลใจ" ฯลฯ — เปิดชีทแล้วดูชื่อแท็บก็รู้เลยว่าของเล่มไหน
//
//  วิธี deploy:
//  1. สร้าง Google Sheet ใหม่ (ไฟล์เปล่าๆ ก็ได้ ชื่ออะไรก็ได้)
//  2. เปิด Sheet นั้น → เมนู Extensions → Apps Script
//  3. ลบโค้ดเดิมในไฟล์ Code.gs ออกให้หมด แล้ว paste โค้ดนี้ทั้งหมดแทน แล้ว Save
//  4. กด Deploy → New deployment → เลือกไอคอนเฟือง → Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  5. กด Deploy แล้ว copy URL ที่ได้ (ลงท้ายด้วย /exec)
//  6. เอา URL นั้นไปแปะแทนที่ WEB_APP_URL ในหน้าเว็บของแต่ละอีบุ๊ค (ebook-plukfai.html ฯลฯ)
//
//  วิธีอนุมัติรีวิว (เพราะรีวิวไม่ขึ้นเว็บอัตโนมัติ ต้องอนุมัติก่อน):
//  1. เปิด Google Sheet → หาแท็บ "รีวิว - <ชื่อเล่ม>" ของเล่มที่ต้องการ
//     (โผล่มาเองหลังมีคนส่งรีวิวของเล่มนั้นเข้ามาครั้งแรก)
//  2. แต่ละแถวจะมีคอลัมน์ "อนุมัติแล้ว" (ช่องติ๊ก checkbox)
//  3. ติ๊กถูกแถวไหน รีวิวแถวนั้นจะขึ้นแสดงบนเว็บภายในไม่กี่วินาที (ไม่ต้อง deploy ใหม่)
// ════════════════════════════════════════════════════════════

// ถ้าหน้าเว็บรุ่นเก่าไม่ได้ส่ง ebook มาเลย จะถือว่าเป็นเล่มนี้ไปก่อน
var DEFAULT_EBOOK = 'ปลุกไฟในตัวมึง';

function doGet(e) {
  var action = (e.parameter.action || '').trim();
  var ebook = (e.parameter.ebook || DEFAULT_EBOOK).trim();

  try {
    if (action === 'getStats')   return jsonOut({ ok: true, readerCount: getReaderCount(ebook) });
    if (action === 'getReviews') return jsonOut({ ok: true, reviews: getApprovedReviews(ebook) });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }

  return jsonOut({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ebook = (body.ebook || DEFAULT_EBOOK).trim();

    if (body.type === 'reader') {
      addReaderIfNew(body.readerId || '', ebook);
      return jsonOut({ ok: true });
    }

    if (body.type === 'review') {
      addReview(body.name || '', body.rating || 5, body.text || '', ebook);
      return jsonOut({ ok: true });
    }
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }

  return jsonOut({ ok: false, error: 'unknown type' });
}

// ─── ผู้อ่าน (นับไม่ซ้ำเครื่อง ตาม readerId ที่ฝั่งเว็บสุ่มเก็บไว้ใน localStorage) ───

function addReaderIfNew(readerId, ebook) {
  if (!readerId) return;
  var sheet = getOrCreateSheet('ผู้อ่าน - ' + ebook, ['เวลา', 'รหัสผู้อ่าน']);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var existingIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingIds.length; i++) {
      if (existingIds[i][0] === readerId) return; // มีอยู่แล้ว ไม่นับซ้ำ
    }
  }
  sheet.appendRow([new Date(), readerId]);
}

function getReaderCount(ebook) {
  var sheet = getOrCreateSheet('ผู้อ่าน - ' + ebook, ['เวลา', 'รหัสผู้อ่าน']);
  return Math.max(0, sheet.getLastRow() - 1);
}

// ─── รีวิว ───

function addReview(name, rating, text, ebook) {
  var sheet = getOrCreateSheet('รีวิว - ' + ebook, ['เวลา', 'ชื่อ', 'คะแนน', 'รีวิว', 'อนุมัติแล้ว']);
  // ใช้ appendRow() ไม่ได้ตรงๆ เพราะคอลัมน์ "อนุมัติแล้ว" เตรียม checkbox ไว้ล่วงหน้า 998 แถว
  // ทำให้ getLastRow() มองว่าแถวเหล่านั้น "มีข้อมูล" แล้ว appendRow จะไปเขียนที่แถว 1000 แทน
  // เลยต้องหาแถวว่างจริงจากคอลัมน์ "เวลา" (ซึ่งไม่ได้ถูกเติมล่วงหน้า) แทน
  var nextRow = findNextEmptyDataRow(sheet);
  sheet.getRange(nextRow, 1, 1, 4).setValues([[new Date(), name, rating, text]]);
  // ใส่ checkbox เฉพาะแถวนี้เองเสมอ (ทำแค่ 1 เซลล์ เร็วมาก ไม่ใช่ทำทีเดียว 998 แถวแบบตอนสร้างแท็บ
  // ที่ทำให้ช้า) กันกรณี checkbox ที่เตรียมไว้ล่วงหน้าหายไป (เช่น โดนล้างฟอร์แมตตอนลบแถวทดสอบเก่า)
  // จะได้มีช่องติ๊กให้กดอนุมัติเสมอ ไม่ว่าอะไรจะเกิดขึ้นกับแท็บนี้มาก่อน
  sheet.getRange(nextRow, 5).insertCheckboxes();
  sheet.getRange(nextRow, 5).setValue(false);
}

function findNextEmptyDataRow(sheet) {
  var lastPossibleRow = Math.max(sheet.getMaxRows(), 2);
  var colA = sheet.getRange(2, 1, lastPossibleRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (!colA[i][0]) return i + 2; // แถวแรกที่คอลัมน์ "เวลา" ยังว่างอยู่
  }
  return lastPossibleRow + 1; // เผื่อกรณีเต็มทุกแถว (ไม่ควรเกิดในทางปฏิบัติ)
}

function getApprovedReviews(ebook) {
  var sheet = getOrCreateSheet('รีวิว - ' + ebook, ['เวลา', 'ชื่อ', 'คะแนน', 'รีวิว', 'อนุมัติแล้ว']);
  var lastRow = sheet.getLastRow();
  var reviews = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    for (var i = data.length - 1; i >= 0; i--) { // ใหม่สุดขึ้นก่อน
      var row = data[i];
      var approved = row[4] === true;
      if (approved) {
        reviews.push({ name: String(row[1] || 'ไม่ระบุชื่อ'), rating: Number(row[2]) || 5, text: String(row[3] || '') });
      }
    }
  }
  return reviews;
}

// ─── Helper ───

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    var approvedCol = headers.indexOf('อนุมัติแล้ว');
    if (approvedCol !== -1) {
      // เตรียมคอลัมน์ "อนุมัติแล้ว" ให้เป็น checkbox ไว้ล่วงหน้า 998 แถว
      // (ทำครั้งเดียวตอนสร้างแท็บ แทนที่จะทำทุกครั้งที่มีคนส่งรีวิว จะได้ไม่หน่วง)
      sheet.getRange(2, approvedCol + 1, 998, 1).insertCheckboxes();
    }
  }
  return sheet;
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
