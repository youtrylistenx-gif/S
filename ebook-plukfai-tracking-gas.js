// ════════════════════════════════════════════════════════════
//  ปลุกไฟในตัวมึง — นับผู้อ่าน + ระบบรีวิว
//  Google Apps Script Web App
//
//  วิธี deploy:
//  1. สร้าง Google Sheet ใหม่ (ไฟล์เปล่าๆ ก็ได้ ชื่ออะไรก็ได้)
//  2. เปิด Sheet นั้น → เมนู Extensions → Apps Script
//  3. ลบโค้ดเดิมในไฟล์ Code.gs ออกให้หมด แล้ว paste โค้ดนี้ทั้งหมดแทน
//  4. กด Deploy → New deployment → เลือกไอคอนเฟือง → Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  5. กด Deploy แล้ว copy URL ที่ได้ (ลงท้ายด้วย /exec)
//  6. เอา URL นั้นไปแปะแทนที่ WEB_APP_URL ใน ebook-plukfai.html
//     (หาคำว่า "ใส่ Web App URL ตรงนี้" ในไฟล์)
//
//  วิธีอนุมัติรีวิว (เพราะรีวิวไม่ขึ้นเว็บอัตโนมัติ ต้องอนุมัติก่อน):
//  1. เปิด Google Sheet ที่ผูกกับสคริปต์นี้ → จะมีแท็บ "Reviews" โผล่มาเอง
//     หลังมีคนส่งรีวิวเข้ามาครั้งแรก
//  2. แต่ละแถวจะมีคอลัมน์ Approved (ช่องติ๊ก checkbox)
//  3. ติ๊กถูกแถวไหน รีวิวแถวนั้นจะขึ้นแสดงบนเว็บภายในไม่กี่วินาที (ไม่ต้อง deploy ใหม่)
//
//  วิธีจัดการยอดสนับสนุน/โดเนท (จากหน้า plukfai-support.html):
//  1. จะมีแท็บ "Support" โผล่มาเองหลังมีคนส่งครั้งแรก
//  2. แต่ละแถวมี: DonateType (free/single/cumulative), Amount, Email,
//     CumulativeNote (ถ้าเลือกแบบสะสม ให้เช็คยอดที่เขาแจ้งเทียบกับสลิป),
//     ที่อยู่จัดส่ง (ถ้ายอดถึงขั้นรับของแถม), ลิงก์รูปสลิปที่อัปโหลด (SlipLink)
//  3. คอลัมน์ RewardSent เป็น checkbox — ติ๊กเมื่อจัดส่งของแถมให้แล้ว
//     (ไว้กันลืม/กันส่งซ้ำ ไม่ได้ผูกกับการแสดงผลบนเว็บ)
// ════════════════════════════════════════════════════════════

function doGet(e) {
  var action = (e.parameter.action || '').trim();

  try {
    if (action === 'getStats')   return jsonOut({ ok: true, readerCount: getReaderCount() });
    if (action === 'getReviews') return jsonOut({ ok: true, reviews: getApprovedReviews() });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }

  return jsonOut({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.type === 'reader') {
      addReaderIfNew(body.readerId || '');
      return jsonOut({ ok: true });
    }

    if (body.type === 'review') {
      addReview(body.name || '', body.rating || 5, body.text || '');
      return jsonOut({ ok: true });
    }

    if (body.type === 'support') {
      addSupport(body);
      return jsonOut({ ok: true });
    }
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }

  return jsonOut({ ok: false, error: 'unknown type' });
}

// ─── ผู้อ่าน (นับไม่ซ้ำเครื่อง ตาม readerId ที่ฝั่งเว็บสุ่มเก็บไว้ใน localStorage) ───

function addReaderIfNew(readerId) {
  if (!readerId) return;
  var sheet = getOrCreateSheet('Readers', ['Timestamp', 'ReaderID']);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var existingIds = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingIds.length; i++) {
      if (existingIds[i][0] === readerId) return; // มีอยู่แล้ว ไม่นับซ้ำ
    }
  }
  sheet.appendRow([new Date(), readerId]);
}

function getReaderCount() {
  var sheet = getOrCreateSheet('Readers', ['Timestamp', 'ReaderID']);
  return Math.max(0, sheet.getLastRow() - 1);
}

// ─── รีวิว ───

function addReview(name, rating, text) {
  var sheet = getOrCreateSheet('Reviews', ['Timestamp', 'Name', 'Rating', 'Review', 'Approved']);
  sheet.appendRow([new Date(), name, rating, text, false]);
}

function getApprovedReviews() {
  var sheet = getOrCreateSheet('Reviews', ['Timestamp', 'Name', 'Rating', 'Review', 'Approved']);
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

// ─── สนับสนุน / โดเนท ───

function addSupport(body) {
  var sheet = getOrCreateSheet('Support', [
    'Timestamp', 'DonateType', 'Amount', 'Email', 'CumulativeNote',
    'ShipName', 'ShipAddress', 'ShipPhone', 'SlipLink', 'RewardSent'
  ]);

  var slipLink = '';
  if (body.slipData) {
    try {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(body.slipData), 'image/jpeg',
        body.slipName || ('slip_' + Date.now() + '.jpg')
      );
      var folder = getOrCreateFolder('ปลุกไฟในตัวมึง - สลิปโอนเงิน');
      var file = folder.createFile(blob);
      slipLink = file.getUrl();
    } catch (err) {
      slipLink = 'เก็บสลิปไม่สำเร็จ: ' + err.message;
    }
  }

  sheet.appendRow([
    new Date(),
    body.donateType || '',
    body.amount || 0,
    body.email || '',
    body.cumulativeNote || '',
    body.shipName || '',
    body.shipAddress || '',
    body.shipPhone || '',
    slipLink,
    false
  ]);
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}

// ─── Helper ───

function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    if (name === 'Reviews') {
      // เตรียมคอลัมน์ Approved (E) ให้เป็น checkbox ไว้ล่วงหน้า 998 แถว
      // (ทำครั้งเดียวตอนสร้างชีต แทนที่จะทำทุกครั้งที่มีคนส่งรีวิว จะได้ไม่หน่วง)
      sheet.getRange(2, 5, 998, 1).insertCheckboxes();
    }
  }
  return sheet;
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
