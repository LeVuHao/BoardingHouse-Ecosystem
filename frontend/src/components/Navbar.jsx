import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LogOut, MessageSquare, User, ChevronDown, Building2, 
  FileText, CheckCircle2, Shield, Sparkles 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forumApi } from "../api/apiClient";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
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

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000); // Polling mỗi 15s
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
          <Link to="/rooms" className={`site-nav-link ${location.pathname === "/rooms" ? "active" : ""}`}>
            Tìm phòng
          </Link>
          <Link to="/roommates" className={`site-nav-link ${location.pathname === "/roommates" ? "active" : ""}`}>
            Ở ghép
          </Link>
          <Link to="/forum" className={`site-nav-link ${location.pathname === "/forum" ? "active" : ""}`}>
            Diễn đàn
          </Link>
          
          {user?.role === "LANDLORD" && (
            <>
              <Link to="/forum/create" className="site-nav-link" style={{ color: "#059669", fontWeight: 600 }}>
                + Đăng tin trọ
              </Link>
              <Link to="/landlord/properties" className="site-nav-link">
                Khu trọ
              </Link>
              <Link to="/landlord/requests" className="site-nav-link">
                Yêu cầu thuê
              </Link>
              <Link to="/landlord/create-bill" className="site-nav-link">
                Tạo hóa đơn
              </Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <Link to="/admin" className="site-nav-link">
              Quản trị
            </Link>
          )}

          {user?.role === "USER" && (
            <>
              <Link to="/my-contracts" className="site-nav-link">
                Hợp đồng
              </Link>
              <Link to="/my-bills" className="site-nav-link">
                Hóa đơn
              </Link>
            </>
          )}

          {!user && (
            <Link to="/register-landlord" className="site-nav-link">
              Dành cho chủ trọ
            </Link>
          )}
        </nav>

        {/* Right Side Navigation */}
        <div className="site-nav-right">
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

                    <Link to="/forum/messages" className="nav-menu-item">
                      <MessageSquare size={16} />
                      <span style={{ flex: 1 }}>Tin nhắn liên hệ</span>
                      {unreadMsgCount > 0 && (
                        <span className="nav-menu-pill">{unreadMsgCount} mới</span>
                      )}
                    </Link>

                    {isLandlord && (
                      <>
                        <Link to="/landlord/requests" className="nav-menu-item">
                          <CheckCircle2 size={16} />
                          <span>Yêu cầu thuê phòng</span>
                        </Link>
                        <Link to="/landlord/properties" className="nav-menu-item">
                          <Building2 size={16} />
                          <span>Quản lý khu trọ</span>
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
