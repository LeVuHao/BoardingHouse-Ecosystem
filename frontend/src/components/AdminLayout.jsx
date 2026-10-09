import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  Moon,
  Sun,
  Menu,
  ChevronLeft,
  ShieldAlert,
  AlertTriangle,
  Tag
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/admin/properties", icon: <Building2 size={20} />, label: "Khu Trọ & Phòng" },
    { path: "/admin/users", icon: <Users size={20} />, label: "Người Dùng & Chủ Trọ" },
    { path: "/admin/landlord-requests", icon: <ShieldAlert size={20} />, label: "Duyệt Đăng Ký Chủ Trọ" },
    { path: "/admin/forum-posts", icon: <MessageSquare size={20} />, label: "Bài Đăng" },
    { path: "/admin/amenities", icon: <Tag size={20} />, label: "Tiện Ích" },
    { path: "/admin/audit-logs", icon: <ShieldAlert size={20} />, label: "Nhật Ký Hệ Thống" },
    { path: "/admin/reports", icon: <AlertTriangle size={20} />, label: "Khiếu Nại & Report" },
    { path: "/admin/settings", icon: <Settings size={20} />, label: "Cài Đặt" }
  ];

  const currentLabel =
    menuItems.find((item) =>
      item.path === "/admin"
        ? location.pathname === "/admin" || location.pathname === "/admin/"
        : location.pathname.startsWith(item.path)
    )?.label || "Dashboard";

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
        color: isDarkMode ? "#F1F5F9" : "#1E293B",
        transition: "all 0.3s ease",
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: isCollapsed ? "80px" : "260px",
          backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
          borderRight: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 10,
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            height: "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: "0 20px",
            borderBottom: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
          }}
        >
          {!isCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                R
              </div>
              <span style={{ fontWeight: "700", fontSize: "1.2rem", letterSpacing: "-0.5px" }}>
                Roomily<span style={{ color: "#8B5CF6" }}>Admin</span>
              </span>
            </div>
          )}
          {isCollapsed && (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
              }}
            >
              R
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {menuItems.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin" || location.pathname === "/admin/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: isActive
                    ? "#8B5CF6"
                    : isDarkMode
                    ? "#94A3B8"
                    : "#64748B",
                  backgroundColor: isActive
                    ? isDarkMode
                      ? "rgba(139, 92, 246, 0.15)"
                      : "#EDE9FE"
                    : "transparent",
                  position: "relative",
                  transition: "all 0.2s ease",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#334155"
                      : "#F1F5F9";
                    e.currentTarget.style.color = isDarkMode ? "#F8FAFC" : "#0F172A";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = isDarkMode ? "#94A3B8" : "#64748B";
                  }
                }}
              >
                {isActive && !isCollapsed && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "10%",
                      bottom: "10%",
                      width: "4px",
                      backgroundColor: "#8B5CF6",
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center" }}>{item.icon}</div>
                {!isCollapsed && <span style={{ fontWeight: isActive ? "600" : "500" }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div
          style={{
            padding: "20px",
            borderTop: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
          }}
        >
          {!isCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{user?.fullName || "Admin"}</span>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Admin</span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header
          style={{
            height: "70px",
            padding: "0 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${isDarkMode ? "#334155" : "#E2E8F0"}`,
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: "none",
                border: "none",
                color: isDarkMode ? "#94A3B8" : "#64748B",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "8px",
              }}
            >
              {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div style={{ color: isDarkMode ? "#94A3B8" : "#64748B", fontSize: "14px", fontWeight: "500" }}>
              Admin / <span style={{ color: "#8B5CF6" }}>{currentLabel}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Search Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9",
                padding: "8px 16px",
                borderRadius: "20px",
                width: "250px",
                border: `1px solid ${isDarkMode ? "#334155" : "transparent"}`,
              }}
            >
              <Search size={16} color={isDarkMode ? "#94A3B8" : "#94A3B8"} />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                style={{
                  border: "none",
                  background: "none",
                  outline: "none",
                  marginLeft: "10px",
                  fontSize: "14px",
                  color: isDarkMode ? "#F1F5F9" : "#0F172A",
                  width: "100%",
                }}
              />
            </div>

            {/* Actions */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                background: "none",
                border: "none",
                color: isDarkMode ? "#FBBF24" : "#64748B",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                color: isDarkMode ? "#94A3B8" : "#64748B",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={20} />
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#EF4444",
                  borderRadius: "50%",
                  border: `2px solid ${isDarkMode ? "#0F172A" : "#FFFFFF"}`,
                }}
              />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "30px",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;