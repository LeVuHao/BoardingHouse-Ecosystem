import React from "react";
import AmenityIcon from "./AmenityIcon";
import useAmenities from "../hooks/useAmenities";

const parse = (value) =>
  (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Chọn tiện ích bằng chip từ danh mục Admin quản lý.
 * `value` là chuỗi phân tách dấu phẩy (đúng định dạng backend đang lưu ở trường utilities).
 * Các giá trị cũ không còn trong danh mục vẫn được giữ lại và có thể bỏ chọn.
 */
const AmenityPicker = ({ value, onChange }) => {
  const amenities = useAmenities();
  const selected = parse(value);
  const lower = selected.map((s) => s.toLowerCase());

  const toggle = (name) => {
    const idx = lower.indexOf(name.toLowerCase());
    const next = idx >= 0 ? selected.filter((_, i) => i !== idx) : [...selected, name];
    onChange(next.join(","));
  };

  const catalogNames = amenities.map((a) => a.name.toLowerCase());
  const legacy = selected.filter((s) => !catalogNames.includes(s.toLowerCase()));

  const chip = (name, icon, active) => (
    <button
      type="button"
      key={name}
      onClick={() => toggle(name)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        border: `1px solid ${active ? "var(--accent, #d97f2e)" : "var(--border, #e4e0d2)"}`,
        background: active ? "var(--accent, #d97f2e)" : "var(--surface, #fff)",
        color: active ? "#fff" : "var(--text, #20241e)",
      }}
    >
      <AmenityIcon name={icon} size={14} />
      {name}
    </button>
  );

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {amenities.map((a) => chip(a.name, a.icon, lower.includes(a.name.toLowerCase())))}
      {legacy.map((name) => chip(name, null, true))}
      {amenities.length === 0 && legacy.length === 0 && (
        <span style={{ fontSize: 13, color: "var(--text-muted, #666f63)" }}>
          Chưa có tiện ích nào được cấu hình.
        </span>
      )}
    </div>
  );
};

export default AmenityPicker;
