/**
 * ป้องกันการพิมพ์อักขระที่ไม่ต้องการใน input[type="number"]
 * ใช้: onKeyDown={blockInvalidNumKey}
 */
export const blockInvalidNumKey = (e) => {
  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
};

/**
 * กรองค่าให้เหลือเฉพาะตัวเลขและทศนิยม (ป้องกัน paste ข้อความ)
 * allowDecimal: true = อนุญาต . หนึ่งตัว (เช่น 45.50)
 */
export const sanitizeNumberInput = (value, allowDecimal = true) => {
  let s = String(value ?? '').replace(/[^0-9.]/g, '');
  if (allowDecimal) {
    const parts = s.split('.');
    if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  } else {
    s = s.replace(/\./g, '');
  }
  return s;
};

const ONES = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const PLACES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

function groupToWords(numStr) {
  const s = numStr.replace(/^0+/, '') || '0';
  if (s === '0') return '';
  let res = '';
  const len = s.length;
  for (let i = 0; i < len; i++) {
    const d = parseInt(s[i], 10);
    const place = len - 1 - i;
    if (d === 0) continue;
    if (place === 1 && d === 1) {
      res += 'สิบ';
    } else if (place === 1 && d === 2) {
      res += 'ยี่สิบ';
    } else if (place === 0 && d === 1 && len > 1) {
      res += 'เอ็ด';
    } else {
      res += ONES[d] + (place > 0 ? PLACES[place] : '');
    }
  }
  return res;
}

export function bahtToText(amount) {
  if (amount == null || isNaN(Number(amount))) return '';
  const num = parseFloat(amount);
  const fixed = Math.abs(num).toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  const intNum = parseInt(intPart, 10);
  let result = '';

  if (intNum === 0) {
    result = 'ศูนย์';
  } else {
    const millions = Math.floor(intNum / 1000000);
    const remainder = intNum % 1000000;
    if (millions > 0) {
      result += groupToWords(String(millions)) + 'ล้าน';
    }
    if (remainder > 0) {
      result += groupToWords(String(remainder));
    }
  }

  result += 'บาท';

  const satang = parseInt(decPart, 10);
  if (satang > 0) {
    result += groupToWords(String(satang).padStart(2, '0')) + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }

  if (num < 0) result = 'ลบ' + result;
  return result;
}
