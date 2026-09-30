import React, { useState, useEffect } from "react";
import { maintenanceApi } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Wrench, Plus, AlertTriangle, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Send, X, Zap, Droplets, Monitor,
  Hammer, Shield, Sparkles, FileText, Loader2, ImagePlus
} from "lucide-react";

const CATEGORIES = [
  { value: "ELECTRICAL", label: "Điện", icon: <Zap size={16} />, color: "#f59e0b" },
  { value: "PLUMBING", label: "Nước / Ống nước", icon: <Droplets size={16} />, color: "#3b82f6" },
  { value: "APPLIANCE", label: "Thiết bị", icon: <Monitor size={16} />, color: "#8b5cf6" },
  { value: "STRUCTURAL", label: "Kết cấu", icon: <Hammer size={16} />, color: "#6b7280" },
  { value: "SECURITY", label: "An ninh", icon: <Shield size={16} />, color: "#ef4444" },
  { value: "CLEANING", label: "Vệ sinh", icon: <Sparkles size={16} />, color: "#10b981" },
  { value: "OTHER", label: "Khác", icon: <FileText size={16} />, color: "#6b7280" },
];

const URGENCIES = [
  { value: "LOW", label: "Thấp", color: "#10b981", bg: "#ecfdf5" },
  { value: "NORMAL", label: "Bình thường", color: "#f59e0b", bg: "#fffbeb" },
  { value: "HIGH", label: "Cao", color: "#f97316", bg: "#fff7ed" },
  { value: "URGENT", label: "Khẩn cấp", color: "#ef4444", bg: "#fef2f2" },
];

const STATUS_CONFIG = {
  OPEN: { label: "Chờ xử lý", color: "#f59e0b", bg: "#fffbeb", icon: <Clock size={14} /> },
  IN_PROGRESS: { label: "Đang xử lý", color: "#3b82f6", bg: "#eff6ff", icon: <Wrench size={14} /> },
  RESOLVED: { label: "Đã xử lý", color: "#10b981", bg: "#ecfdf5", icon: <CheckCircle2 size={14} /> },
  CLOSED: { label: "Đã đóng", color: "#6b7280", bg: "#f9fafb", icon: <CheckCircle2 size={14} /> },
  CANCELLED: { label: "Đã hủy", color: "#9ca3af", bg: "#f3f4f6", icon: <XCircle size={14} /> },
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const MaintenanceTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    roomId: "",
    category: "",
    title: "",
    description: "",
    urgency: "NORMAL",
    imageUrls: [],
  });
  const [imageInput, setImageInput] = useState("");

  const loadTickets = async () => {
    try {
      const res = await maintenanceApi.getMyTickets();
      setTickets(res.data || res || []);
    } catch (err) {
      console.error("Lỗi tải ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomId || !form.category || !form.title || !form.description) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    setSubmitting(true);
    try {
      await maintenanceApi.createTicket({
        ...form,
        roomId: Number(form.roomId),
      });
      toast.success("🔧 Đã gửi báo hỏng thành công!");
      setShowCreate(false);
      setForm({ roomId: "", category: "", title: "", description: "", urgency: "NORMAL", imageUrls: [] });
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Không thể gửi báo hỏng");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await maintenanceApi.confirmResolved(id);
      toast.success("✅ Đã xác nhận giải quyết thành công!");
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Lỗi xác nhận");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy báo hỏng này?")) return;
    try {
      await maintenanceApi.cancelTicket(id);
      toast.success("Đã hủy ticket!");
      loadTickets();
    } catch (err) {
      toast.error(err.message || "Lỗi hủy ticket");
    }
  };

  const addImageUrl = () => {
    if (imageInput.trim()) {
      setForm(f => ({ ...f, imageUrls: [...f.imageUrls, imageInput.trim()] }));
      setImageInput("");
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }));
  };

  const filtered = filter === "ALL"
    ? tickets
    : tickets.filter(t => t.status === filter);

  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-shell" style={{ background: "var(--bg)" }}>
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "Manrope, sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
              <Wrench size={26} /> Báo hỏng / Sự cố
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
              Gửi yêu cầu sửa chữa trực tiếp đến chủ trọ
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(!showCreate)}
            style={{ gap: 6 }}
          >
            <Plus size={16} /> Tạo báo hỏng
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 28,
            boxShadow: "var(--shadow-card)", animation: "fadeIn 0.3s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "Manrope, sans-serif" }}>
                📝 Tạo báo hỏng mới
              </h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Room ID */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Mã phòng (Room ID) *
                </label>
                <input
                  type="number" placeholder="Nhập mã phòng đang ở" value={form.roomId}
                  onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                    borderRadius: 8, fontSize: 14, outline: "none"
                  }}
                />
              </div>

              {/* Category grid */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" }}>
                  Loại sự cố *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                        border: form.category === cat.value ? `2px solid ${cat.color}` : "1px solid var(--border)",
                        borderRadius: 10,
                        background: form.category === cat.value ? `${cat.color}12` : "var(--surface)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        color: form.category === cat.value ? cat.color : "var(--text)",
                        transition: "all 0.2s"
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Tiêu đề sự cố *
                </label>
                <input
                  type="text" placeholder="VD: Máy lạnh không lạnh, bóng đèn cháy..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                    borderRadius: 8, fontSize: 14, outline: "none"
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Mô tả chi tiết *
                </label>
                <textarea
                  rows={4} placeholder="Mô tả chi tiết sự cố để chủ trọ nắm rõ vấn đề..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                    borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical"
                  }}
                />
              </div>

              {/* Urgency */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" }}>
                  Mức độ ưu tiên
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {URGENCIES.map(u => (
                    <button key={u.value} type="button"
                      onClick={() => setForm(f => ({ ...f, urgency: u.value }))}
                      style={{
                        flex: 1, padding: "10px 0", textAlign: "center",
                        border: form.urgency === u.value ? `2px solid ${u.color}` : "1px solid var(--border)",
                        borderRadius: 10,
                        background: form.urgency === u.value ? u.bg : "var(--surface)",
                        color: form.urgency === u.value ? u.color : "var(--text-muted)",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                  Ảnh đính kèm (URL)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text" placeholder="Dán link ảnh sự cố..." value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                    style={{
                      flex: 1, padding: "10px 14px", border: "1px solid var(--border)",
                      borderRadius: 8, fontSize: 13, outline: "none"
                    }}
                  />
                  <button type="button" onClick={addImageUrl} className="btn" style={{ padding: "10px 14px" }}>
                    <ImagePlus size={16} />
                  </button>
                </div>
                {form.imageUrls.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {form.imageUrls.map((url, i) => (
                      <div key={i} style={{ position: "relative", width: 70, height: 70, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button type="button" onClick={() => removeImage(i)}
                          style={{
                            position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)",
                            border: "none", borderRadius: "50%", width: 18, height: 18,
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                          }}>
                          <X size={10} color="#fff" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}
                style={{ width: "100%", padding: "12px 0", fontSize: 15, fontWeight: 700 }}>
                {submitting ? <><Loader2 size={16} className="spin" /> Đang gửi...</> : <><Send size={16} /> Gửi báo hỏng</>}
              </button>
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "ALL", label: "Tất cả", count: tickets.length },
            { key: "OPEN", label: "Chờ xử lý", count: statusCounts.OPEN || 0 },
            { key: "IN_PROGRESS", label: "Đang xử lý", count: statusCounts.IN_PROGRESS || 0 },
            { key: "RESOLVED", label: "Đã xử lý", count: statusCounts.RESOLVED || 0 },
            { key: "CLOSED", label: "Đã đóng", count: statusCounts.CLOSED || 0 },
          ].map(f => (
            <button key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: filter === f.key ? "1px solid var(--ink)" : "1px solid var(--border)",
                background: filter === f.key ? "var(--ink)" : "var(--surface)",
                color: filter === f.key ? "#fff" : "var(--text)", cursor: "pointer",
                transition: "all 0.2s"
              }}>
              {f.label} {f.count > 0 && <span style={{ marginLeft: 4, opacity: 0.8 }}>({f.count})</span>}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            <Loader2 size={28} className="spin" /> <p style={{ marginTop: 10 }}>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "var(--surface)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)"
          }}>
            <Wrench size={40} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Chưa có báo hỏng nào</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Khi phòng có sự cố, bạn có thể gửi báo hỏng để chủ trọ xử lý nhanh chóng.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(ticket => {
              const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
              const urgency = URGENCIES.find(u => u.value === ticket.urgency) || URGENCIES[1];
              const category = CATEGORIES.find(c => c.value === ticket.category);
              const expanded = expandedId === ticket.id;

              return (
                <div key={ticket.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", overflow: "hidden",
                  borderLeft: `4px solid ${urgency.color}`,
                  boxShadow: ticket.urgency === "URGENT" ? `0 0 0 1px ${urgency.color}30, 0 4px 16px ${urgency.color}15` : "var(--shadow-soft)",
                  transition: "all 0.2s"
                }}>
                  {/* Card header */}
                  <div
                    onClick={() => setExpandedId(expanded ? null : ticket.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
                      cursor: "pointer", userSelect: "none"
                    }}
                  >
                    {/* Category icon */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: `${category?.color || "#6b7280"}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: category?.color || "#6b7280", flexShrink: 0
                    }}>
                      {category?.icon || <FileText size={18} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{ticket.title}</h4>
                        {ticket.urgency === "URGENT" && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            background: "#fef2f2", color: "#ef4444",
                            animation: "pulse 2s ease-in-out infinite"
                          }}>
                            <AlertTriangle size={11} /> KHẨN CẤP
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 3, fontSize: 12, color: "var(--text-muted)" }}>
                        <span>Phòng {ticket.roomNumber || ticket.roomId}</span>
                        <span>•</span>
                        <span>{category?.label || ticket.category}</span>
                        <span>•</span>
                        <span>{timeAgo(ticket.createdAt)}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 12px", borderRadius: 20,
                      background: statusCfg.bg, color: statusCfg.color,
                      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
                    }}>
                      {statusCfg.icon} {statusCfg.label}
                    </div>

                    {expanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </div>

                  {/* Expanded detail */}
                  {expanded && (
                    <div style={{
                      padding: "0 20px 20px", borderTop: "1px solid var(--border)",
                      marginTop: 0, paddingTop: 16, animation: "fadeIn 0.2s ease"
                    }}>
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", marginBottom: 14 }}>
                        {ticket.description}
                      </p>

                      {/* Images */}
                      {ticket.imageUrls?.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                          {ticket.imageUrls.map((url, i) => (
                            <img key={i} src={url} alt="" style={{
                              width: 100, height: 80, objectFit: "cover", borderRadius: 8,
                              border: "1px solid var(--border)"
                            }} />
                          ))}
                        </div>
                      )}

                      {/* Landlord note */}
                      {ticket.landlordNote && (
                        <div style={{
                          padding: "12px 16px", borderRadius: 10,
                          background: "#f0fdf4", border: "1px solid #bbf7d0",
                          marginBottom: 14
                        }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>
                            💬 Ghi chú từ chủ trọ:
                          </p>
                          <p style={{ fontSize: 14, color: "#15803d" }}>{ticket.landlordNote}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: 0, marginBottom: 16,
                        background: "#f9fafb", borderRadius: 10, padding: "8px 4px", overflow: "hidden"
                      }}>
                        {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((step, i) => {
                          const stepCfg = STATUS_CONFIG[step];
                          const isActive = step === ticket.status;
                          const isPast = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].indexOf(ticket.status) >= i;
                          return (
                            <React.Fragment key={step}>
                              {i > 0 && (
                                <div style={{
                                  flex: 1, height: 2, background: isPast ? stepCfg.color : "#e5e7eb",
                                  transition: "background 0.3s"
                                }} />
                              )}
                              <div style={{
                                width: 28, height: 28, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: isPast ? stepCfg.color : "#e5e7eb",
                                color: "#fff", fontSize: 12, fontWeight: 700,
                                boxShadow: isActive ? `0 0 0 3px ${stepCfg.color}30` : "none",
                                transition: "all 0.3s", flexShrink: 0
                              }}>
                                {isPast ? <CheckCircle2 size={14} /> : i + 1}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {ticket.status === "RESOLVED" && (
                          <button className="btn btn-primary" onClick={() => handleConfirm(ticket.id)}
                            style={{ flex: 1, gap: 6, padding: "10px 0" }}>
                            <CheckCircle2 size={16} /> Xác nhận đã giải quyết
                          </button>
                        )}
                        {["OPEN", "IN_PROGRESS"].includes(ticket.status) && (
                          <button className="btn" onClick={() => handleCancel(ticket.id)}
                            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                            <XCircle size={14} /> Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MaintenanceTickets;
