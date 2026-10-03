import React, { useState, useEffect } from "react";
import { adminApi } from "../api/apiClient";
import {
  Users,
  Building2,
  DoorOpen,
  Ban,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

// Dummy data for charts to make it look premium
const revenueData = [
  { name: "T1", value: 1200 },
  { name: "T2", value: 1900 },
  { name: "T3", value: 1500 },
  { name: "T4", value: 2400 },
  { name: "T5", value: 2100 },
  { name: "T6", value: 3200 },
];

const occupancyData = [
  { name: "Đang thuê", value: 75 },
  { name: "Trống", value: 25 },
];
const COLORS = ["#8B5CF6", "#E2E8F0"];

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
    if (!window.confirm(isActive ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?")) return;

    try {
      if (isActive) {
        await adminApi.lockUser(userId);
        toast.success("Đã khóa tài khoản");
      } else {
        await adminApi.unlockUser(userId);
        toast.success("Đã mở khóa tài khoản");
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Lỗi cập nhật");
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, isPositive, color }) => (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, color: "#64748B", fontSize: "14px", fontWeight: "500" }}>{title}</p>
          <h3 style={{ margin: "8px 0 0 0", fontSize: "28px", fontWeight: "700", color: "#0F172A" }}>
            {value !== undefined ? value : "..."}
          </h3>
        </div>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
          }}
        >
          <Icon size={24} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
        <span
          style={{
            color: isPositive ? "#10B981" : "#EF4444",
            display: "flex",
            alignItems: "center",
            fontWeight: "600",
          }}
        >
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {trend}
        </span>
        <span style={{ color: "#94A3B8" }}>so với tháng trước</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* HEADER SECTION */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", margin: 0 }}>
          Overview Dashboard
        </h1>
        <p style={{ color: "#64748B", margin: "4px 0 0 0", fontSize: "14px" }}>
          Theo dõi các chỉ số quan trọng của nền tảng Roomily.
        </p>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        <StatCard
          title="Tổng Người Thuê"
          value={stats?.totalUsers}
          icon={Users}
          trend="12.5%"
          isPositive={true}
          color="#3B82F6"
        />
        <StatCard
          title="Chủ Trọ Đối Tác"
          value={stats?.totalLandlords}
          icon={Building2}
          trend="5.2%"
          isPositive={true}
          color="#8B5CF6"
        />
        <StatCard
          title="Tổng Số Phòng"
          value={stats?.totalRooms}
          icon={DoorOpen}
          trend="2.4%"
          isPositive={true}
          color="#10B981"
        />
        <StatCard
          title="Tài Khoản Vi Phạm"
          value={stats?.suspendedAccounts}
          icon={Ban}
          trend="1.1%"
          isPositive={false}
          color="#EF4444"
        />
      </div>

      {/* CHARTS SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#0F172A" }}>Tăng trưởng người dùng mới</h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  itemStyle={{ color: "#8B5CF6", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#0F172A" }}>Tỉ lệ lấp đầy phòng</h3>
          <div style={{ height: "300px", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <span style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A" }}>75%</span>
              <br />
              <span style={{ fontSize: "12px", color: "#64748B" }}>Đã thuê</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#0F172A" }}>Tài khoản hệ thống</h3>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm user..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                outline: "none",
                fontSize: "14px",
                width: "250px",
              }}
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E8F0", outline: "none", fontSize: "14px", background: "white" }}
            >
              <option value="">Vai trò</option>
              <option value="USER">USER</option>
              <option value="LANDLORD">LANDLORD</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: "13px", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600" }}>Thành viên</th>
                <th style={{ padding: "12px 16px", fontWeight: "600" }}>Vai trò</th>
                <th style={{ padding: "12px 16px", fontWeight: "600" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#475569" }}>
                      {u.fullName?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "#0F172A", fontSize: "14px" }}>{u.fullName}</div>
                      <div style={{ color: "#64748B", fontSize: "13px" }}>{u.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: u.role === "LANDLORD" ? "#EDE9FE" : "#F1F5F9", color: u.role === "LANDLORD" ? "#6D28D9" : "#475569" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", background: u.status === "ACTIVE" ? "#DCFCE7" : "#FEE2E2", color: u.status === "ACTIVE" ? "#166534" : "#991B1B" }}>
                      {u.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        style={{
                          background: "none",
                          border: "none",
                          color: u.status === "ACTIVE" ? "#EF4444" : "#10B981",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = u.status === "ACTIVE" ? "#FEE2E2" : "#DCFCE7")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        title={u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        <Ban size={18} />
                      </button>
                    )}
                    <button style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "6px", marginLeft: "8px" }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
                    Không tìm thấy dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
