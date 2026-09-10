// ════════════════════════════════════════════════════════════
//  หลังบ้าน มึงลองฟัง.❤️‍🔥 — คำสั่งซื้อริสแบนด์ (checkout-wristband.html)
//  Google Apps Script Web App
//
//  รับข้อมูลจากหน้า checkout-wristband.html ทุกครั้งที่มีคนกดส่งข้อมูล
//  (อีเมล / ชื่อ-เบอร์-ที่อยู่จัดส่ง / ยอดโอน / รูปสลิป) แล้วบันทึกลง Sheet
//  พร้อมส่งอีเมลแจ้งเตือนแอดมินทุกออเดอร์ใหม่ (เพราะเป็นของจริงต้องแพ็ค+ส่งเอง
//  ไม่เหมือนของดิจิทัลที่ส่งอัตโนมัติได้) และส่งอีเมลยืนยันการสั่งซื้อให้ลูกค้าด้วย
//
//  วิธี deploy:
//  1. สร้าง Google Sheet ใหม่ (ไฟล์เปล่าๆ ก็ได้ ชื่ออะไรก็ได้) → เมนู Extensions → Apps Script
//  2. ลบโค้ดเดิมในไฟล์ Code.gs ออกให้หมด แล้ว paste โค้ดนี้ทั้งหมดแทน แล้ว Save
//  3. Deploy → New deployment → เลือกไอคอนเฟือง → Web app
//     (Execute as: Me / Who has access: Anyone) → Deploy
//  4. copy URL ที่ได้ (ลงท้าย /exec) ไปแปะแทน WEB_APP_URL ในหน้า checkout-wristband.html
//
//  ⚠️ ครั้งแรกหลังวางโค้ดนี้ ต้องเข้า Apps Script editor เลือกฟังก์ชัน testSendMail
//  จาก dropdown ด้านบนแล้วกด Run เพื่ออนุญาตสิทธิ์ "ส่งอีเมล" ก่อน 1 ครั้ง ไม่งั้นอีเมล
//  จะส่งไม่ออก (ข้อมูลออเดอร์อื่นยังบันทึกได้ปกติ — เช็คสาเหตุได้ที่แท็บ "ErrorLog" ถ้าอีเมลไม่ออก)
//
//  วิธีดูออเดอร์ที่เข้ามา / ติ๊กว่าส่งแล้ว:
//  เปิด Sheet → แท็บ "คำสั่งซื้อริสแบนด์" — แต่ละแถวมีคอลัมน์ "จัดส่งแล้ว" (checkbox)
//  แพ็คของส่งลูกค้าเสร็จแล้วติ๊กถูกไว้ เพื่อเตือนตัวเองว่าออเดอร์ไหนจัดการแล้วบ้าง
// ════════════════════════════════════════════════════════════

var NOTIFY_EMAIL = 'youtrylistenx@gmail.com'; // อีเมลที่จะรับแจ้งเตือนออเดอร์ใหม่ทุกครั้ง แก้ตรงนี้ได้ถ้าอยากเปลี่ยน

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var email = (body.email || '').trim();
    var recipientName = (body.recipientName || '').trim();
    var phone = (body.phone || '').trim();
    var address = (body.address || '').trim();
    var amount = body.amount || '';
    var slipLink = saveSlip(body);

    var sheet = getOrCreateSheet('คำสั่งซื้อริสแบนด์',
      ['เวลา', 'อีเมล', 'ชื่อผู้รับ', 'เบอร์โทร', 'ที่อยู่จัดส่ง', 'ยอดโอน', 'ลิงก์สลิป', 'จัดส่งแล้ว']);
    var nextRow = findNextEmptyDataRow(sheet);
    sheet.getRange(nextRow, 1, 1, 7).setValues([[new Date(), email, recipientName, phone, address, amount, slipLink]]);
    sheet.getRange(nextRow, 8).insertCheckboxes();
    sheet.getRange(nextRow, 8).setValue(false);

    notifyNewOrder({ email: email, recipientName: recipientName, phone: phone, address: address, amount: amount, slipLink: slipLink });
    sendOrderConfirmEmail(email, recipientName);

    return jsonOut({ ok: true });
  } catch (err) {
    logNotifyError(err);
    return jsonOut({ ok: false, error: err.message });
  }
}

// ─── แจ้งเตือนแอดมินทุกออเดอร์ใหม่ (ของจริง ต้องแพ็ค+ส่งเอง ต่างจากของดิจิทัล) ───

function notifyNewOrder(details) {
  try {
    var lines = [
      'มีคนสั่งซื้อริสแบนด์เข้ามาใหม่ครับ 🧡',
      '',
      'อีเมลติดต่อกลับลูกค้า: ' + (details.email || '-'),
      'ชื่อผู้รับ: ' + (details.recipientName || '-'),
      'เบอร์โทร: ' + (details.phone || '-'),
      'ที่อยู่จัดส่ง: ' + (details.address || '-'),
      'ยอดโอน: ' + (details.amount || '-') + ' บาท',
      'ลิงก์สลิป: ' + (details.slipLink || '-'),
      '',
      'เช็คสลิปแล้วแพ็คของส่งได้เลยครับ พอส่งเสร็จอย่าลืมติ๊ก "จัดส่งแล้ว" ในชีท แท็บ "คำสั่งซื้อริสแบนด์" ด้วยนะครับ'
    ];
    MailApp.sendEmail(NOTIFY_EMAIL, '🧡 มีคำสั่งซื้อริสแบนด์ใหม่!', lines.join('\n'));
  } catch (err) {
    logNotifyError(err);
  }
}

// ─── อีเมลยืนยันการสั่งซื้อให้ลูกค้า ───

function sendOrderConfirmEmail(email, recipientName) {
  if (!email) return;
  try {
    var body = 'สวัสดีครับ ' + (recipientName || '') + '\n\n' +
      'ขอบคุณมากๆ เลยนะครับ ที่สั่งซื้อริสแบนด์ มึงลองฟัง.❤️‍🔥 🧡\n\n' +
      'ผมได้รับข้อมูลและสลิปเรียบร้อยแล้วครับ ขอเวลาเช็คสลิปและแพ็คของภายใน 1-2 วันทำการ ' +
      'แล้วจะจัดส่งให้ถึงบ้านทันทีนะครับ\n\n' +
      'ถ้ามีปัญหาหรืออยากสอบถามอะไรเพิ่มเติม ทักแชทมาที่เพจได้เลยครับ 🙏';
    MailApp.sendEmail(email, '❤️‍🔥 ขอบคุณที่สั่งซื้อริสแบนด์ มึงลองฟัง.❤️‍🔥 นะครับ', body);
  } catch (err) {
    logNotifyError(err);
    notifyOrderEmailFailed(email, err);
  }
}

function notifyOrderEmailFailed(customerEmail, err) {
  try {
    MailApp.sendEmail(NOTIFY_EMAIL, '⚠️ ส่งอีเมลยืนยันออเดอร์ริสแบนด์ไม่สำเร็จ',
      'มีคนสั่งซื้อริสแบนด์เข้ามาแล้ว แต่ระบบส่งอีเมลยืนยันกลับไปหาเขาไม่สำเร็จครับ\n\n' +
      'อีเมลลูกค้า: ' + (customerEmail || '-') + '\n' +
      'สาเหตุ: ' + ((err && err.message) || err) + '\n\n' +
      'รบกวนเช็คในชีท (แท็บ "คำสั่งซื้อริสแบนด์") แล้วติดต่อลูกค้าคนนี้เองโดยตรงแทนนะครับ ' +
      '(ข้อมูลออเดอร์ของเขายังบันทึกลงชีทปกติ ไม่ได้หายไปไหน)');
  } catch (err2) {
    logNotifyError(err2);
  }
}

// ใช้ฟังก์ชันนี้แค่ครั้งเดียวเพื่อบังคับให้ Apps Script ขอสิทธิ์ "ส่งอีเมล"
function testSendMail() {
  MailApp.sendEmail(NOTIFY_EMAIL, 'ทดสอบระบบอีเมล', 'นี่คืออีเมลทดสอบจากสคริปต์คำสั่งซื้อริสแบนด์ครับ ถ้าได้รับแปลว่าเชื่อมสิทธิ์ส่งอีเมลสำเร็จแล้ว');
}

// ─── เก็บรูปสลิปลง Google Drive ───

function saveSlip(body) {
  var slipLink = '';
  if (body.data) {
    try {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(body.data), 'image/jpeg',
        body.name || ('slip_' + Date.now() + '.jpg')
      );
      var folder = getOrCreateFolder('ริสแบนด์ - สลิปโอนเงิน');
      var file = folder.createFile(blob);
      slipLink = file.getUrl();
    } catch (err) {
      slipLink = 'เก็บสลิปไม่สำเร็จ: ' + err.message;
    }
  }
  return slipLink;
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
  }
  return sheet;
}

// หาแถวว่างจริงจากคอลัมน์ "เวลา" (คอลัมน์แรก ไม่มี checkbox มาเกะกะ) แทนการใช้ getLastRow()
// ตรงๆ เพราะคอลัมน์ "จัดส่งแล้ว" มี checkbox ซึ่งถ้าเผลอเตรียมไว้ล่วงหน้าหลายแถว จะทำให้
// getLastRow() มองว่าแถวเหล่านั้น "มีข้อมูล" แล้วไปเขียนทับผิดแถวได้
function findNextEmptyDataRow(sheet) {
  var lastPossibleRow = Math.max(sheet.getMaxRows(), 2);
  var colA = sheet.getRange(2, 1, lastPossibleRow - 1, 1).getValues();
  for (var i = 0; i < colA.length; i++) {
    if (!colA[i][0]) return i + 2;
  }
  return lastPossibleRow + 1;
}

function logNotifyError(err) {
  try {
    var sheet = getOrCreateSheet('ErrorLog', ['เวลา', 'ข้อความ error']);
    sheet.appendRow([new Date(), String((err && err.message) || err)]);
  } catch (e2) {
    // เงียบไปเลยถ้าแม้แต่การจด log ยัง error (กันพังซ้อนพัง)
  }
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
