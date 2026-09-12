import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, PlusCircle, User, LogOut, ShieldCheck, FileText } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        🏠 Roomily
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-item">Tìm phòng</Link>
        <Link to="/roommates" className="nav-item">Ở ghép</Link>

        {user && user.role === 'LANDLORD' && (
          <>
            <Link to="/landlord/properties" className="nav-item">Quản lý khu trọ</Link>
            <Link to="/landlord/requests" className="nav-item">Yêu cầu thuê</Link>
            <Link to="/landlord/bills" className="nav-item">Hóa đơn</Link>
          </>
        )}

        {user && user.role === 'ADMIN' && (
          <Link to="/admin" className="nav-item" style={{ color: '#ef4444', fontWeight: 'bold' }}>
            <ShieldCheck size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> Admin Dashboard
          </Link>
        )}

        {user && user.role === 'USER' && (
          <Link to="/my-bills" className="nav-item">Hóa đơn của tôi</Link>
        )}
      </div>

      <div className="nav-links">
        {user ? (
          <>
            <NotificationBell />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
              Xin chào, {user.fullName} ({user.role})
            </span>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Đăng nhập</Link>
            <Link to="/register" className="btn btn-primary">Đăng ký</Link>
            <Link to="/register-landlord" className="btn btn-outline" style={{ borderColor: '#4f46e5', color: '#4f46e5' }}>
              Dành cho Chủ trọ
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
