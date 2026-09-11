// ════════════════════════════════════════════════════════════
//  สคริปต์อัปเดตจำนวนผู้อ่านใน settings.js อัตโนมัติ
//
//  วิธีใช้: เปิด PowerShell/Terminal ในโฟลเดอร์นี้ แล้วรัน
//      node update-reader-counts.mjs
//  สคริปต์จะไปดึงจำนวนผู้อ่านจริงล่าสุดจากชีท (ผ่าน Apps Script เดียวกับที่
//  หน้าเว็บใช้อยู่) มาแก้ตัวเลขใน settings.js ให้เองทั้ง 3 เล่ม
//  จากนั้น Save (ไฟล์จะถูกเขียนทับให้อัตโนมัติ) แล้ว push ขึ้น GitHub ตามปกติ
//
//  รันเมื่อไหร่ก็ได้ตามใจ — แนะนำให้รันก่อน push ทุกครั้งที่อยากให้ตัวเลขบนเว็บล่าสุด
// ════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from 'fs';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyxvA7Oihjtqois1eLutGg_Orq5pM1AFbtd8EeV_yGjTCREfKAIZbbYdPwz44QAqgiT/exec';

const BOOKS = [
  { ebook: 'ปลุกไฟในตัวมึง', varName: 'PLUKFAI_READERS' },
  { ebook: 'ฮีลใจ', varName: 'HEALJAI_READERS' },
  { ebook: 'ชีวิตที่มึงไม่เสียใจภายหลัง', varName: 'CHIWIT_READERS' },
];

const SETTINGS_PATH = new URL('./settings.js', import.meta.url);

async function getReaderCount(ebook) {
  const url = WEB_APP_URL + '?action=getStats&ebook=' + encodeURIComponent(ebook);
  const res = await fetch(url);
  const data = await res.json();
  if (!data || !data.ok) throw new Error('backend ตอบว่า ok:false');
  return data.readerCount;
}

async function main() {
  let settingsText = readFileSync(SETTINGS_PATH, 'utf8');
  console.log('กำลังดึงจำนวนผู้อ่านล่าสุดจากชีท...\n');

  for (const book of BOOKS) {
    try {
      const count = await getReaderCount(book.ebook);
      const pattern = new RegExp('var ' + book.varName + ' = \\d+;');
      const oldMatch = settingsText.match(pattern);
      const oldValue = oldMatch ? oldMatch[0].match(/\d+/)[0] : '?';

      if (!pattern.test(settingsText)) {
        console.log('⚠️  ไม่เจอตัวแปร ' + book.varName + ' ใน settings.js — ข้ามเล่มนี้ไป');
        continue;
      }

      settingsText = settingsText.replace(pattern, 'var ' + book.varName + ' = ' + count + ';');
      console.log(book.ebook + '  (' + book.varName + '):  ' + oldValue + '  →  ' + count);
    } catch (err) {
      console.log('⚠️  ดึงจำนวนผู้อ่านของ "' + book.ebook + '" ไม่สำเร็จ: ' + err.message + ' (ข้ามเล่มนี้ไป ค่าเดิมยังอยู่)');
    }
  }

  writeFileSync(SETTINGS_PATH, settingsText, 'utf8');
  console.log('\n✅ อัปเดต settings.js เรียบร้อยแล้วครับ — เหลือแค่ push ขึ้น GitHub ตามปกติ');
}

main().catch((err) => {
  console.error('เกิดข้อผิดพลาด:', err);
  process.exit(1);
});
