import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="site-header">
      <div className="wrap site-nav">
        <Link to="/" className="brand">Trọ<span>Chuẩn</span></Link>
        <nav className="site-nav-links">
          <Link to="/rooms" className="site-nav-link">Tìm phòng</Link>
          <Link to="/roommates" className="site-nav-link">Ở ghép</Link>
          <Link to="/register-landlord" className="site-nav-link">Dành cho chủ trọ</Link>
          {user?.role === 'LANDLORD' && <>
            <Link to="/landlord/properties" className="site-nav-link">Khu trọ</Link>
            <Link to="/landlord/requests" className="site-nav-link">Yêu cầu thuê</Link>
            <Link to="/landlord/create-bill" className="site-nav-link">Tạo hóa đơn</Link>
          </>}
          {user?.role === 'ADMIN' && <Link to="/admin" className="site-nav-link">Quản trị</Link>}
          {user?.role === 'USER' && <Link to="/my-contracts" className="site-nav-link">Hợp đồng</Link>}
        </nav>
        <div className="site-nav-right">
          {user ? <>
            <NotificationBell />
            <span className="nav-user">Xin chào, {user.fullName}</span>
            {user.role === 'USER' && <Link to="/my-bills" className="site-nav-link">Hóa đơn</Link>}
            <button onClick={handleLogout} className="btn"><LogOut size={16} /> Đăng xuất</button>
          </> : <>
            <Link to="/login" className="site-nav-link">Đăng nhập</Link>
            <Link to="/register-landlord" className="btn btn-primary">Đăng tin cho thuê</Link>
          </>}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
