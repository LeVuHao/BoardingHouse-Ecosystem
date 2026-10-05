import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Users, Search, Lock, Unlock, Phone, Mail } from "lucide-react";
import { adminApi } from "../api/apiClient";
import {
  ConfirmDialog, EmptyState, PageHeader, Pagination, Spinner, StatusBadge,
  buttonStyle, cardStyle, errorMessage, formatDateTime, inputStyle, useDebounced,
} from "../components/admin/AdminUi";

const PAGE_SIZE = 10;

const thStyle = { textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" };
const tdStyle = { padding: "12px 16px", fontSize: 14, color: "#334155", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" };

const ROLE_LABEL = { ADMIN: "Quản trị viên", LANDLORD: "Chủ trọ", USER: "Người thuê" };
const ROLE_COLOR = {
  ADMIN: { color: "#6D28D9", bg: "#EDE9FE" },
  LANDLORD: { color: "#1D4ED8", bg: "#DBEAFE" },
  USER: { color: "#475569", bg: "#F1F5F9" },
};

const RoleBadge = ({ role }) => {
  const c = ROLE_COLOR[role] || ROLE_COLOR.USER;
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: c.color, background: c.bg, whiteSpace: "nowrap" }}>
      {ROLE_LABEL[role] || role}
    </span>
  );
};

const Avatar = ({ user }) =>
  user.avatarUrl ? (
    <img src={user.avatarUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#EDE9FE", color: "#7C3AED", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {(user.fullName || user.email || "?").charAt(0).toUpperCase()}
    </div>
  );

const AdminUsers = () => {
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState(null); // { type: 'lock' | 'unlock', user }
  const [acting, setActing] = useState(false);

  const debouncedKeyword = useDebounced(keyword);
  const reqId = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      if (role !== "ALL") params.role = role;
      if (status !== "ALL") params.status = status;
      const res = await adminApi.getUsers(params);
      if (id === reqId.current) setData(res.data);
    } catch (err) {
      if (id === reqId.current) toast.error(errorMessage(err, "Không tải được danh sách người dùng"));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, debouncedKeyword, role, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [debouncedKeyword, role, status]);

  const runConfirm = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.type === "lock") await adminApi.lockUser(confirm.user.id);
      else await adminApi.unlockUser(confirm.user.id);
      toast.success(confirm.type === "lock" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      setConfirm(null);
      fetchData();
    } catch (err) {
      toast.error(errorMessage(err, "Thao tác thất bại"));
    } finally {
      setActing(false);
    }
  };

  const isLock = confirm?.type === "lock";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        icon={<Users size={28} color="#8B5CF6" />}
        title="Quản lý Người dùng"
        subtitle="Xem, tìm kiếm và khóa / mở khóa tài khoản người thuê, chủ trọ trên hệ thống."
      />

      <div style={{ ...cardStyle, padding: "16px 24px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 8, padding: "0 14px", flex: "1 1 280px", maxWidth: 420 }}>
          <Search size={18} color="#94A3B8" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo họ tên hoặc email..."
            style={{ border: "none", background: "transparent", outline: "none", padding: "10px 8px", width: "100%", fontSize: 14 }}
          />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, width: 170 }}>
          <option value="ALL">Tất cả vai trò</option>
          <option value="USER">Người thuê</option>
          <option value="LANDLORD">Chủ trọ</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: 170 }}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="SUSPENDED">Đã bị khóa</option>
        </select>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading && data.content.length === 0 ? (
          <Spinner />
        ) : data.content.length === 0 ? (
          <EmptyState message="Không tìm thấy người dùng nào phù hợp" />
        ) : (
          <div style={{ overflowX: "auto", opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead>
                <tr>{["Người dùng", "Liên hệ", "Vai trò", "Trạng thái", "Ngày tạo", ""].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.content.map((u) => (
                  <tr key={u.id}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <Avatar user={u} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#0F172A" }}>{u.fullName || "—"}</div>
                          <div style={{ fontSize: 12, color: "#94A3B8" }}>ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={13} color="#94A3B8" /> {u.email}</div>
                      {u.phoneNumber && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748B", marginTop: 2 }}><Phone size={13} color="#94A3B8" /> {u.phoneNumber}</div>}
                    </td>
                    <td style={tdStyle}><RoleBadge role={u.role} /></td>
                    <td style={tdStyle}>
                      <StatusBadge status={u.status === "SUSPENDED" ? "REJECTED" : "ACTIVE"} label={u.status === "SUSPENDED" ? "Đã khóa" : "Hoạt động"} />
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{formatDateTime(u.createdAt)}</td>
                    <td style={tdStyle}>
                      {u.role === "ADMIN" ? (
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>—</span>
                      ) : u.status === "SUSPENDED" ? (
                        <button style={buttonStyle("default", { padding: "6px 12px" })} onClick={() => setConfirm({ type: "unlock", user: u })}>
                          <Unlock size={14} /> Mở khóa
                        </button>
                      ) : (
                        <button style={buttonStyle("ghostDanger", { padding: "6px 12px" })} onClick={() => setConfirm({ type: "lock", user: u })}>
                          <Lock size={14} /> Khóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.number ?? page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={acting}
        title={isLock ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        message={
          confirm
            ? isLock
              ? `Khóa tài khoản "${confirm.user.fullName || confirm.user.email}"? Người dùng sẽ không thể đăng nhập cho tới khi được mở khóa.`
              : `Mở khóa tài khoản "${confirm.user.fullName || confirm.user.email}"?`
            : ""
        }
        confirmText={isLock ? "Khóa tài khoản" : "Mở khóa"}
        variant={isLock ? "danger" : "success"}
      />
    </div>
  );
};

export default AdminUsers;
