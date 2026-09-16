import React, { useState, useEffect } from 'react';
import { rentalApi } from '../api/apiClient';
import toast from 'react-hot-toast';
import { Check, X, Loader, Clock, User, Home, MessageSquare } from 'lucide-react';

const LandlordRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await rentalApi.getLandlordRequests({ status: 'PENDING' });
      const data = res.data?.content || res.data?.data?.content || res.data?.data || res.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Không thể tải danh sách yêu cầu thuê');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await rentalApi.approveRentalRequest(requestId);
      toast.success('Đã duyệt yêu cầu thuê phòng thành công! Hợp đồng đã được tạo.');
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt yêu cầu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu này không?')) return;
    
    try {
      setProcessingId(requestId);
      await rentalApi.rejectRentalRequest(requestId);
      toast.success('Đã từ chối yêu cầu thuê phòng');
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi từ chối yêu cầu');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader size={40} className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải danh sách yêu cầu...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Danh Sách Yêu Cầu Thuê Phòng</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Các yêu cầu đang chờ duyệt từ người thuê
          </p>
        </div>
        <div className="badge badge-warning" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
          <Clock size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
          Chờ duyệt: {requests.length}
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h3>Không có yêu cầu nào đang chờ duyệt</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Tất cả các yêu cầu thuê phòng đã được xử lý
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem 2rem',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '2rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
            >
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  #{String(req.userId).slice(-1)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.6rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                      Người dùng #{req.userId}
                    </h3>
                    <span className="badge badge-warning">{req.status || 'PENDING'}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <User size={16} />
                      <span>Mã người dùng: <strong style={{ color: 'var(--text)' }}>#{req.userId}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Home size={16} />
                      <span>Mã phòng: <strong style={{ color: 'var(--primary)' }}>#{req.roomId}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Clock size={16} />
                      <span>Ngày gửi: <strong style={{ color: 'var(--text)' }}>{formatDate(req.createdAt)}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span>Mã yêu cầu: <strong style={{ color: 'var(--text)' }}>#{req.id}</strong></span>
                    </div>
                  </div>

                  {req.note && (
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      borderLeft: '3px solid var(--primary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                        <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>Lời nhắn từ người thuê:</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{req.note}</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '120px' }}>
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={processingId === req.id}
                  className="btn btn-success"
                  style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {processingId === req.id ? <Loader size={16} className="spinner" /> : <Check size={18} />}
                  Duyệt
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={processingId === req.id}
                  className="btn btn-danger"
                  style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  {processingId === req.id ? <Loader size={16} className="spinner" /> : <X size={18} />}
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandlordRequests;
