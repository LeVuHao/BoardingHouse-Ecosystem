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
    <div className="container" style={{ maxWidth: '800px', paddingTop: '24px', paddingBottom: '60px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        <Bell size={24} color="var(--primary)" /> Thông Báo Hệ Thống
      </h2>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
          Bạn không có thông báo nào mới.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                background: n.isRead ? 'var(--bg-card)' : 'rgba(16, 185, 129, 0.12)',
                border: n.isRead ? '1px solid var(--border-color)' : '1px solid rgba(16, 185, 129, 0.35)',
                color: 'var(--text-primary)',
                padding: '1.2rem 1.4rem',
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ color: n.isRead ? 'var(--text-primary)' : 'var(--primary)', margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700 }}>
                  {n.title}
                </h4>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.94rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {n.content}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={(e) => handleMarkAsRead(n.id, e)}
                  className="btn btn-outline"
                  style={{
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
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
