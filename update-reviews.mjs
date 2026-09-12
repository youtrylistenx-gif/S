// ════════════════════════════════════════════════════════════
//  สคริปต์อัปเดตรีวิวในหน้าอ่านอีบุ๊คทั้ง 3 เล่ม ให้เป็น static
//
//  วิธีใช้: เปิด PowerShell/Terminal ในโฟลเดอร์นี้ แล้วรัน
//      node update-reviews.mjs
//  สคริปต์จะไปดึงรีวิวที่อนุมัติแล้วล่าสุดจากชีท มาฝังเป็น HTML ตรงๆ
//  ในแต่ละหน้าอีบุ๊ค แทนที่จะให้หน้าเว็บไปดึงสดตอนเปิด (ซึ่งทำให้ช้า)
//  จากนั้น Save (ไฟล์ถูกเขียนทับให้อัตโนมัติ) แล้ว push ขึ้น GitHub ตามปกติ
//  (หรือกดผ่านปุ่ม GitHub Actions บนมือถือก็ได้ ถ้าตั้งค่าไว้แล้ว)
// ════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from 'fs';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyxvA7Oihjtqois1eLutGg_Orq5pM1AFbtd8EeV_yGjTCREfKAIZbbYdPwz44QAqgiT/exec';

const VISIBLE_COUNT = 5; // จำนวนรีวิวที่โชว์ทันที ที่เหลือซ่อนไว้หลังปุ่ม "ดูเพิ่มเติม"

const BOOKS = [
  { ebook: 'ปลุกไฟในตัวมึง', file: 'ebook-plukfai.html' },
  { ebook: 'ฮีลใจ', file: 'ebook-healjai-read.html' },
  { ebook: 'ชีวิตที่มึงไม่เสียใจภายหลัง', file: 'ebook-chiwit-read.html' },
];

const START_MARKER = '<!-- REVIEWS:START (ฝังไว้ล่วงหน้าโดย update-reviews.mjs ห้ามแก้มือ รันสคริปต์แทน) -->';
const END_MARKER = '<!-- REVIEWS:END -->';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildReviewsBlock(reviews) {
  if (!reviews || !reviews.length) {
    return START_MARKER + '\n' +
      '  <div class="reviews-display-section" id="reviews-display-section" style="display:none">\n' +
      '    <p class="reviews-display-heading">รีวิวจากผู้อ่านจริง</p>\n' +
      '    <div class="review-stars-summary" id="review-stars-summary"></div>\n' +
      '    <div class="reviews-list" id="reviews-list"></div>\n' +
      '  </div>\n' +
      '  ' + END_MARKER;
  }

  const totalRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
  const avg = totalRating / reviews.length;
  const starCount = Math.max(1, Math.min(5, Math.round(avg)));
  const summaryText = avg.toFixed(1) + '/5 ' + '⭐'.repeat(starCount) + ' (' + reviews.length + ' รีวิว)';

  const cardsHtml = reviews.map((rev, i) => {
    const rating = Math.max(1, Math.min(5, Number(rev.rating) || 5));
    const stars = '⭐'.repeat(rating);
    const name = escapeHtml(rev.name || 'ไม่ระบุชื่อ');
    const text = escapeHtml(rev.text || '');
    const hiddenClass = i >= VISIBLE_COUNT ? ' review-hidden' : '';
    return '      <div class="review-card' + hiddenClass + '">\n' +
      '        <div class="review-card-top"><span class="review-card-name">' + name + '</span><span class="review-card-stars">' + stars + '</span></div>\n' +
      '        <div class="review-card-text">' + text + '</div>\n' +
      '      </div>';
  }).join('\n');

  let moreBtnHtml = '';
  if (reviews.length > VISIBLE_COUNT) {
    const hiddenCount = reviews.length - VISIBLE_COUNT;
    moreBtnHtml = '\n    <button type="button" class="btn-show-more-reviews" id="btn-show-more-reviews">⬇️ ดูรีวิวเพิ่มเติมอีก ' + hiddenCount + ' รายการ</button>';
  }

  return START_MARKER + '\n' +
    '  <div class="reviews-display-section" id="reviews-display-section" style="display:block">\n' +
    '    <p class="reviews-display-heading">รีวิวจากผู้อ่านจริง</p>\n' +
    '    <div class="review-stars-summary" id="review-stars-summary">' + summaryText + '</div>\n' +
    '    <div class="reviews-list" id="reviews-list">\n' + cardsHtml + '\n    </div>' + moreBtnHtml + '\n' +
    '  </div>\n' +
    '  ' + END_MARKER;
}

async function getReviews(ebook) {
  const url = WEB_APP_URL + '?action=getReviews&ebook=' + encodeURIComponent(ebook);
  const res = await fetch(url);
  const data = await res.json();
  if (!data || !data.ok) throw new Error('backend ตอบว่า ok:false');
  return data.reviews || [];
}

async function main() {
  console.log('กำลังดึงรีวิวล่าสุดจากชีท...\n');

  for (const book of BOOKS) {
    const filePath = new URL('./' + book.file, import.meta.url);
    try {
      const reviews = await getReviews(book.ebook);
      const newBlock = buildReviewsBlock(reviews);

      let html = readFileSync(filePath, 'utf8');
      const pattern = new RegExp(
        START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );

      if (!pattern.test(html)) {
        console.log('⚠️  ไม่เจอจุดฝังรีวิวใน ' + book.file + ' — ข้ามไฟล์นี้ไป');
        continue;
      }

      html = html.replace(pattern, newBlock);
      writeFileSync(filePath, html, 'utf8');
      console.log(book.ebook + '  (' + book.file + '):  ฝังรีวิวแล้ว ' + reviews.length + ' รายการ');
    } catch (err) {
      console.log('⚠️  ดึงรีวิวของ "' + book.ebook + '" ไม่สำเร็จ: ' + err.message + ' (ข้ามเล่มนี้ไป ไฟล์เดิมยังอยู่)');
    }
  }

  console.log('\n✅ อัปเดตรีวิวเรียบร้อยแล้วครับ — เหลือแค่ push ขึ้น GitHub ตามปกติ');
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exit(1);
});
