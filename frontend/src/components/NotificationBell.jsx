import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Info } from 'lucide-react';
import { notificationApi } from '../api/apiClient';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      const list = res.data?.content || res.data || [];
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead && !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      // Bỏ qua lỗi nếu chưa có thông báo hoặc token hết hạn
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Realtime polling mỗi 20 giây
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead && !n.read) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);
    if (n.type === 'RENTAL_REQUEST') {
      navigate('/landlord/requests');
    } else if (n.type === 'RENTAL_APPROVED') {
      navigate('/contracts');
    } else if (n.type === 'ROOMMATE_JOIN' || n.type === 'JOIN_REQUEST') {
      navigate('/roommates');
    } else if (n.type === 'FORUM_MESSAGE') {
      navigate('/forum/messages');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <div className="notif-dropdown">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.6rem',
              marginBottom: '0.6rem',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Thông Báo</h4>
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}
            >
              Xem tất cả
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Chưa có thông báo nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.slice(0, 5).map((n) => {
                const isRead = n.isRead || n.read;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      background: isRead ? 'transparent' : 'var(--primary-light)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (isRead) e.currentTarget.style.background = 'var(--bg-main)';
                    }}
                    onMouseLeave={(e) => {
                      if (isRead) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Info size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: isRead ? '500' : '700', color: 'var(--text-main)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{n.content}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        title="Đánh dấu đã đọc"
                        style={{
                          background: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={12} color="var(--success)" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
