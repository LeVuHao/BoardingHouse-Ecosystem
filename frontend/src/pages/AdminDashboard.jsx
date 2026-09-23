import React, { useState, useEffect } from "react";
import { adminApi } from "../api/apiClient";
import {
  ShieldCheck,
  Users,
  Home,
  AlertTriangle,
  CheckCircle,
  Ban,
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [pageMeta, setPageMeta] = useState({ number: 0, size: 20 });

  const loadData = async () => {
    try {
      const statsRes = await adminApi.getStats();
      setStats(statsRes.data);

      const usersRes = await adminApi.getUsers({
        role: filterRole || undefined,
        status: filterStatus || undefined,
        keyword: debouncedKeyword || undefined,
      });
      const pageData = usersRes.data || {};
      setUsers(pageData.content || []);
      setPageMeta({
        number: pageData.number || 0,
        size: pageData.size || users.length || 20,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus, debouncedKeyword]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const isActive = currentStatus === "ACTIVE";
    const confirmMsg = isActive
      ? "Bạn có chắc muốn KHÓA tài khoản này không?"
      : "Bạn có chắc muốn MỞ KHÓA tài khoản này không?";
    if (!window.confirm(confirmMsg)) return;

    try {
      if (isActive) {
        await adminApi.lockUser(userId);
      } else {
        await adminApi.unlockUser(userId);
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Lỗi cập nhật");
    }
  };

  return (
    <div className="container">
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          color: "#b91c1c",
        }}
      >
        <ShieldCheck size={28} /> Admin Management Dashboard
        <a href="/forum" className="btn btn-outline" style={{ marginLeft: "auto", fontSize: "0.85rem" }}>
          Xem diễn đàn cho thuê
        </a>
      </h2>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ color: "var(--text-muted)" }}>Tổng Người Thuê</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "var(--primary)",
                marginTop: "0.5rem",
              }}
            >
              {stats.totalUsers}
            </div>
          </div>

          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ color: "var(--text-muted)" }}>Tổng Chủ Trọ</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "var(--success)",
                marginTop: "0.5rem",
              }}
            >
              {stats.totalLandlords}
            </div>
          </div>

          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ color: "var(--text-muted)" }}>Tổng Khu Trọ</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#7c3aed",
                marginTop: "0.5rem",
              }}
            >
              {stats.totalProperties ?? 0}
            </div>
          </div>

          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ color: "var(--text-muted)" }}>Tổng Số Phòng</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#0d9488",
                marginTop: "0.5rem",
              }}
            >
              {stats.totalRooms ?? 0}
            </div>
          </div>

          <div
            style={{
              background: "white",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "var(--shadow)",
            }}
          >
            <div style={{ color: "var(--text-muted)" }}>Tài Khoản Bị Khóa</div>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "var(--danger)",
                marginTop: "0.5rem",
              }}
            >
              {stats.suspendedAccounts}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "16px",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3>Danh sách tài khoản hệ thống</h3>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm họ tên hoặc email..."
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                minWidth: "220px",
              }}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px" }}
            >
              <option value="">Tất cả vai trò</option>
              <option value="USER">USER</option>
              <option value="LANDLORD">LANDLORD</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "8px" }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="PENDING">PENDING</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            </select>
          </div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ padding: "0.75rem" }}>STT</th>
              <th style={{ padding: "0.75rem" }}>Họ Tên</th>
              <th style={{ padding: "0.75rem" }}>Email</th>
              <th style={{ padding: "0.75rem" }}>Vai Trò</th>
              <th style={{ padding: "0.75rem" }}>Trạng Thái</th>
              <th style={{ padding: "0.75rem" }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr
                key={u.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "0.75rem" }}>
                  {pageMeta.number * pageMeta.size + index + 1}
                </td>
                <td style={{ padding: "0.75rem", fontWeight: "600" }}>
                  {u.fullName}
                </td>
                <td style={{ padding: "0.75rem" }}>{u.email}</td>
                <td style={{ padding: "0.75rem" }}>
                  <span
                    className="badge"
                    style={{ background: "#f1f5f9", color: "#334155" }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  <span
                    className={`badge ${u.status === "ACTIVE" ? "badge-success" : u.status === "SUSPENDED" ? "badge-danger" : "badge-warning"}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {u.role !== "ADMIN" && (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      className={`btn ${u.status === "ACTIVE" ? "btn-danger" : "btn-success"}`}
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                    >
                      {u.status === "ACTIVE" ? (
                        <Ban size={14} />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      {u.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
