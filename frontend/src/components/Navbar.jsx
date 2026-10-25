import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LogOut, MessageSquare, User, ChevronDown, Building2, 
  FileText, CheckCircle2, Shield, Sparkles, Wrench, AlertTriangle, Heart, Home, Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumApi, maintenanceApi } from "../api/apiClient";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [ticketUrgentCount, setTicketUrgentCount] = useState(0);
  const dropdownRef = useRef(null);

  // Lấy số lượng tin nhắn chưa đọc
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await forumApi.getUnreadMessageCount();
      const count = typeof res.data === "number" ? res.data : (res.data?.data || 0);
      setUnreadMsgCount(count);
    } catch {
      // Bỏ qua lỗi nếu chưa có quyền
    }
  };

  // Lấy số ticket khẩn cấp cho landlord
  const fetchTicketStats = async () => {
    if (!user || user.role !== "LANDLORD") return;
    try {
      const res = await maintenanceApi.getLandlordStats();
      const data = res.data || res;
      setTicketUrgentCount(data.activeCount || 0);
    } catch {
      // ignore
    }
  };

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchTicketStats();
      const interval = setInterval(() => { fetchUnreadCount(); fetchTicketStats(); }, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Đóng dropdown khi chuyển trang hoặc click ra ngoài
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isLandlord = user?.role === "LANDLORD";
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="site-header">
      <div className="wrap site-nav">
        {/* Brand Logo */}
        <Link to="/" className="brand">
          Room<span>ily</span>
        </Link>

        {/* Navigation Links */}
        <nav className="site-nav-links">
          <Link to="/rooms" className={`site-nav-link ${location.pathname === "/rooms" || location.pathname === "/search" ? "active" : ""}`}>
            Tìm phòng
          </Link>
          <Link to="/forum" className={`site-nav-link ${location.pathname === "/forum" ? "active" : ""}`}>
            Diễn đàn
          </Link>
          <Link to="/roommates" className={`site-nav-link ${location.pathname === "/roommates" ? "active" : ""}`}>
            Ở ghép
          </Link>
          
          {user?.role === "LANDLORD" && (
            <>
              <Link 
                to="/forum/create" 
                className={`site-nav-link ${location.pathname === "/forum/create" ? "active" : ""}`} 
                style={{ color: location.pathname === "/forum/create" ? "var(--ink)" : "#059669", fontWeight: 600 }}
              >
                + Đăng tin trọ
              </Link>
              <Link 
                to="/landlord/management" 
                className={`site-nav-link ${location.pathname.startsWith("/landlord") ? "active" : ""}`}
                style={{ fontWeight: 700, position: "relative" }}
              >
                Quản lý trọ của tôi
                {ticketUrgentCount > 0 && (
                  <span style={{
                    position: "absolute", top: -6, right: -12,
                    background: "#ef4444", color: "#fff",
                    fontSize: 10, fontWeight: 800, borderRadius: 20,
                    padding: "1px 5px", minWidth: 16, textAlign: "center",
                    animation: "pulse 2s ease-in-out infinite"
                  }}>{ticketUrgentCount}</span>
                )}
              </Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <Link to="/admin" className={`site-nav-link ${location.pathname.startsWith("/admin") ? "active" : ""}`}>
              Quản trị
            </Link>
          )}

          {user?.role === "USER" && (
            <>
              <Link to="/contracts" className={`site-nav-link ${location.pathname === "/contracts" || location.pathname === "/my-contracts" ? "active" : ""}`}>
                Hợp đồng thuê
              </Link>
              <Link to="/my-bills" className={`site-nav-link ${location.pathname === "/my-bills" ? "active" : ""}`}>
                Hóa đơn
              </Link>
              <Link to="/maintenance" className={`site-nav-link ${location.pathname === "/maintenance" ? "active" : ""}`}>
                Báo hỏng
              </Link>
            </>
          )}

          {!user && (
            <Link to="/register-landlord" className={`site-nav-link ${location.pathname === "/register-landlord" ? "active" : ""}`}>
              Dành cho chủ trọ
            </Link>
          )}
        </nav>

        {/* Right Side Navigation */}
        <div className="site-nav-right">
          {/* Theme Switcher Toggle (Dark / Light Mode) */}
          <ThemeToggle />

          {user ? (
            <>
              {/* Message Icon with Unread Badge */}
              <Link 
                to="/forum/messages" 
                className="nav-icon-btn" 
                title="Hộp thư tin nhắn diễn đàn"
                style={{ position: "relative" }}
              >
                <MessageSquare size={20} />
                {unreadMsgCount > 0 && (
                  <span className="nav-badge-pulse" title={`${unreadMsgCount} tin nhắn mới`}>
                    {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Interactive User Avatar Dropdown */}
              <div className="nav-profile-container" ref={dropdownRef}>
                <button 
                  className="nav-profile-trigger" 
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-expanded={profileOpen}
                >
                  <div className="nav-avatar-circle">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="nav-avatar-img" />
                    ) : (
                      <span className="nav-avatar-text">
                        {(user.fullName || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="nav-online-dot"></span>
                  </div>
                  <div className="nav-user-info-text">
                    <span className="nav-user-name">{user.fullName || "Tài khoản"}</span>
                    <span className={`nav-role-badge ${isLandlord ? "role-landlord" : isAdmin ? "role-admin" : "role-user"}`}>
                      {isLandlord ? "Chủ trọ" : isAdmin ? "Admin" : "Cư dân"}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`nav-chevron ${profileOpen ? "rotate" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="nav-profile-menu">
                    <div className="nav-menu-header">
                      <div className="nav-menu-avatar">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} />
                        ) : (
                          <span>{(user.fullName || "U").charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="nav-menu-meta">
                        <div className="nav-menu-fullname">{user.fullName}</div>
                        <div className="nav-menu-email">{user.email}</div>
                      </div>
                    </div>

                    <div className="nav-menu-divider"></div>

                    <Link to="/profile" className="nav-menu-item">
                      <User size={16} />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link to="/wishlist" className="nav-menu-item">
                      <Heart size={16} />
                      <span>Phòng đã lưu</span>
                    </Link>

                    <Link to="/forum/messages" className="nav-menu-item">
                      <MessageSquare size={16} />
                      <span style={{ flex: 1 }}>Tin nhắn liên hệ</span>
                      {unreadMsgCount > 0 && (
                        <span className="nav-menu-pill">{unreadMsgCount} mới</span>
                      )}
                    </Link>

                    {isLandlord && (
                      <>
                        <Link to="/landlord/management" className="nav-menu-item" style={{ fontWeight: 800, color: '#2563eb' }}>
                          <Home size={16} />
                          <span>Quản lý trọ của tôi</span>
                        </Link>
                        <Link to="/landlord/management?tab=properties" className="nav-menu-item" style={{ paddingLeft: '28px', fontSize: '13px' }}>
                          <Building2 size={14} />
                          <span>Khu trọ & Phòng</span>
                        </Link>
                        <Link to="/landlord/management?tab=occupied" className="nav-menu-item" style={{ paddingLeft: '28px', fontSize: '13px' }}>
                          <CheckCircle2 size={14} />
                          <span>Trọ đã cho thuê</span>
                        </Link>
                        <Link to="/landlord/management?tab=requests" className="nav-menu-item" style={{ paddingLeft: '28px', fontSize: '13px' }}>
                          <Users size={14} />
                          <span>Khách thuê & Yêu cầu</span>
                        </Link>
                        <Link to="/landlord/management?tab=contracts" className="nav-menu-item" style={{ paddingLeft: '28px', fontSize: '13px' }}>
                          <FileText size={14} />
                          <span>Hợp đồng điện tử</span>
                        </Link>
                        <Link to="/landlord/management?tab=tickets" className="nav-menu-item" style={{ paddingLeft: '28px', fontSize: '13px' }}>
                          <Wrench size={14} />
                          <span style={{ flex: 1 }}>Sự cố báo hỏng</span>
                          {ticketUrgentCount > 0 && (
                            <span className="nav-menu-pill" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                              {ticketUrgentCount} mới
                            </span>
                          )}
                        </Link>
                        <Link to="/landlord/management?tab=bills" className="nav-menu-item" style={{ paddingLeft: '28px', fontSize: '13px' }}>
                          <FileText size={14} />
                          <span>Tạo hóa đơn</span>
                        </Link>
                      </>
                    )}

                    {user.role === "USER" && (
                      <>
                        <Link to="/my-contracts" className="nav-menu-item">
                          <FileText size={16} />
                          <span>Hợp đồng của tôi</span>
                        </Link>
                        <Link to="/my-bills" className="nav-menu-item">
                          <Building2 size={16} />
                          <span>Hóa đơn phòng</span>
                        </Link>
                      </>
                    )}

                    <div className="nav-menu-divider"></div>

                    <button onClick={handleLogout} className="nav-menu-item nav-menu-logout">
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="site-nav-link">
                Đăng nhập
              </Link>
              <Link to="/register-landlord" className="btn btn-primary">
                Đăng tin cho thuê
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
