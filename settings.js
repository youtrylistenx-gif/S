/* ╔══════════════════════════════════════════════════════════════╗
   ║         settings.js — แก้ที่นี่ที่เดียว ทุกหน้าเปลี่ยนตาม        ║
   ╚══════════════════════════════════════════════════════════════╝

   วิธีใช้: เปลี่ยนค่า แล้วกด Save ไฟล์ — ทุกหน้าจะอัปเดตทันที
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


/* ┌──────────────────────────────────────────────────────────────┐
   │  1. โปรโมชั่นที่เปิดอยู่ตอนนี้                                  │
   └──────────────────────────────────────────────────────────────┘
   เปลี่ยนค่าบรรทัดเดียว ราคาและรูปแบบทุกหน้าจะเปลี่ยนตาม

   'flash'    →  โปรแฟลชเซล   ราคา ฿399.-   (ไม่จำกัดจำนวน)
   '50first'  →  โปร 20 คนแรก ราคา ฿299.-   (จำกัด 20 สิทธิ์) */

var ACTIVE_PROMO = '50first';


/* ┌──────────────────────────────────────────────────────────────┐
   │  2. ราคาของแต่ละโปร                                           │
   └──────────────────────────────────────────────────────────────┘
   priceNew    = ราคาที่ขาย
   priceOld    = ราคาเต็ม (แสดงขีดทับ)
   slotsTotal  = สิทธิ์ทั้งหมด  (ใส่ null ถ้าไม่มีการจำกัดจำนวน)
   slotsUsed   = สิทธิ์ที่ขายไปแล้ว                               */

var PROMOS = {
  '50first': {
    priceNew:    299,
    priceOld:    1490,
    slotsTotal:  20,
    slotsUsed:   15,
    checkoutUrl: 'checkout.html?mode=50first',
    isFlash:     false,
  },
  'flash': {
    priceNew:    399,
    priceOld:    1490,
    slotsTotal:  null,
    slotsUsed:   null,
    checkoutUrl: 'checkout.html?mode=flash',
    isFlash:     true,
  },
};


/* ┌──────────────────────────────────────────────────────────────┐
   │  3. ส่วน "ทำไมต้องซื้อ?" ในหน้าแพรนเนอร์                      │
   └──────────────────────────────────────────────────────────────┘
   true  → แสดงส่วนนี้ในหน้าแพรนเนอร์
   false → ซ่อน                                                  */

var SHOW_WHY_SECTION = false;


/* ┌──────────────────────────────────────────────────────────────┐
   │  4. ชื่อแบรนด์ใต้โลโก้  "มึงลองฟัง.❤️‍🔥"                        │
   └──────────────────────────────────────────────────────────────┘
   true  → แสดงชื่อใต้โลโก้ทุกหน้า
   false → ซ่อนชื่อ  (ไอคอนโลโก้ยังแสดงอยู่ แค่ซ่อนตัวหนังสือ)  */

var LOGO_NAME_ENABLED = false;


/* ┌──────────────────────────────────────────────────────────────┐
   │  5. ป้อปอัพ "มีคนกำลังดูหน้านี้อยู่ X คน"                     │
   └──────────────────────────────────────────────────────────────┘
   true  → เปิดป้อปอัพทุกหน้า
   false → ปิดป้อปอัพทุกหน้า (ไม่แสดงเลย)                        */

var POPUP_ENABLED = false;

/*   จำนวนคนดู: สุ่มตัวเลขระหว่าง MIN ถึง MAX
     เช่น 0 ถึง 15 = แสดงตัวเลข 0, 1, 2 ... ถึง 15 คน            */
var POPUP_COUNT_MIN = 0;
var POPUP_COUNT_MAX = 15;

/*   ความถี่ในการเปลี่ยนตัวเลข  (มิลลิวินาที = วินาที × 1000)
     10000 = ทุก 10 วินาที  │  5000 = ทุก 5 วินาที               */
var POPUP_INTERVAL_MS = 10000;


/* ┌──────────────────────────────────────────────────────────────┐
   │  6. จำนวนผู้ใช้งาน Planner ตอนนี้                              │
   └──────────────────────────────────────────────────────────────┘
   แก้ตัวเลขที่นี่ที่เดียว — ทุกหน้าจะอัปเดตพร้อมกันทันที            */

var ACTIVE_USERS = 870;


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ไม่ต้องแก้ใต้บรรทัดนี้
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

var PRICE_CONFIG = PROMOS[ACTIVE_PROMO] || PROMOS['50first'];

/* ── คำนวณ % ส่วนลด ── */
function calcDiscount(n, o) {
  if (!o || o <= n) return '';
  return '-' + (Math.round((o - n) / o * 1000) / 10) + '%';
}

/* ── นับถอยหลัง flash timer ── */
function startFlashTimer(elId) {
  var el = document.getElementById(elId);
  if (!el) return;
  function tick() {
    var diff = 3600000 - (Date.now() % 3600000);
    var m = Math.floor(diff / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = 'แฟลชเซล⚡ 0 : ' + String(m).padStart(2,'0') + ' : ' + String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

/* ── อัปเดตราคา/สล็อตทุก element ในหน้าที่มีอยู่ ── */
function applyPriceConfig(cfg) {
  var c    = cfg || PRICE_CONFIG;
  var pNew = '฿' + c.priceNew + '.-';
  var pOld = '฿' + c.priceOld.toLocaleString() + '.-';
  var disc = calcDiscount(c.priceNew, c.priceOld);
  var sT   = c.slotsTotal || 10;
  var sU   = c.slotsUsed  || 5;
  var left = sT - sU;
  var pct  = Math.min(100, Math.round(sU / sT * 100));

  document.querySelectorAll('[data-price-discount]').forEach(function(el) { el.textContent = disc; });
  document.querySelectorAll('[data-price-new]').forEach(function(el) { el.textContent = pNew; });
  document.querySelectorAll('[data-price-old]').forEach(function(el) { el.textContent = pOld; });
  document.querySelectorAll('[data-slots-total]').forEach(function(el) { el.textContent = sT + ' คน'; });
  document.querySelectorAll('[data-slots-count]').forEach(function(el) { el.textContent = sU + '/' + sT; });
  document.querySelectorAll('[data-slots-badge]').forEach(function(el) { el.textContent = '🔥 เหลือเพียงแค่ ' + left + ' สิทธิ์สุดท้าย!'; });
  document.querySelectorAll('[data-slots-bar]').forEach(function(el) { el.style.width = pct + '%'; });
  document.querySelectorAll('[data-checkout-url]').forEach(function(el) { el.href = c.checkoutUrl; });
  document.querySelectorAll('[data-slots-section]').forEach(function(el) { el.style.display = c.isFlash ? 'none' : ''; });
  document.querySelectorAll('[data-flash-only]').forEach(function(el) { el.style.display = c.isFlash ? '' : 'none'; });
  document.querySelectorAll('[data-active-users]').forEach(function(el) { el.textContent = ACTIVE_USERS; });

  var idxBadge = document.getElementById('planner-badge');
  var idxPrice = document.getElementById('planner-price');
  var idxOld   = document.getElementById('planner-old');
  if (idxBadge) idxBadge.textContent = disc;
  if (idxPrice) idxPrice.textContent = pNew;
  if (idxOld)   idxOld.textContent   = pOld;

  var timer1   = document.getElementById('timer1');
  var idxSlots = document.getElementById('idx-slots-wrap');
  if (timer1)   timer1.style.display   = c.isFlash ? 'block' : 'none';
  if (idxSlots) idxSlots.style.display = c.isFlash ? 'none' : 'block';

  if (!c.isFlash) {
    var fill  = document.getElementById('idx-slots-bar-fill');
    var count = document.getElementById('idx-slots-count');
    var total = document.getElementById('idx-slots-total');
    var badge = document.getElementById('idx-slots-badge');
    if (fill)  fill.style.width  = pct + '%';
    if (count) count.textContent = sU + '/' + sT;
    if (total) total.textContent = sT + ' คน';
    if (badge) badge.textContent = '🔥 เหลืออีกแค่ ' + left + ' สิทธิ์สุดท้าย!';
  }

  var oldPriceEl = document.getElementById('old-price');
  var discAmtEl  = document.getElementById('discount-amount');
  var finalPrEl  = document.getElementById('final-price');
  var flashBadge = document.getElementById('flash-sale-text');
  if (oldPriceEl) oldPriceEl.textContent = '฿' + c.priceOld.toLocaleString();
  if (discAmtEl)  discAmtEl.textContent  = '- ฿' + (c.priceOld - c.priceNew).toLocaleString();
  if (finalPrEl)  finalPrEl.textContent  = '฿' + c.priceNew;
  if (flashBadge) flashBadge.style.display = c.isFlash ? 'inline-flex' : 'none';

  if (c.isFlash) {
    startFlashTimer('timer1');
    startFlashTimer('flash-sale-text');
  }
}

/* ── ชื่อแบรนด์ + ป้อปอัพ ── */
(function () {
  function applyLogoName() {
    var el = document.querySelector('.logo-name');
    if (el) el.style.display = LOGO_NAME_ENABLED ? '' : 'none';
  }

  if (!POPUP_ENABLED) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyLogoName);
    } else {
      applyLogoName();
    }
    return;
  }

  var currentNum = 0;
  var useA = true;

  var css = document.createElement('style');
  css.textContent =
    '#user-count-wrap{display:inline-block;overflow:hidden;height:1.2em;' +
    'vertical-align:-0.15em;position:relative;min-width:1.8ch;}' +
    '#user-count-a,#user-count-b{display:block;position:absolute;' +
    'width:100%;text-align:center;font-weight:700;line-height:1.2em;}';
  document.head.appendChild(css);

  function init() {
    applyLogoName();
    var popup = document.getElementById('live-users-popup');
    if (!popup) return;
    popup.style.display = 'block';
    currentNum = Math.floor(
      Math.random() * (POPUP_COUNT_MAX - POPUP_COUNT_MIN + 1)
    ) + POPUP_COUNT_MIN;
    var countEl = document.getElementById('user-count');
    if (countEl) {
      var wrap = document.createElement('span');
      wrap.id = 'user-count-wrap';
      var a = document.createElement('span');
      a.id = 'user-count-a';
      a.style.transform = 'translateY(0)';
      a.textContent = currentNum;
      var b = document.createElement('span');
      b.id = 'user-count-b';
      b.style.transform = 'translateY(100%)';
      wrap.appendChild(a);
      wrap.appendChild(b);
      countEl.parentNode.replaceChild(wrap, countEl);
    }
    setInterval(roll, POPUP_INTERVAL_MS);
  }

  function roll() {
    var wrap = document.getElementById('user-count-wrap');
    if (!wrap) return;
    var newNum;
    do {
      newNum = Math.floor(
        Math.random() * (POPUP_COUNT_MAX - POPUP_COUNT_MIN + 1)
      ) + POPUP_COUNT_MIN;
    } while (newNum === currentNum && POPUP_COUNT_MAX > POPUP_COUNT_MIN);
    var goUp = newNum > currentNum;
    var cur = document.getElementById(useA ? 'user-count-a' : 'user-count-b');
    var nxt = document.getElementById(useA ? 'user-count-b' : 'user-count-a');
    nxt.textContent = newNum;
    nxt.style.transition = 'none';
    nxt.style.transform = goUp ? 'translateY(100%)' : 'translateY(-100%)';
    wrap.offsetHeight;
    var ease = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
    cur.style.transition = ease;
    nxt.style.transition = ease;
    cur.style.transform = goUp ? 'translateY(-100%)' : 'translateY(100%)';
    nxt.style.transform = 'translateY(0)';
    currentNum = newNum;
    useA = !useA;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

/* ── อัปเดตจำนวนผู้ใช้งานทุกหน้าอัตโนมัติ ── */
(function () {
  function run() {
    document.querySelectorAll('[data-active-users]').forEach(function(el) {
      el.textContent = ACTIVE_USERS;
    });
  }
  // script โหลดท้าย body — DOM พร้อมแล้ว เรียกตรงได้เลย
  run();
  // fallback กรณีโหลดจาก <head> หรือ async
  document.addEventListener('DOMContentLoaded', run);
}());
