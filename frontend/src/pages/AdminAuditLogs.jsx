import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ShieldAlert, Search, MapPin, RotateCcw } from "lucide-react";
import { adminApi } from "../api/apiClient";
import {
  EmptyState, PageHeader, Pagination, Spinner, buttonStyle, cardStyle, errorMessage, inputStyle, useDebounced,
} from "../components/admin/AdminUi";

const PAGE_SIZE = 10;

// Tên hiển thị cho các mã hành động. Mã chưa có trong bảng sẽ hiển thị nguyên mã.
const ACTION_LABELS = {
  LOCK_USER: "Khóa tài khoản",
  UNLOCK_USER: "Mở khóa tài khoản",
  HIDE_PROPERTY: "Tạm ẩn khu trọ",
  SHOW_PROPERTY: "Hiển thị khu trọ",
  DELETE_PROPERTY: "Xóa khu trọ",
  APPROVE_POST: "Duyệt bài đăng",
  REJECT_POST: "Từ chối bài đăng",
  RESET_POST: "Đặt lại chờ duyệt",
  DELETE_POST: "Xóa bài đăng",
  CREATE_AMENITY: "Thêm tiện ích",
  UPDATE_AMENITY: "Sửa tiện ích",
  DELETE_AMENITY: "Xóa tiện ích",
  LANDLORD_CREATE_PROPERTY: "Chủ trọ thêm khu trọ",
  LANDLORD_UPDATE_PROPERTY: "Chủ trọ sửa khu trọ",
  LANDLORD_DELETE_PROPERTY: "Chủ trọ xóa khu trọ",
  LANDLORD_CREATE_ROOM: "Chủ trọ thêm phòng",
  LANDLORD_UPDATE_ROOM: "Chủ trọ sửa phòng",
  LANDLORD_DELETE_ROOM: "Chủ trọ xóa phòng",
};

const thStyle = { padding: "16px 24px", fontWeight: 600, textAlign: "left" };

const ActionBadge = ({ action }) => {
  let color = "var(--text-secondary)";
  let bg = "var(--bg-primary)";
  let border = "var(--border-color)";
  if (/CREATE|APPROVE|SHOW|UNLOCK/.test(action)) { color = "#10B981"; bg = "rgba(16, 185, 129, 0.15)"; border = "rgba(16, 185, 129, 0.3)"; }
  else if (/UPDATE|RESET/.test(action)) { color = "#0EA5E9"; bg = "rgba(14, 165, 233, 0.15)"; border = "rgba(14, 165, 233, 0.3)"; }
  else if (/LOCK|DELETE|REJECT/.test(action)) { color = "#EF4444"; bg = "rgba(239, 68, 68, 0.15)"; border = "rgba(239, 68, 68, 0.3)"; }
  else if (/HIDE/.test(action)) { color = "#F59E0B"; bg = "rgba(245, 158, 11, 0.15)"; border = "rgba(245, 158, 11, 0.3)"; }
  return (
    <span title={action} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color, backgroundColor: bg, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      {ACTION_LABELS[action] || action}
    </span>
  );
};

const AdminAuditLogs = () => {
  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);

  const [actions, setActions] = useState([]);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);

  const debouncedKeyword = useDebounced(keyword);
  const reqId = useRef(0);

  // Danh sách loại hành động có thật trong DB + các mã đã biết
  useEffect(() => {
    adminApi
      .getAuditActions()
      .then((res) => setActions(res.data || []))
      .catch(() => {});
  }, []);

  const actionOptions = Array.from(new Set([...Object.keys(ACTION_LABELS), ...actions])).sort();

  const fetchLogs = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      if (action) params.action = action;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await adminApi.getAuditLogs(params);
      if (id === reqId.current) setData(res.data);
    } catch (err) {
      if (id === reqId.current) toast.error(errorMessage(err, "Không tải được nhật ký hoạt động"));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, debouncedKeyword, action, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  // Đổi bộ lọc thì quay về trang đầu
  useEffect(() => { setPage(0); }, [debouncedKeyword, action, from, to]);

  const hasFilter = keyword || action || from || to;
  const reset = () => { setKeyword(""); setAction(""); setFrom(""); setTo(""); };

  const fmt = (iso) => {
    if (!iso) return { time: "—", date: "" };
    const d = new Date(iso);
    return {
      time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
    };
  };

  const invalidRange = from && to && from > to;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        icon={<ShieldAlert size={28} color="#8B5CF6" />}
        title="Nhật Ký Hoạt Động (Audit Logs)"
        subtitle="Theo dõi mọi thao tác của quản trị viên trên hệ thống để đảm bảo tính minh bạch."
      />

      <div style={{ ...cardStyle, padding: "16px 24px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "0 14px", flex: "1 1 260px", maxWidth: 340, height: 40 }}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo admin, hành động, chi tiết..."
            style={{ border: "none", background: "transparent", outline: "none", padding: "0 8px", width: "100%", fontSize: 14, color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Từ ngày</label>
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} style={{ ...inputStyle, width: 160, height: 40 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Đến ngày</label>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, width: 160, height: 40 }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Loại hành động</label>
          <select value={action} onChange={(e) => setAction(e.target.value)} style={{ ...inputStyle, width: 210, height: 40 }}>
            <option value="">Tất cả hành động</option>
            {actionOptions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
          </select>
        </div>

        {hasFilter && (
          <button style={buttonStyle("default", { height: 40 })} onClick={reset}>
            <RotateCcw size={14} /> Xóa lọc
          </button>
        )}
        {invalidRange && <span style={{ color: "#DC2626", fontSize: 13 }}>"Từ ngày" phải trước "Đến ngày"</span>}
      </div>

      <div style={{ ...cardStyle, borderRadius: 16, overflow: "hidden" }}>
        {loading && data.content.length === 0 ? (
          <Spinner label="Đang tải dữ liệu log..." />
        ) : data.content.length === 0 ? (
          <EmptyState message={hasFilter ? "Không tìm thấy log nào phù hợp bộ lọc." : "Chưa có hoạt động nào được ghi nhận."} />
        ) : (
          <div style={{ overflowX: "auto", opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 820 }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: 13, textTransform: "uppercase" }}>
                  <th style={thStyle}>Thời gian</th>
                  <th style={thStyle}>Admin</th>
                  <th style={thStyle}>Hành động</th>
                  <th style={thStyle}>Chi tiết</th>
                  <th style={thStyle}>Địa chỉ IP</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((log) => {
                  const t = fmt(log.createdAt);
                  const name = log.adminName || log.adminEmail || "—";
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>{t.time}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.date}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{name}</div>
                            {log.adminEmail && log.adminEmail !== name && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{log.adminEmail}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px" }}><ActionBadge action={log.action} /></td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-primary)", maxWidth: 360, wordBreak: "break-word" }}>{log.details}</td>
                      <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} /> {log.ipAddress || "—"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.number ?? page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
      </div>
    </div>
  );
};

export default AdminAuditLogs;
