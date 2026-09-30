import React, { useState, useEffect } from "react";
import { maintenanceApi } from "../api/apiClient";
import toast from "react-hot-toast";
import {
  Wrench, AlertTriangle, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Zap, Droplets, Monitor, Hammer, Shield, Sparkles, FileText, Loader2,
  Bell, ArrowRight, MessageSquare
} from "lucide-react";

const CATEGORIES = {
  ELECTRICAL: { label: "Điện", icon: <Zap size={16} />, color: "#f59e0b" },
  PLUMBING: { label: "Nước", icon: <Droplets size={16} />, color: "#3b82f6" },
  APPLIANCE: { label: "Thiết bị", icon: <Monitor size={16} />, color: "#8b5cf6" },
  STRUCTURAL: { label: "Kết cấu", icon: <Hammer size={16} />, color: "#6b7280" },
  SECURITY: { label: "An ninh", icon: <Shield size={16} />, color: "#ef4444" },
  CLEANING: { label: "Vệ sinh", icon: <Sparkles size={16} />, color: "#10b981" },
  OTHER: { label: "Khác", icon: <FileText size={16} />, color: "#6b7280" },
};

const URGENCY = {
  LOW: { label: "Thấp", color: "#10b981", bg: "#ecfdf5", priority: 3 },
  NORMAL: { label: "Bình thường", color: "#f59e0b", bg: "#fffbeb", priority: 2 },
  HIGH: { label: "Cao", color: "#f97316", bg: "#fff7ed", priority: 1 },
  URGENT: { label: "Khẩn cấp", color: "#ef4444", bg: "#fef2f2", priority: 0 },
};

const STATUS = {
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

const LandlordTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ activeCount: 0, urgentCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [processing, setProcessing] = useState(null);

  const loadData = async () => {
    try {
      const [ticketRes, statsRes] = await Promise.all([
        maintenanceApi.getLandlordTickets({ status: filter || undefined }),
        maintenanceApi.getLandlordStats(),
      ]);
      setTickets(ticketRes.data || ticketRes || []);
      setStats(statsRes.data || statsRes || { activeCount: 0, urgentCount: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [filter]);

  const handleUpdateStatus = async (id, newStatus) => {
    setProcessing(id);
    try {
      await maintenanceApi.updateTicketStatus(id, {
        status: newStatus,
        landlordNote: actionNote || undefined,
      });
      toast.success(
        newStatus === "IN_PROGRESS"
          ? "🔧 Đã bắt đầu xử lý sự cố!"
          : "✅ Đã đánh dấu giải quyết xong!"
      );
      setActionNote("");
      setExpandedId(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Lỗi cập nhật");
    } finally {
      setProcessing(null);
    }
  };

  const urgentTickets = tickets.filter(t => t.urgency === "URGENT" && ["OPEN", "IN_PROGRESS"].includes(t.status));

  return (
    <div className="page-shell" style={{ background: "var(--bg)" }}>
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "Manrope, sans-serif", display: "flex", alignItems: "center", gap: 10 }}>
              <Wrench size={26} /> Quản lý báo hỏng
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
              Xử lý sự cố do người thuê báo cáo
            </p>
          </div>

          {/* Stats badges */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{
              padding: "10px 18px", borderRadius: 12, background: "var(--surface)",
              border: "1px solid var(--border)", textAlign: "center"
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", fontFamily: "Manrope" }}>
                {stats.activeCount}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Đang xử lý</div>
            </div>
            {stats.urgentCount > 0 && (
              <div style={{
                padding: "10px 18px", borderRadius: 12,
                background: "#fef2f2", border: "1px solid #fecaca", textAlign: "center",
                animation: "urgentPulse 2s ease-in-out infinite"
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", fontFamily: "Manrope" }}>
                  {stats.urgentCount}
                </div>
                <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>Khẩn cấp</div>
              </div>
            )}
          </div>
        </div>

        {/* Urgent banner */}
        {urgentTickets.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
            border: "1px solid #fecaca", borderRadius: "var(--radius-lg)",
            padding: "16px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12,
            animation: "urgentPulse 3s ease-in-out infinite"
          }}>
            <AlertTriangle size={22} color="#ef4444" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 14 }}>
                🔴 {urgentTickets.length} sự cố KHẨN CẤP cần xử lý ngay!
              </div>
              <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>
                {urgentTickets.map(t => `Phòng ${t.roomNumber || t.roomId}: ${t.title}`).join(" | ")}
              </div>
            </div>
            <Bell size={20} color="#ef4444" />
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "", label: "Tất cả" },
            { key: "OPEN", label: "Chờ xử lý" },
            { key: "IN_PROGRESS", label: "Đang xử lý" },
            { key: "RESOLVED", label: "Đã xử lý" },
            { key: "CLOSED", label: "Đã đóng" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: filter === f.key ? "1px solid var(--ink)" : "1px solid var(--border)",
                background: filter === f.key ? "var(--ink)" : "var(--surface)",
                color: filter === f.key ? "#fff" : "var(--text)", cursor: "pointer"
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            <Loader2 size={28} className="spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "var(--surface)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)"
          }}>
            <CheckCircle2 size={40} style={{ color: "var(--success)", marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Không có sự cố nào!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Mọi thứ đang hoạt động tốt.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tickets.map(ticket => {
              const statusCfg = STATUS[ticket.status] || STATUS.OPEN;
              const urgencyCfg = URGENCY[ticket.urgency] || URGENCY.NORMAL;
              const categoryCfg = CATEGORIES[ticket.category] || CATEGORIES.OTHER;
              const expanded = expandedId === ticket.id;
              const isUrgent = ticket.urgency === "URGENT" && ["OPEN", "IN_PROGRESS"].includes(ticket.status);

              return (
                <div key={ticket.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", overflow: "hidden",
                  borderLeft: `4px solid ${urgencyCfg.color}`,
                  boxShadow: isUrgent
                    ? `0 0 0 1px ${urgencyCfg.color}30, 0 6px 20px ${urgencyCfg.color}15`
                    : "var(--shadow-soft)",
                }}>
                  {/* Header row */}
                  <div onClick={() => setExpandedId(expanded ? null : ticket.id)}
                    style={{
                      display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
                      alignItems: "center", gap: 14, padding: "14px 20px",
                      cursor: "pointer", userSelect: "none"
                    }}>
                    {/* Priority indicator */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${categoryCfg.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: categoryCfg.color
                    }}>
                      {categoryCfg.icon}
                    </div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{ticket.title}</h4>
                        {isUrgent && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800,
                            background: "#fef2f2", color: "#ef4444", letterSpacing: "0.04em",
                            animation: "pulse 2s ease-in-out infinite"
                          }}>
                            🔴 KHẨN CẤP
                          </span>
                        )}
                        {ticket.urgency === "HIGH" && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800,
                            background: "#fff7ed", color: "#f97316"
                          }}>
                            ⚠️ ƯU TIÊN CAO
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        Phòng <strong>{ticket.roomNumber || ticket.roomId}</strong>
                        {ticket.propertyTitle && <> — {ticket.propertyTitle}</>}
                        {" • "}{categoryCfg.label} • {timeAgo(ticket.createdAt)}
                      </div>
                    </div>

                    {/* Urgency */}
                    <div style={{
                      padding: "4px 10px", borderRadius: 16,
                      background: urgencyCfg.bg, color: urgencyCfg.color,
                      fontSize: 11, fontWeight: 700
                    }}>
                      {urgencyCfg.label}
                    </div>

                    {/* Status */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 12px", borderRadius: 20,
                      background: statusCfg.bg, color: statusCfg.color,
                      fontSize: 12, fontWeight: 700
                    }}>
                      {statusCfg.icon} {statusCfg.label}
                    </div>

                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {/* Expanded actions */}
                  {expanded && (
                    <div style={{
                      borderTop: "1px solid var(--border)", padding: "16px 20px",
                      animation: "fadeIn 0.2s ease"
                    }}>
                      {/* Description */}
                      <div style={{
                        padding: "12px 16px", background: "#f9fafb", borderRadius: 10,
                        marginBottom: 14, fontSize: 14, lineHeight: 1.7
                      }}>
                        {ticket.description}
                      </div>

                      {/* Images */}
                      {ticket.imageUrls?.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                          {ticket.imageUrls.map((url, i) => (
                            <img key={i} src={url} alt="" style={{
                              width: 120, height: 90, objectFit: "cover", borderRadius: 8,
                              border: "1px solid var(--border)", cursor: "pointer"
                            }} onClick={() => window.open(url, "_blank")} />
                          ))}
                        </div>
                      )}

                      {/* Action area */}
                      {["OPEN", "IN_PROGRESS"].includes(ticket.status) && (
                        <div style={{
                          padding: "14px 16px", background: "#f0fdf4", borderRadius: 10,
                          border: "1px solid #bbf7d0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                            <MessageSquare size={14} /> Ghi chú xử lý (tùy chọn)
                          </div>
                          <textarea
                            rows={2} placeholder="VD: Thợ sẽ tới sửa lúc 2h chiều ngày mai..."
                            value={expandedId === ticket.id ? actionNote : ""}
                            onChange={e => setActionNote(e.target.value)}
                            style={{
                              width: "100%", padding: "8px 12px", border: "1px solid #bbf7d0",
                              borderRadius: 8, fontSize: 13, resize: "none", outline: "none",
                              marginBottom: 10
                            }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            {ticket.status === "OPEN" && (
                              <button className="btn btn-primary"
                                disabled={processing === ticket.id}
                                onClick={() => handleUpdateStatus(ticket.id, "IN_PROGRESS")}
                                style={{ flex: 1, gap: 6, padding: "10px 0" }}>
                                <Wrench size={14} /> Bắt đầu xử lý
                              </button>
                            )}
                            {["OPEN", "IN_PROGRESS"].includes(ticket.status) && (
                              <button className="btn"
                                disabled={processing === ticket.id}
                                onClick={() => handleUpdateStatus(ticket.id, "RESOLVED")}
                                style={{
                                  flex: 1, gap: 6, padding: "10px 0",
                                  borderColor: "var(--success)", color: "var(--success)"
                                }}>
                                <CheckCircle2 size={14} /> Đánh dấu đã xử lý
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resolved info */}
                      {ticket.status === "RESOLVED" && (
                        <div style={{
                          padding: "12px 16px", background: "#ecfdf5", borderRadius: 10,
                          border: "1px solid #a7f3d0", fontSize: 13, color: "#047857"
                        }}>
                          ✅ Đã đánh dấu giải quyết — đang chờ người thuê xác nhận.
                          {ticket.landlordNote && (
                            <div style={{ marginTop: 6, fontStyle: "italic" }}>
                              Ghi chú: "{ticket.landlordNote}"
                            </div>
                          )}
                        </div>
                      )}

                      {ticket.status === "CLOSED" && (
                        <div style={{
                          padding: "12px 16px", background: "#f9fafb", borderRadius: 10,
                          border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)"
                        }}>
                          ✅ Người thuê đã xác nhận. Ticket đã đóng.
                        </div>
                      )}
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
        @keyframes urgentPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.1); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LandlordTickets;
