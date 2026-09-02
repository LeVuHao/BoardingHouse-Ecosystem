import React, { useState, useEffect } from 'react';
import { notificationApi } from '../api/apiClient';
import { Bell, Check } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
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
              style={{
                background: n.isRead ? 'white' : '#f0fdf4',
                border: n.isRead ? '1px solid var(--border)' : '1px solid #86efac',
                padding: '1.2rem',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
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
                  onClick={() => handleMarkAsRead(n.id)}
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
