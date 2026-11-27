/**
 * Utility functions for billing, banking and VietQR in Roomily
 */

export const VIETNAM_BANKS = [
  { code: 'MB', name: 'MBBank (Ngân hàng Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank (Ngoại Thương Việt Nam)' },
  { code: 'TCB', name: 'Techcombank (Kỹ Thương Việt Nam)' },
  { code: 'BIDV', name: 'BIDV (Đầu tư và Phát triển VN)' },
  { code: 'ICB', name: 'VietinBank (Công Thương Việt Nam)' },
  { code: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'TPB', name: 'TPBank (Tiên Phong)' },
  { code: 'VBA', name: 'Agribank (Nông nghiệp & PTNT)' },
  { code: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { code: 'HDB', name: 'HDBank (Phát triển TP.HCM)' },
  { code: 'OCB', name: 'OCB (Phương Đông)' },
  { code: 'MSB', name: 'MSB (Hàng Hải Việt Nam)' },
  { code: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)' },
  { code: 'VIB', name: 'VIB (Quốc tế Việt Nam)' },
];

export const formatMoney = (n) => {
  return (Number(n) || 0).toLocaleString('vi-VN') + ' đ';
};

/**
 * Đọc số tiền thành chữ Tiếng Việt
 */
export const numberToWordsVN = (num) => {
  if (!num || isNaN(num) || num <= 0) return 'Không đồng';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const readGroup = (n) => {
    let h = Math.floor(n / 100);
    let t = Math.floor((n % 100) / 10);
    let o = n % 10;
    let res = '';
    if (h > 0) res += digits[h] + ' trăm ';
    if (t > 1) {
      res += digits[t] + ' mươi ';
      if (o === 1) res += 'mốt ';
      else if (o === 5) res += 'lăm ';
      else if (o > 0) res += digits[o] + ' ';
    } else if (t === 1) {
      res += 'mười ';
      if (o === 5) res += 'lăm ';
      else if (o > 0) res += digits[o] + ' ';
    } else if (t === 0 && o > 0) {
      if (h > 0) res += 'lẻ ';
      res += digits[o] + ' ';
    }
    return res.trim();
  };

  let str = Math.floor(num).toString();
  let groups = [];
  while (str.length > 0) {
    groups.unshift(parseInt(str.slice(-3), 10));
    str = str.slice(0, -3);
  }

  let words = [];
  for (let i = 0; i < groups.length; i++) {
    let g = groups[i];
    let unitIdx = groups.length - 1 - i;
    if (g > 0) {
      let gRead = readGroup(g);
      words.push(gRead + (units[unitIdx] ? ' ' + units[unitIdx] : ''));
    }
  }

  let result = words.join(' ').trim() + ' đồng';
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * Sinh URL mã QR VietQR Napas247
 */
export const generateVietQrUrl = ({ bankCode, bankAccount, amount, addInfo, accountName }) => {
  const bank = bankCode || 'MB';
  const account = bankAccount || '0000000000';
  const totalAmount = Math.max(0, Math.round(Number(amount) || 0));
  const noteEncoded = encodeURIComponent(addInfo || 'THANHTOANTIENPHONG');
  const nameEncoded = encodeURIComponent(accountName || '');

  return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${totalAmount}&addInfo=${noteEncoded}&accountName=${nameEncoded}`;
};
