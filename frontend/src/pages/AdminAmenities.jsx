import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Tag, Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { adminApi } from "../api/apiClient";
import AmenityIcon, { AMENITY_ICONS } from "../components/AmenityIcon";
import {
  ConfirmDialog, EmptyState, Modal, PageHeader, Spinner, StatusBadge,
  buttonStyle, cardStyle, errorMessage, formatDateTime, inputStyle,
} from "../components/admin/AdminUi";

const thStyle = { textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" };
const tdStyle = { padding: "12px 16px", fontSize: 14, color: "#334155", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" };

const EMPTY_FORM = { name: "", icon: "", active: true, sortOrder: 0 };

const AdminAmenities = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(null); // null = đóng; { id?, ...fields }
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null); // xem chi tiết (chỉ đọc)
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAmenities();
      setItems(res.data || []);
    } catch (err) {
      toast.error(errorMessage(err, "Không tải được danh sách tiện ích"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((a) => a.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const openCreate = () => setForm({ ...EMPTY_FORM, sortOrder: items.length });
  const openEdit = (a) => setForm({ id: a.id, name: a.name, icon: a.icon || "", active: a.active, sortOrder: a.sortOrder ?? 0 });

  const save = async () => {
    const name = form.name.trim();
    if (!name) return toast.error("Vui lòng nhập tên tiện ích");
    const payload = { name, icon: form.icon.trim() || null, active: form.active, sortOrder: Number(form.sortOrder) || 0 };
    setSaving(true);
    try {
      if (form.id) await adminApi.updateAmenity(form.id, payload);
      else await adminApi.createAmenity(payload);
      toast.success(form.id ? "Đã cập nhật tiện ích" : "Đã thêm tiện ích");
      setForm(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Lưu tiện ích thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a) => {
    try {
      await adminApi.updateAmenity(a.id, { name: a.name, icon: a.icon, active: !a.active, sortOrder: a.sortOrder });
      setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, active: !a.active } : x)));
    } catch (err) {
      toast.error(errorMessage(err, "Cập nhật trạng thái thất bại"));
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteAmenity(toDelete.id);
      toast.success("Đã xóa tiện ích");
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Xóa tiện ích thất bại"));
    } finally {
      setDeleting(false);
    }
  };

  const isLucide = form && AMENITY_ICONS[form.icon];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        icon={<Tag size={28} color="#8B5CF6" />}
        title="Quản lý Tiện ích"
        subtitle="Danh mục tiện ích (Wifi, bãi xe...) dùng cho bộ lọc tìm phòng và form đăng bài"
        action={<button style={buttonStyle("primary")} onClick={openCreate}><Plus size={16} /> Thêm tiện ích</button>}
      />

      <div style={{ ...cardStyle, padding: "12px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 8, padding: "0 14px", maxWidth: 360 }}>
          <Search size={18} color="#94A3B8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tiện ích..."
            style={{ ...inputStyle, border: "none", background: "transparent", padding: "10px 8px" }}
          />
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState message={items.length === 0 ? "Chưa có tiện ích nào. Hãy thêm tiện ích đầu tiên." : "Không tìm thấy tiện ích phù hợp"} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr>{["Icon", "Tên tiện ích", "Thứ tự", "Trạng thái", ""].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td style={tdStyle}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EDE9FE", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AmenityIcon name={a.icon} size={18} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "#0F172A" }}>{a.name}</td>
                    <td style={tdStyle}>{a.sortOrder}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => toggleActive(a)}
                        title="Bấm để bật/tắt hiển thị"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <StatusBadge status={a.active ? "ACTIVE" : "HIDDEN"} label={a.active ? "Đang bật" : "Đã tắt"} />
                      </button>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button title="Xem" style={buttonStyle("default", { padding: "6px 9px" })} onClick={() => setViewing(a)}><Eye size={15} /></button>
                        <button title="Sửa" style={buttonStyle("default", { padding: "6px 9px" })} onClick={() => openEdit(a)}><Pencil size={15} /></button>
                        <button title="Xóa" style={buttonStyle("ghostDanger", { padding: "6px 9px" })} onClick={() => setToDelete(a)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!form}
        onClose={saving ? undefined : () => setForm(null)}
        title={form?.id ? "Sửa tiện ích" : "Thêm tiện ích"}
        width={520}
        footer={
          <>
            <button style={buttonStyle("default")} onClick={() => setForm(null)} disabled={saving}>Hủy</button>
            <button style={buttonStyle("primary", { opacity: saving ? 0.7 : 1 })} onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
          </>
        }
      >
        {form && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên tiện ích <span style={{ color: "#DC2626" }}>*</span></label>
              <input style={inputStyle} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Wifi, Chỗ để xe..." autoFocus />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Icon</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: 8, marginBottom: 10 }}>
                {Object.keys(AMENITY_ICONS).map((key) => {
                  const active = form.icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={key}
                      onClick={() => setForm({ ...form, icon: key })}
                      style={{
                        height: 44, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        border: `2px solid ${active ? "#8B5CF6" : "#E2E8F0"}`, background: active ? "#EDE9FE" : "white", color: active ? "#7C3AED" : "#64748B",
                      }}
                    >
                      <AmenityIcon name={key} size={20} />
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  maxLength={100}
                  value={isLucide ? "" : form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="Hoặc nhập emoji, vd: 🅿️"
                />
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#EDE9FE", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AmenityIcon name={form.icon} size={20} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
              <div style={{ width: 140 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Thứ tự hiển thị</label>
                <input type="number" style={inputStyle} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", paddingBottom: 10 }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Hiển thị cho người dùng
              </label>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Chi tiết tiện ích"
        width={440}
        footer={
          <>
            <button style={buttonStyle("default")} onClick={() => setViewing(null)}>Đóng</button>
            <button style={buttonStyle("primary")} onClick={() => { const a = viewing; setViewing(null); openEdit(a); }}><Pencil size={14} /> Sửa</button>
          </>
        }
      >
        {viewing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "#EDE9FE", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AmenityIcon name={viewing.icon} size={26} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{viewing.name}</div>
                <StatusBadge status={viewing.active ? "ACTIVE" : "HIDDEN"} label={viewing.active ? "Đang bật" : "Đã tắt"} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", rowGap: 8, fontSize: 14, color: "#334155" }}>
              <span style={{ color: "#64748B" }}>Mã</span><span>#{viewing.id}</span>
              <span style={{ color: "#64748B" }}>Icon</span><span>{viewing.icon || "Mặc định"}</span>
              <span style={{ color: "#64748B" }}>Thứ tự</span><span>{viewing.sortOrder}</span>
              <span style={{ color: "#64748B" }}>Tạo lúc</span><span>{formatDateTime(viewing.createdAt)}</span>
              <span style={{ color: "#64748B" }}>Cập nhật</span><span>{formatDateTime(viewing.updatedAt)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        title="Xóa tiện ích"
        message={toDelete ? `Xóa tiện ích "${toDelete.name}"? Tiện ích sẽ biến mất khỏi bộ lọc và form đăng bài. Các bài đăng cũ đã ghi tên tiện ích này vẫn giữ nguyên nội dung. Nếu chỉ muốn tạm dừng, hãy tắt hiển thị thay vì xóa.` : ""}
        confirmText="Xóa tiện ích"
      />
    </div>
  );
};

export default AdminAmenities;
