import React, { useState } from "react";
import { Search, Filter, ShieldAlert, Activity, User, Calendar, MapPin, ChevronRight, ChevronLeft } from "lucide-react";

// Dữ liệu giả định (Mock Data) cho Audit Logs
const mockAuditLogs = [
  {
    id: 1,
    timestamp: "2026-10-02T08:15:30Z",
    adminName: "Super Admin",
    adminEmail: "admin@phongtro.vn",
    action: "UPDATE_SETTING",
    details: "Thay đổi MAX_FREE_POSTS_PER_MONTH từ 3 thành 5",
    ipAddress: "192.168.1.45",
  },
  {
    id: 2,
    timestamp: "2026-10-02T09:20:15Z",
    adminName: "Super Admin",
    adminEmail: "admin@phongtro.vn",
    action: "LOCK_USER",
    details: "Khóa tài khoản ID: 42 (Lý do: Phát hiện gian lận)",
    ipAddress: "192.168.1.45",
  },
  {
    id: 3,
    timestamp: "2026-10-01T14:05:00Z",
    adminName: "Nguyen Van A",
    adminEmail: "nva@phongtro.vn",
    action: "APPROVE_POST",
    details: "Duyệt bài đăng ID: 1552 của chủ trọ",
    ipAddress: "118.69.112.55",
  },
  {
    id: 4,
    timestamp: "2026-10-01T10:12:44Z",
    adminName: "Super Admin",
    adminEmail: "admin@phongtro.vn",
    action: "DELETE_PROPERTY",
    details: "Xóa khu trọ ID: 89 (Vi phạm tiêu chuẩn)",
    ipAddress: "192.168.1.45",
  },
  {
    id: 5,
    timestamp: "2026-09-30T16:45:10Z",
    adminName: "Nguyen Van A",
    adminEmail: "nva@phongtro.vn",
    action: "TOGGLE_MAINTENANCE",
    details: "Bật chế độ bảo trì hệ thống",
    ipAddress: "118.69.112.55",
  },
];

const ActionBadge = ({ action }) => {
  let color = "#64748B";
  let bg = "#F1F5F9";
  
  if (action.includes("UPDATE") || action.includes("APPROVE")) {
    color = "#0369A1";
    bg = "#E0F2FE";
  } else if (action.includes("LOCK") || action.includes("DELETE")) {
    color = "#B91C1C";
    bg = "#FEE2E2";
  } else if (action.includes("MAINTENANCE")) {
    color = "#B45309";
    bg = "#FEF3C7";
  }

  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      color: color,
      backgroundColor: bg,
    }}>
      {action}
    </span>
  );
};

const AdminAuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Mô phỏng gọi API từ backend (TODO: thay bằng adminApi.getAuditLogs() khi backend sẵn sàng)
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Giả lập delay mạng
        await new Promise(resolve => setTimeout(resolve, 800));
        setLogs(mockAuditLogs);
      } catch (err) {
        console.error("Lỗi khi tải Audit Logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { 
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => 
    log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={28} color="#8B5CF6" />
          Nhật Ký Hoạt Động (Audit Logs)
        </h1>
        <p style={{ color: "#64748B", margin: "4px 0 0 0", fontSize: "14px" }}>
          Theo dõi mọi thao tác của quản trị viên trên hệ thống để đảm bảo tính minh bạch.
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "16px 24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: "8px", padding: "8px 16px", width: "300px" }}>
            <Search size={18} color="#94A3B8" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo Tên Admin hoặc Hành động..." 
              style={{ border: "none", background: "transparent", outline: "none", marginLeft: "8px", width: "100%", fontSize: "14px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#475569" }}>
            <Calendar size={16} /> Lọc theo Ngày
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "white", border: "1px solid #E2E8F0", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#475569" }}>
            <Filter size={16} /> Loại Hành Động
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "13px", textTransform: "uppercase" }}>
              <th style={{ padding: "16px 24px", fontWeight: "600" }}>Thời gian</th>
              <th style={{ padding: "16px 24px", fontWeight: "600" }}>Admin</th>
              <th style={{ padding: "16px 24px", fontWeight: "600" }}>Hành động</th>
              <th style={{ padding: "16px 24px", fontWeight: "600" }}>Chi tiết</th>
              <th style={{ padding: "16px 24px", fontWeight: "600" }}>Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                  <Activity size={24} className="spin" style={{ marginBottom: "8px", color: "#8B5CF6" }} />
                  <div>Đang tải dữ liệu log...</div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                  Không tìm thấy log nào phù hợp.
                </td>
              </tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                <td style={{ padding: "16px 24px", fontSize: "14px", color: "#334155" }}>
                  <div style={{ fontWeight: "500" }}>{formatDate(log.timestamp).split(' ')[1]}</div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>{formatDate(log.timestamp).split(' ')[0]}</div>
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#EDE9FE", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "14px" }}>
                      {log.adminName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#0F172A" }}>{log.adminName}</div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>{log.adminEmail}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "16px 24px" }}>
                  <ActionBadge action={log.action} />
                </td>
                <td style={{ padding: "16px 24px", fontSize: "14px", color: "#334155", maxWidth: "300px" }}>
                  {log.details}
                </td>
                <td style={{ padding: "16px 24px", fontSize: "13px", color: "#64748B" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={14} /> {log.ipAddress}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Dummy */}
        <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0" }}>
          <span style={{ fontSize: "14px", color: "#64748B" }}>Hiển thị 1 đến 5 của 254 mục</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={16} color="#64748B" />
            </button>
            <button style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#8B5CF6", color: "white", fontWeight: "600", cursor: "pointer" }}>1</button>
            <button style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}>2</button>
            <button style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}>3</button>
            <button style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={16} color="#64748B" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogs;
