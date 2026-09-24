import React, { useState, useEffect } from 'react';
import { contractApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { FileText, Calendar, DollarSign, Home } from 'lucide-react';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang hiệu lực', cls: 'badge-success' },
  EXPIRED: { label: 'Đã hết hạn', cls: 'badge-warning' },
  TERMINATED: { label: 'Đã chấm dứt', cls: 'badge-danger' },
};

const MyContracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = user?.role === 'LANDLORD'
          ? await contractApi.getLandlordContracts()
          : await contractApi.getMyContracts();
        setContracts(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [user]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Đang tải hợp đồng...</div>;
  }

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
        <FileText size={28} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Hợp đồng thuê phòng của tôi</h2>
      </div>

      {contracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
          <Home size={56} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <h3>Chưa có hợp đồng nào</h3>
          <p>Hợp đồng sẽ xuất hiện ở đây sau khi yêu cầu thuê phòng được duyệt.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {contracts.map((c) => {
            const st = STATUS_MAP[c.status] || { label: c.status, cls: 'badge-warning' };
            return (
              <div key={c.id} style={{
                background: 'white', borderRadius: '16px', padding: '1.5rem',
                boxShadow: 'var(--shadow)', border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.3rem' }}>Hợp đồng #{c.id}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Phòng ID: {c.roomId}</div>
                  </div>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Giá thuê</div>
                      <div style={{ fontWeight: '700', color: 'var(--primary)' }}>
                        {Number(c.rentalPrice).toLocaleString('vi-VN')} đ/tháng
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="#06b6d4" />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ngày bắt đầu</div>
                      <div style={{ fontWeight: '600' }}>{c.startDate}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="#8b5cf6" />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ngày kết thúc</div>
                      <div style={{ fontWeight: '600' }}>{c.endDate || 'Chưa xác định'}</div>
                    </div>
                  </div>
                </div>

                {c.depositAmount && (
                  <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '10px', fontSize: '0.85rem' }}>
                    💰 Tiền đặt cọc: <strong>{Number(c.depositAmount).toLocaleString('vi-VN')} đ</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyContracts;
