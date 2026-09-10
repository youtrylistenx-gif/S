// ════════════════════════════════════════════════════════════
//  หลังบ้านกลาง มึงลองฟัง.❤️‍🔥 — นับผู้อ่าน + ระบบรีวิว + ระบบโดเนท
//  Google Apps Script Web App
//
//  ⭐ ใช้ร่วมกันได้ทั้ง 3 อีบุ๊ค (ปลุกไฟในตัวมึง / ฮีลใจ / ชีวิตที่มึงไม่เสียใจภายหลัง)
//  แค่ตั้งชื่อ EBOOK_NAME ในหน้าเว็บแต่ละเล่มให้ตรง ใช้ URL เดียวกันได้เลย ไม่ต้องแก้ไฟล์นี้
//
//  วิธี deploy:
//  1. สร้าง Google Sheet ใหม่ → เมนู Extensions → Apps Script
//  2. ลบโค้ดเดิมออกให้หมด วางโค้ดทั้งหมดนี้แทน แล้ว Save
//  3. Deploy → New deployment → เลือกไอคอนเฟือง → Web app
//     (Execute as: Me / Who has access: Anyone) → Deploy
//  4. copy URL ที่ได้ (ลงท้าย /exec) ไปแปะแทน WEB_APP_URL ในทุกหน้าเว็บที่เกี่ยวข้อง
//
//  วิธีอนุมัติรีวิว: เปิด Sheet → แท็บ "Reviews" → ติ๊กคอลัมน์ Approved แถวไหน
//  รีวิวแถวนั้นขึ้นเว็บทันทีภายในไม่กี่วินาที ไม่ต้อง deploy ใหม่
//
//  ⚠️ ครั้งแรกหลังวางโค้ดนี้ ต้องเข้า Apps Script editor เลือกฟังก์ชัน testSendMail
//  จาก dropdown ด้านบนแล้วกด Run เพื่ออนุญาตสิทธิ์ "ส่งอีเมล" ก่อน 1 ครั้ง ไม่งั้นอีเมล
//  จะส่งไม่ออก (ข้อมูลอื่นยังบันทึกได้ปกติ — เช็คสาเหตุได้ที่แท็บ "ErrorLog" ถ้าอีเมลไม่ออก)
//
//  📝 อยากแก้ "ข้อความที่ส่งหาลูกค้า" เอง ไม่ต้องรู้โค้ด? เลื่อนลงไปหาโซนที่เขียนว่า
//  "⭐ โซนแก้ข้อความที่ส่งหาลูกค้า" ด้านล่างนี้ได้เลย
// ════════════════════════════════════════════════════════════

// อีบุ๊คทั้ง 3 เล่มที่ระบบนี้รองรับ (ใช้ค่าเดียวกับที่หน้าเว็บแต่ละเล่มส่งมาผ่าน ebook)
// ถ้าไม่ส่งมาเลย (โค้ดหน้าเว็บรุ่นเก่า) จะถือว่าเป็น "ปลุกไฟในตัวมึง" ไปก่อน
var DEFAULT_EBOOK = 'ปลุกไฟในตัวมึง';

// ╔══════════════════════════════════════════════════════════╗
// ║  ⭐ โซนแก้ข้อความที่ส่งหาลูกค้า — แก้ตรงนี้ได้เลย ไม่ต้องรู้โค้ด ⭐  ║
// ║     (ผ่านโซนนี้ไปแล้วเป็นโค้ดทำงานของระบบ ไม่ต้องไปแตะ)          ║
// ╚══════════════════════════════════════════════════════════╝
//
// วิธีแก้: แก้ได้เฉพาะ "ข้อความภาษาไทย" ที่อยู่ระหว่างเครื่องหมาย ` กับ ` (backtick)
// ของแต่ละฟังก์ชันด้านล่างนี้เท่านั้น จะพิมพ์ใหม่ยาวสั้นแค่ไหนก็ได้ตามใจเลย
//
// ⚠️ ข้อควรระวัง: ส่วนที่เป็น ${...} เช่น ${name} หรือ ${amount} ห้ามลบหรือแก้ตัวอักษรข้างใน
// เพราะระบบจะเอาชื่อ/ยอดเงินจริงของลูกค้าไปแทรกตรงนั้นให้อัตโนมัติ (ลบไปข้อความจะขาดข้อมูล)
// แก้เสร็จแล้ว Save (Ctrl+S) แล้วไป Deploy → Manage deployments → New version ตามปกติ

// ① ส่งตอนลูกค้าเลือก "โดเนทตามใจ" (ไม่มีของแถม ไม่ว่ายอดเท่าไหร่)
function msgThankYouFree(name, amount) {
  return `สวัสดีเว้ยยย ${name}

ขอบคุณที่โดเนทสนับสนุน ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏
แล้วแม่งไม่เอาของแถมจากกุด้วยไง ถือว่าเป็นกำลังใจให้กูทำคลิปและทำสิ่งดีๆ แบบนี้ออกมาอีกสุดๆ เลยว่ะ🫡❤️‍🔥

ถ้าเกิดมีอะไรอยากพูดคุย สามารถทักแชทมาที่เพจได้เสมอเลยนะเว้ย ขอบใจมากอีกครั้งเว้ยยย 🤝`;
}

// ② ส่งตอนลูกค้าเลือก "โอนครั้งเดียว" แต่ยอดยังไม่ถึงขั้นรับของแถม (ต่ำกว่า 199)
function msgThankYouSingleNoReward(amount) {
  return `สวัสดีเว้ยยย

ขอบคุณที่โดเนทจำนวน ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏

แต่ยอดนี้ยังไม่ถึงจำนวนที่ได้รับของแถมนะ (จำนวนแรกคือ 199 บาท) แต่ก็ขอบคุณมากๆ เลยเว้ย

ถ้ามีคำถามหรือมีอะไรอยากคุยเพิ่มเติม ทักแชทมาที่เพจได้เลยเว้ยย 🤝`;
}

// ③ ส่งตอนลูกค้าเลือก "โอนครั้งเดียว" แล้วยอดอยู่ในช่วง 199-398 บาท (ได้แค่ริสแบนด์)
function msgThankYouSingleReward199(amount) {
  return `สวัสดีเว้ยยย

ขอบคุณที่โดเนทจำนวน ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏

ยอดนี้ได้รับของแถมนะ! จะได้รับ: 🧡 ริสแบนด์ ของช่อง มึงลองฟัง.❤️‍🔥
กูจะรีบจัดส่งให้เร็วที่สุดเลยเว้ย ประมาณ 3-7 วันตามที่อยู่ที่แจ้งไว้

ถ้ามีอะไรอยากพุูดคุยเพิ่มเติม หรือของแถมไม่มาสักที ทักแชทมาที่เพจได้เลยนะเว้ย 🤝`;
}

// ④ ส่งตอนลูกค้าเลือก "โอนครั้งเดียว" แล้วยอด 399 บาทขึ้นไป (ได้ทั้งริสแบนด์ + Planner)
function msgThankYouSingleReward399(amount) {
  return `สวัสดีเว้ยยย

ขอบคุณที่โดเนทจำนวน ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏

ยอดนี้ได้รับของแถมชุดใหญ่เลยเว้ย! จะได้รับ: 🧡 ริสแบนด์ + 💚 Planner ฟรี
กูจะรีบจัดส่งให้เร็วที่สุดเลยเว้ย ประมาณ 3-7 วันตามที่อยู่ที่แจ้งไว้ ขอบคุณสุดๆ เลยว่ะ🫡❤️‍🔥

ถ้ามีอะไรอยากพุูดคุยเพิ่มเติม หรือของแถมไม่มาสักที ทักแชทมาที่เพจได้เลยนะเว้ย 🤝`;
}

// ⑤ ส่งตอนลูกค้าเลือก "โอนสะสม" แล้วยอดสะสมรวมยังไม่ถึง 199 บาท
function msgThankYouCumulativeBelow199(name, amount, total) {
  return `สวัสดีเว้ยยย ${name}

ขอบคุณที่โดเนทรอบนี้ ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏
ตอนนี้มึงสะสมได้รวม ${total} บาทแล้ว

อีกแค่ ${199 - total} บาท ก็จะได้รับ 🧡 ริสแบนด์ แล้วนะเว้ย โอนสะสมต่อได้เรื่อยๆ เลย
จำไว้ว่าต้องใช้ชื่อ "${name}" เหมือนเดิมทุกรอบนะ

ถ้ามีคำถามหรืออยากเช็คยอดสะสม ใช้ปุ่ม "เช็คยอดสะสม" ในหน้าเว็บได้เลยเว้ย`;
}

// ⑥ ส่งตอนลูกค้าเลือก "โอนสะสม" แล้วยอดสะสมรวมอยู่ในช่วง 199-398 บาท (ได้ริสแบนด์แล้ว รอ Planner)
function msgThankYouCumulative199to398(name, amount, total) {
  return `สวัสดีเว้ยยย ${name}

ขอบคุณที่โดเนทรอบนี้ ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏
ตอนนี้มึงสะสมได้รวม ${total} บาทแล้ว

ตอนนี้ได้รับ 🧡 ริสแบนด์ แล้วนะเว้ย! อีกแค่ ${399 - total} บาท ก็จะได้ 💚 Planner เพิ่มด้วยเลย
จำไว้ว่าต้องใช้ชื่อ "${name}" เหมือนเดิมทุกรอบนะ

ถ้ามีคำถามหรืออยากเช็คยอดสะสม ใช้ปุ่ม "เช็คยอดสะสม" ในหน้าเว็บได้เลยเว้ย`;
}

// ⑦ ส่งตอนลูกค้าเลือก "โอนสะสม" แล้วยอดสะสมรวมครบ 399 บาทขึ้นไป (ได้ทั้งริสแบนด์ + Planner)
function msgThankYouCumulative399Plus(name, amount, total) {
  return `สวัสดีเว้ยยย ${name}

ขอบคุณที่โดเนทรอบนี้ ${amount} บาทนะ กูขอบคุณจากใจจริงๆ เว้ย 🙏
ตอนนี้มึงสะสมได้รวม ${total} บาทแล้ว

ครบจำนวนสูงสุดแล้วเว้ย! ได้รับ: 🧡 ริสแบนด์ + 💚 Planner ฟรี
กูจะรีบจัดส่งให้เร็วที่สุดเลยเว้ย ตามที่อยู่ที่แจ้งไว้ ขอบคุณสุดๆ เลยว่ะ🫡❤️‍🔥

ถ้ามีคำถามหรืออยากเช็คยอดสะสม ใช้ปุ่ม "เช็คยอดสะสม" ในหน้าเว็บได้เลยเว้ย`;
}

function doGet(e) {
  var action = (e.parameter.action || '').trim();
  var ebook = (e.parameter.ebook || DEFAULT_EBOOK).trim();

  try {
    if (action === 'getStats')   return jsonOut({ ok: true, readerCount: getReaderCount(ebook) });
    if (action === 'getReviews') return jsonOut({ ok: true, reviews: getApprovedReviews(ebook) });
    if (action === 'getCumulativeTotal') {
      var result = getCumulativeTotal(e.parameter.name || '');
      return jsonOut({ ok: true, total: result.total, tier: result.tier });
    }
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

    if (body.type === 'support') {
      addSupport(body, ebook);
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
  var sheet = getOrCreateSheet('Readers', ['Timestamp', 'Ebook', 'ReaderID']);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var existing = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); // Ebook, ReaderID
    for (var i = 0; i < existing.length; i++) {
      if (existing[i][0] === ebook && existing[i][1] === readerId) return; // มีอยู่แล้ว ไม่นับซ้ำ
    }
  }
  sheet.appendRow([new Date(), ebook, readerId]);
}

function getReaderCount(ebook) {
  var sheet = getOrCreateSheet('Readers', ['Timestamp', 'Ebook', 'ReaderID']);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  var data = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // Ebook
  var count = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === ebook) count++;
  }
  return count;
}

// ─── รีวิว ───

function addReview(name, rating, text, ebook) {
  var sheet = getOrCreateSheet('Reviews', ['Timestamp', 'Ebook', 'Name', 'Rating', 'Review', 'Approved']);
  sheet.appendRow([new Date(), ebook, name, rating, text, false]);
}

function getApprovedReviews(ebook) {
  var sheet = getOrCreateSheet('Reviews', ['Timestamp', 'Ebook', 'Name', 'Rating', 'Review', 'Approved']);
  var lastRow = sheet.getLastRow();
  var reviews = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    for (var i = data.length - 1; i >= 0; i--) { // ใหม่สุดขึ้นก่อน
      var row = data[i];
      if (row[1] !== ebook) continue; // ข้ามรีวิวของอีบุ๊คเล่มอื่น
      var approved = row[5] === true;
      if (approved) {
        reviews.push({ name: String(row[2] || 'ไม่ระบุชื่อ'), rating: Number(row[3]) || 5, text: String(row[4] || '') });
      }
    }
  }
  return reviews;
}

// ─── สนับสนุน / โดเนท ───

// สีพื้นหลังแถวในแท็บ Support ตามอีบุ๊คที่มาโดเนท ช่วยแยกด้วยตาว่าใครมาจากเล่มไหน
// (เพิ่มอีบุ๊คใหม่ในอนาคตได้ แค่เพิ่มบรรทัดในนี้ ถ้าไม่เจอชื่อในลิสต์จะใช้สีเทาแทน)
var EBOOK_COLORS = {
  'ปลุกไฟในตัวมึง': '#fff7ed', // ส้มอ่อน (ธีมไฟ)
  'ฮีลใจ': '#e6fffa',          // ฟ้าอมเขียวอ่อน (ธีมสงบ/เยียวยา)
  'ชีวิตที่มึงไม่เสียใจภายหลัง': '#f5f0ff' // ม่วงอ่อน (ธีมใคร่ครวญ/ไม่เสียดาย)
};

function ebookColor(ebook) {
  return EBOOK_COLORS[ebook] || '#f1f3f4';
}

function colorLastRow(sheet, ebook, numCols) {
  var rowNum = sheet.getLastRow();
  sheet.getRange(rowNum, 1, 1, numCols).setBackground(ebookColor(ebook));
}

function addSupport(body, ebook) {
  var donateType = body.donateType || 'free';
  if (donateType === 'single') return addSupportSingle(body, ebook);
  if (donateType === 'cumulative') return addSupportCumulative(body, ebook);
  return addSupportFree(body, ebook);
}

function addSupportFree(body, ebook) {
  var sheet = getOrCreateSheet('Support - โดเนทตามใจ', ['เวลา', 'อีบุ๊ค', 'ชื่อ', 'ยอดโดเนท', 'อีเมล', 'ลิงก์สลิป']);
  var slipLink = saveSlip(body);
  var amount = Number(body.amount) || 0;
  sheet.appendRow([new Date(), ebook, body.name || 'ไม่ระบุชื่อ', amount, body.email || '', slipLink]);
  colorLastRow(sheet, ebook, 6);

  sendThankYouEmail(body.email, msgThankYouFree(body.name || '', amount));
}

function addSupportSingle(body, ebook) {
  var headers = [
    'เวลา', 'อีบุ๊ค', 'ยอดโดเนท', 'ขั้นของแถม', 'สถานะ', 'อีเมล',
    'ชื่อผู้รับ', 'ที่อยู่จัดส่ง', 'เบอร์โทร', 'ลิงก์สลิป', 'ส่งของแถมแล้ว'
  ];
  var sheet = getOrCreateSheet('Support - โอนครั้งเดียว', headers);

  var amount = Number(body.amount) || 0;
  var tier = tierForAmount(amount);
  var status = tier > 0 ? '🎁 รอส่งของแถม' : 'ยังไม่ถึงขั้นรับของแถม';
  var slipLink = saveSlip(body);

  sheet.appendRow([
    new Date(), ebook, amount, tier, status, body.email || '',
    body.shipName || '', body.shipAddress || '', body.shipPhone || '',
    slipLink, false
  ]);
  colorLastRow(sheet, ebook, 11);

  if (tier > 0) {
    notifyRewardEarned({
      typeLabel: 'โอนครั้งเดียว',
      amountLabel: amount + ' บาท',
      tier: tier,
      shipName: body.shipName,
      shipAddress: body.shipAddress,
      shipPhone: body.shipPhone,
      email: body.email,
      ebook: ebook,
      slipLink: slipLink,
      sheetName: 'Support - โอนครั้งเดียว'
    });
  }

  sendThankYouEmail(body.email, tier >= 399
    ? msgThankYouSingleReward399(amount)
    : tier >= 199
    ? msgThankYouSingleReward199(amount)
    : msgThankYouSingleNoReward(amount));
}

var CUMULATIVE_SHEET_NAME = 'Support - โอนสะสม';
var CUMULATIVE_HEADERS = [
  'เวลา', 'อีบุ๊ค', 'ชื่อ', 'ยอดโอนรอบนี้', 'ยอดสะสมรวม', 'ขั้นของแถม', 'สถานะ', 'อีเมล',
  'รายละเอียดที่แจ้ง', 'ชื่อผู้รับ', 'ที่อยู่จัดส่ง', 'เบอร์โทร', 'ลิงก์สลิป', 'ส่งของแถมแล้ว'
];

function addSupportCumulative(body, ebook) {
  var sheet = getOrCreateSheet(CUMULATIVE_SHEET_NAME, CUMULATIVE_HEADERS);

  var amount = Number(body.amount) || 0;
  var name = (body.name || '').trim();
  var nameKey = name.toLowerCase();

  // รวมยอดสะสมเดิมของชื่อนี้ (รวมข้ามทุกอีบุ๊คในแท็บนี้ เพราะของแถมเป็นรางวัลกลาง ไม่แยกตามเล่ม)
  var priorTotal = sumPastAmountsByName(sheet, nameKey);
  var priorTier = tierForAmount(priorTotal);
  var total = amount + priorTotal;

  var tier = tierForAmount(total);
  var status = tier > 0 ? '🎁 ครบยอดแล้ว รอส่งของแถม' : ('🟣 สะสมได้ ' + total + ' บาท ยังไม่ครบขั้น');
  var slipLink = saveSlip(body);

  sheet.appendRow([
    new Date(), ebook, name, amount, total, tier, status, (body.email || '').trim().toLowerCase(),
    body.cumulativeNote || '', body.shipName || '', body.shipAddress || '', body.shipPhone || '',
    slipLink, false
  ]);
  colorLastRow(sheet, ebook, 14);

  // แจ้งเตือนเฉพาะตอนที่ "เพิ่งข้ามขั้น" รอบนี้ (กันอีเมลซ้ำถ้าลูกค้าที่ครบขั้นแล้วโอนสะสมต่ออีก)
  if (tier > priorTier) {
    notifyRewardEarned({
      typeLabel: 'โอนสะสม',
      amountLabel: 'สะสมรวม ' + total + ' บาท (รอบนี้โอน ' + amount + ' บาท)',
      tier: tier,
      shipName: body.shipName,
      shipAddress: body.shipAddress,
      shipPhone: body.shipPhone,
      email: body.email,
      name: name,
      ebook: ebook,
      slipLink: slipLink,
      sheetName: 'Support - โอนสะสม'
    });
  }

  sendThankYouEmail(body.email, total >= 399
    ? msgThankYouCumulative399Plus(name, amount, total)
    : total >= 199
    ? msgThankYouCumulative199to398(name, amount, total)
    : msgThankYouCumulativeBelow199(name, amount, total));
}

function sumPastAmountsByName(sheet, nameKey) {
  var total = 0;
  if (!nameKey) return total;
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues(); // Timestamp, Ebook, Name, Amount
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][2]).trim().toLowerCase() === nameKey) {
        total += Number(data[i][3]) || 0;
      }
    }
  }
  return total;
}

function getCumulativeTotal(name) {
  var sheet = getOrCreateSheet(CUMULATIVE_SHEET_NAME, CUMULATIVE_HEADERS);
  var total = sumPastAmountsByName(sheet, (name || '').trim().toLowerCase());
  return { total: total, tier: tierForAmount(total) };
}

function tierForAmount(n) {
  if (n >= 399) return 399;
  if (n >= 199) return 199;
  return 0;
}

function tierLabel(tier) {
  if (tier >= 399) return '🧡 ริสแบนด์ + 💚 Planner (ขั้น 399+)';
  if (tier >= 199) return '🧡 ริสแบนด์ (ขั้น 199+)';
  return '-';
}

// ─── แจ้งเตือนอีเมลตอนลูกค้าถึงยอดรับของแถม ───

var NOTIFY_EMAIL = 'youtrylistenx@gmail.com'; // อีเมลที่จะรับการแจ้งเตือน แก้ตรงนี้ได้ถ้าอยากเปลี่ยน

// ใช้ฟังก์ชันนี้แค่ครั้งเดียวเพื่อบังคับให้ Apps Script ขอสิทธิ์ "ส่งอีเมล" โดยเฉพาะ
// (เลือกฟังก์ชันนี้จาก dropdown ด้านบนแล้วกด Run — เพราะฟังก์ชันอื่นอย่าง getReaderCount
// ไม่ได้แตะ MailApp เลย เลยไม่เคยขอสิทธิ์ส่วนนี้มาก่อน)
function testSendMail() {
  MailApp.sendEmail(NOTIFY_EMAIL, 'ทดสอบระบบอีเมล', 'นี่คืออีเมลทดสอบจากสคริปต์ปลุกไฟในตัวมึงครับ ถ้าได้รับแปลว่าเชื่อมสิทธิ์ส่งอีเมลสำเร็จแล้ว');
}

function notifyRewardEarned(details) {
  try {
    var to = NOTIFY_EMAIL;
    var subject = '🎁 มีคนถึงยอดรับของแถม! — ' + tierLabel(details.tier);

    var lines = [
      'มีลูกค้าถึงยอดรับของแถมแล้วครับ',
      '',
      'อีบุ๊คที่มาโดเนท: ' + (details.ebook || '-'),
      'ประเภทการโดเนท: ' + details.typeLabel,
      'ยอด: ' + details.amountLabel,
      'ของแถมที่ได้รับ: ' + tierLabel(details.tier),
      ''
    ];

    if (details.name) lines.push('ชื่อที่ลูกค้าตั้งไว้ (โอนสะสม): ' + details.name);
    lines.push('อีเมลติดต่อกลับลูกค้า: ' + (details.email || '-'));
    lines.push('');
    lines.push('ชื่อผู้รับของแถม: ' + (details.shipName || '-'));
    lines.push('ที่อยู่จัดส่ง: ' + (details.shipAddress || '-'));
    lines.push('เบอร์โทร: ' + (details.shipPhone || '-'));
    lines.push('');
    lines.push('ลิงก์สลิป: ' + (details.slipLink || '-'));
    lines.push('');
    lines.push('เช็ครายละเอียดเพิ่มเติมและติ๊ก "ส่งของแถมแล้ว" ได้ในชีท แท็บ "' + details.sheetName + '"');

    MailApp.sendEmail(to, subject, lines.join('\n'));
  } catch (err) {
    // ไม่ให้การส่งอีเมลพังกระทบการบันทึกข้อมูลหลัก (ข้อมูลลง Sheet ไปแล้วก่อนหน้านี้)
    // แต่จด error ไว้ในแท็บ "ErrorLog" ให้เช็คได้ว่าทำไมส่งไม่ออก
    logNotifyError(err);
  }
}

// ─── อีเมลขอบคุณลูกค้า (ส่งหาลูกค้าทุกคน ทุกครั้งที่โดเนท ไม่ว่าประเภทไหน) ───

function sendThankYouEmail(email, bodyText) {
  if (!email) return; // ไม่มีอีเมลลูกค้าก็ส่งไม่ได้ ข้ามไปเงียบๆ
  try {
    MailApp.sendEmail(email, '❤️‍🔥 ขอบคุณที่สนับสนุนมึงลองฟัง.❤️‍🔥 นะครับ', bodyText);
  } catch (err) {
    logNotifyError(err);
    notifyThankYouEmailFailed(email, err);
  }
}

// ส่งอีเมลขอบคุณลูกค้าไม่สำเร็จ (เช่น พิมพ์อีเมลผิด) — แจ้งเตือนแอดมินทันที จะได้ติดต่อลูกค้าเองได้
function notifyThankYouEmailFailed(customerEmail, err) {
  try {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      '⚠️ ส่งอีเมลขอบคุณลูกค้าไม่สำเร็จ',
      'มีลูกค้าโดเนทเข้ามาแล้ว แต่ระบบส่งอีเมลขอบคุณกลับไปหาเขาไม่สำเร็จครับ\n\n' +
      'อีเมลลูกค้า: ' + (customerEmail || '-') + '\n' +
      'สาเหตุ: ' + ((err && err.message) || err) + '\n\n' +
      'รบกวนเช็คในชีท (แท็บ Support ที่เกี่ยวข้อง) แล้วติดต่อลูกค้าคนนี้เองโดยตรงแทนนะครับ ' +
      '(ข้อมูลการโดเนทของเขายังบันทึกลงชีทปกติ ไม่ได้หายไปไหน)'
    );
  } catch (err2) {
    // ถ้าแม้แต่อีเมลแจ้งเตือนก็ส่งไม่ได้ (เช่น โควต้าอีเมลของสคริปต์หมดทั้งระบบ) ก็ได้แค่จด log ไว้
    logNotifyError(err2);
  }
}

function logNotifyError(err) {
  try {
    var sheet = getOrCreateSheet('ErrorLog', ['เวลา', 'ข้อความ error']);
    sheet.appendRow([new Date(), String((err && err.message) || err)]);
  } catch (e2) {
    // เงียบไปเลยถ้าแม้แต่การจด log ยัง error (กันพังซ้อนพัง)
  }
}

function saveSlip(body) {
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
    if (name === 'Reviews') {
      // เตรียมคอลัมน์ Approved (F) ให้เป็น checkbox ไว้ล่วงหน้า 998 แถว
      // (ทำครั้งเดียวตอนสร้างชีต แทนที่จะทำทุกครั้งที่มีคนส่งรีวิว จะได้ไม่หน่วง)
      sheet.getRange(2, 6, 998, 1).insertCheckboxes();
    }
  }
  return sheet;
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
