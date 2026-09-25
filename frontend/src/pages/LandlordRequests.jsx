import React, { useState, useEffect, useCallback } from 'react';
import { authApi, rentalApi } from '../api/apiClient';
import toast from 'react-hot-toast';
import { Check, X, Loader, Clock, User, Home, MessageSquare, Phone, RotateCw, CheckCircle2, XCircle, CalendarRange } from 'lucide-react';

const LandlordRequests = () => {
  const [requests, setRequests] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | APPROVED | REJECTED | ALL

  const fetchUserInfo = async (userIds) => {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const info = {};
    await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const res = await authApi.getUserInfo(id);
          const u = res.data?.data || res.data;
          if (u) info[id] = u;
        } catch (err) {
          console.warn(`Không lấy được thông tin user #${id}`, err);
        }
      })
    );
    setUserMap(info);
  };

  const fetchRequests = useCallback(async (tab = activeTab, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const params = tab === 'ALL' ? {} : { status: tab };
      const res = await rentalApi.getLandlordRequests(params);
      const data = res.data?.content || res.data?.data?.content || res.data?.data || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setRequests(list);
      fetchUserInfo(list.map((r) => r.userId));
    } catch (err) {
      console.error(err);
      if (showLoading) toast.error('Không thể tải danh sách yêu cầu thuê');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRequests(activeTab, true);
  }, [activeTab, fetchRequests]);

  // Polling tự động mỗi 10 giây để cập nhật tức thời khi có khách gửi yêu cầu mới
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRequests(activeTab, false);
    }, 10000);
    return () => clearInterval(timer);
  }, [activeTab, fetchRequests]);

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await rentalApi.approveRentalRequest(requestId);
      toast.success('🎉 Đã duyệt yêu cầu thuê phòng thành công! Hợp đồng và cư dân đã được kích hoạt.');
      // Refresh list
      fetchRequests(activeTab, false);
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
      fetchRequests(activeTab, false);
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

  const renderStatusBadge = (status) => {
    if (status === 'APPROVED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#dcfce7', color: '#166534', padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          <CheckCircle2 size={14} /> ĐÃ DUYỆT
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fee2e2', color: '#991b1b', padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          <XCircle size={14} /> ĐÃ TỪ CHỐI
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 'bold' }}>
        <Clock size={14} /> CHỜ DUYỆT
      </span>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, fontFamily: '"Manrope", sans-serif' }}>Quản Lý Yêu Cầu Thuê Trọ</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Xem xét và phê duyệt các yêu cầu thuê phòng từ khách hàng trên hệ thống
          </p>
        </div>

        <button
          onClick={() => fetchRequests(activeTab, false)}
          disabled={refreshing}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          title="Tải lại danh sách"
        >
          <RotateCw size={16} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'PENDING', label: 'Chờ duyệt', icon: Clock },
          { key: 'APPROVED', label: 'Đã duyệt', icon: CheckCircle2 },
          { key: 'REJECTED', label: 'Đã từ chối', icon: XCircle },
          { key: 'ALL', label: 'Tất cả yêu cầu', icon: null },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
              {tab.key === 'PENDING' && requests.length > 0 && activeTab === 'PENDING' && (
                <span style={{ background: 'white', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {requests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
          <Loader size={40} className="spinner" style={{ color: 'var(--primary)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải danh sách yêu cầu thuê...</p>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
            {activeTab === 'PENDING' ? 'Không có yêu cầu nào đang chờ duyệt' : 'Chưa có yêu cầu nào'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {activeTab === 'PENDING'
              ? 'Tất cả các yêu cầu thuê phòng đã được bạn xử lý hoàn tất.'
              : 'Danh sách này hiện tại đang trống.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {requests.map((req) => {
            const requester = userMap[req.userId];
            const avatarText = requester?.fullName
              ? requester.fullName.trim().charAt(0).toUpperCase()
              : `#${String(req.userId).slice(-1)}`;
            return (
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
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
            >
              <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Avatar */}
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
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                  }}
                >
{avatarText}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {requester?.fullName || req.senderName || `Khách thuê #${req.userId}`}
                    </h3>
                    {renderStatusBadge(req.status)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem 1.5rem', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <User size={16} />
                      <span>{requester?.phoneNumber ? `SĐT: ${requester.phoneNumber}` : `Mã khách: #${req.userId}`}</span>
                    </div>

                    {req.senderPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <Phone size={16} style={{ color: 'var(--primary)' }} />
                        <span>SĐT: <strong style={{ color: 'var(--primary)' }}>{req.senderPhone}</strong></span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Home size={16} />
                      <span>Tin đăng / Phòng: <strong style={{ color: 'var(--primary)' }}>{req.postTitle || req.propertyTitle || (req.roomNumber ? `Phòng ${req.roomNumber}` : `#${req.roomId}`)}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <Clock size={16} />
                      <span>Gửi lúc: <strong style={{ color: 'var(--text)' }}>{formatDate(req.createdAt)}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <CalendarRange size={16} />
                      <span>Thời hạn thuê: <strong style={{ color: 'var(--text)' }}>{req.durationMonths || 12} tháng</strong></span>
                    </div>
                  </div>

                  {req.note && (
                    <div style={{
                      background: 'var(--bg-main)',
                      padding: '0.8rem 1.2rem',
                      borderRadius: '10px',
                      borderLeft: '4px solid var(--primary)',
                      marginTop: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <MessageSquare size={15} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>Nội dung yêu cầu từ khách:</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{req.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'PENDING' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '130px' }}>
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="btn btn-success"
                    style={{ padding: '0.7rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                  >
                    {processingId === req.id ? <Loader size={16} className="spinner" /> : <Check size={18} />}
                    Duyệt thuê
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={processingId === req.id}
                    className="btn btn-danger"
                    style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    {processingId === req.id ? <Loader size={16} className="spinner" /> : <X size={18} />}
                    Từ chối
                  </button>
                </div>
              ) : (
                <div style={{ minWidth: '130px', textAlign: 'center' }}>
                  {renderStatusBadge(req.status)}
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

export default LandlordRequests;
