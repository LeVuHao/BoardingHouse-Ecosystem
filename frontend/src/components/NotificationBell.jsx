import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../api/apiClient';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch (err) {
      // Bỏ qua lỗi nếu chưa có thông báo hoặc token hết hạn
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Realtime polling mỗi 20 giây
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="nav-item"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0.4rem',
      }}
      title="Thông báo"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ef4444',
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            borderRadius: '9999px',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 0 2px white',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;