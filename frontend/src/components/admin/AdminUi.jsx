import React, { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export const PURPLE = "#8B5CF6";

export const cardStyle = {
  background: "white",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  background: "white",
  color: "#0F172A",
};

export const buttonStyle = (variant = "default", extra = {}) => {
  const variants = {
    default: { background: "white", color: "#334155", border: "1px solid #E2E8F0" },
    primary: { background: PURPLE, color: "white", border: `1px solid ${PURPLE}` },
    success: { background: "#16A34A", color: "white", border: "1px solid #16A34A" },
    danger: { background: "#DC2626", color: "white", border: "1px solid #DC2626" },
    warning: { background: "#F59E0B", color: "white", border: "1px solid #F59E0B" },
    ghostDanger: { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" },
  };
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    ...variants[variant],
    ...extra,
  };
};

const BADGES = {
  // Khu trọ
  ACTIVE: { label: "Hoạt động", color: "#15803D", bg: "#DCFCE7" },
  HIDDEN: { label: "Đang ẩn", color: "#B45309", bg: "#FEF3C7" },
  // Kiểm duyệt bài đăng
  PENDING: { label: "Chờ duyệt", color: "#B45309", bg: "#FEF3C7" },
  APPROVED: { label: "Đã duyệt", color: "#15803D", bg: "#DCFCE7" },
  REJECTED: { label: "Bị từ chối", color: "#B91C1C", bg: "#FEE2E2" },
  // Bài đăng do chủ trọ đóng
  CLOSED: { label: "Đã đóng", color: "#475569", bg: "#F1F5F9" },
  // Trạng thái phòng
  AVAILABLE: { label: "Trống", color: "#15803D", bg: "#DCFCE7" },
  OCCUPIED: { label: "Đang thuê", color: "#1D4ED8", bg: "#DBEAFE" },
  MAINTENANCE: { label: "Bảo trì", color: "#B45309", bg: "#FEF3C7" },
};

export const StatusBadge = ({ status, label }) => {
  const b = BADGES[status] || { label: status, color: "#475569", bg: "#F1F5F9" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: b.color,
        backgroundColor: b.bg,
        whiteSpace: "nowrap",
      }}
    >
      {label || b.label}
    </span>
  );
};

export const PageHeader = ({ icon, title, subtitle, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        {title}
      </h1>
      {subtitle && <p style={{ color: "#64748B", margin: "4px 0 0 0", fontSize: 14 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Spinner = ({ label = "Đang tải..." }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 40, color: "#64748B" }}>
    <Loader2 size={18} style={{ animation: "adminSpin 1s linear infinite" }} />
    <span>{label}</span>
    <style>{"@keyframes adminSpin{to{transform:rotate(360deg)}}"}</style>
  </div>
);

export const EmptyState = ({ message = "Không có dữ liệu" }) => (
  <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>{message}</div>
);

/** Modal nền mờ, đóng bằng Esc hoặc click nền. */
export const Modal = ({ open, onClose, title, width = 560, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh",
          display: "flex", flexDirection: "column", boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #E2E8F0" }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#0F172A" }}>{title}</h3>
          <button onClick={onClose} aria-label="Đóng" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Dialog xác nhận trước khi thực hiện hành động nguy hiểm.
 * Nếu truyền `reasonLabel`, dialog có ô nhập lý do (bắt buộc khi `reasonRequired`).
 */
export const ConfirmDialog = ({
  open, onClose, onConfirm, title, message, confirmText = "Xác nhận", variant = "danger",
  loading = false, reasonLabel, reasonRequired = false, reasonPlaceholder, reason = "", onReasonChange,
}) => {
  const missingReason = reasonRequired && !reason.trim();
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      width={460}
      footer={
        <>
          <button style={buttonStyle("default")} onClick={onClose} disabled={loading}>Hủy</button>
          <button
            style={buttonStyle(variant, { opacity: loading || missingReason ? 0.6 : 1 })}
            onClick={onConfirm}
            disabled={loading || missingReason}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, fontSize: 14 }}>{message}</p>
      {reasonLabel && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#334155" }}>
            {reasonLabel} {reasonRequired && <span style={{ color: "#DC2626" }}>*</span>}
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={reason}
            placeholder={reasonPlaceholder}
            onChange={(e) => onReasonChange?.(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      )}
    </Modal>
  );
};

/** Phân trang theo Spring Page (page bắt đầu từ 0). */
export const Pagination = ({ page, totalPages, totalElements, onChange }) => {
  if (!totalPages || totalPages < 1) return null;
  const pages = [];
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  for (let i = start; i < Math.min(totalPages, start + 5); i++) pages.push(i);

  const btn = (active, disabled) =>
    buttonStyle(active ? "primary" : "default", { padding: "6px 11px", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" });

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #E2E8F0", flexWrap: "wrap", gap: 10 }}>
      <span style={{ fontSize: 13, color: "#64748B" }}>
        Trang {page + 1} / {totalPages} · Tổng {totalElements ?? 0} mục
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={btn(false, page === 0)} disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Trang trước">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button key={p} style={btn(p === page, false)} onClick={() => onChange(p)}>{p + 1}</button>
        ))}
        <button style={btn(false, page >= totalPages - 1)} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Trang sau">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Chuyển lỗi từ axios interceptor thành thông báo dễ hiểu.
 * Lỗi không có `message` (vd 404 mặc định của Spring/Gateway) nghĩa là đường dẫn API chưa tồn tại
 * -> thường do API Gateway hoặc service chưa được build lại / khởi động lại với code mới.
 */
export const errorMessage = (err, fallback = "Thao tác thất bại") => {
  if (!err) return fallback;
  if (err.message === "Network Error") {
    return "Không kết nối được tới máy chủ (API Gateway http://localhost:8080). Hãy kiểm tra các service đã chạy chưa.";
  }
  if (err.message && typeof err.message === "string") return err.message;
  if (err.status === 404) {
    return `${fallback}: API không tồn tại (HTTP 404${err.path ? " " + err.path : ""}). Hãy build lại và khởi động lại API Gateway + service tương ứng.`;
  }
  if (err.status) return `${fallback} (HTTP ${err.status}${err.error ? " " + err.error : ""})`;
  return fallback;
};

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export const formatVnd = (v) => `${Number(v || 0).toLocaleString("vi-VN")}đ`;

/** Debounce giá trị để ô tìm kiếm không gọi API mỗi phím gõ. */
export const useDebounced = (value, delay = 400) => {
  const [v, setV] = React.useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};
