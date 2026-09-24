import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/apiClient';
import { Bell, Check } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      const list = res.data?.content || res.data || [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead && !n.read) {
      handleMarkAsRead(n.id);
    }
    if (n.type === 'RENTAL_REQUEST') {
      navigate('/landlord/requests');
    } else if (n.type === 'RENTAL_APPROVED') {
      navigate('/contracts');
    } else if (n.type === 'ROOMMATE_JOIN' || n.type === 'JOIN_REQUEST') {
      navigate('/roommates');
    } else if (n.type === 'FORUM_MESSAGE') {
      navigate('/forum/messages');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Bell size={24} /> Thông Báo Hệ Thống
      </h2>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px' }}>
          Bạn không có thông báo nào mới.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                background: n.isRead ? 'white' : '#f0fdf4',
                border: n.isRead ? '1px solid var(--border)' : '1px solid #86efac',
                padding: '1.2rem',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <h4 style={{ color: 'var(--primary)' }}>{n.title}</h4>
                <p style={{ margin: '0.3rem 0', fontSize: '0.95rem' }}>{n.content}</p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={(e) => handleMarkAsRead(n.id, e)}
                  className="btn btn-outline"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                >
                  <Check size={14} /> Đã đọc
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
