// Backend chưa có trường riêng cho trường ĐH / giới tính / giờ giấc / thói quen,
// nên lưu chúng thành các dòng "#key: value" ở cuối phần mô tả và đọc lại khi hiển thị.
const KEYS = ['truong', 'gioitinh', 'giogiac', 'thoiquen'];
const SEP = '\n---\n';

export function encodeDescription(text, meta) {
  const lines = KEYS.filter((k) => meta[k] && String(meta[k]).trim()).map((k) => `#${k}: ${String(meta[k]).trim()}`);
  return lines.length ? `${(text || '').trim()}${SEP}${lines.join('\n')}` : (text || '').trim();
}

export function decodeDescription(raw) {
  const [text = '', metaPart = ''] = (raw || '').split(SEP);
  const meta = {};
  metaPart.split('\n').forEach((l) => {
    const m = l.match(/^#(\w+):\s*(.*)$/);
    if (m && KEYS.includes(m[1])) meta[m[1]] = m[2];
  });
  return { text: text.trim(), meta };
}

export const money = (n) => (Number(n) || 0).toLocaleString('vi-VN') + ' đ';

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export function hhmm(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
