import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { billingApi } from '../api/apiClient';

const ActivateAccountCallback = () => {
  const [state, setState] = useState('loading'); // 'loading' | 'success' | 'failed'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const queryString = window.location.search; // giữ nguyên các tham số vnp_* mà VNPay trả về
    if (!queryString) {
      setState('failed');
      setMessage('Không nhận được thông tin giao dịch từ VNPay.');
      return;
    }

    billingApi.confirmVnpayCallback(queryString)
      .then((res) => {
        const result = res.data || {};
        if (result.success) {
          setState('success');
          setMessage(result.message || 'Thanh toán thành công!');
        } else {
          setState('failed');
          setMessage(result.message || 'Giao dịch thanh toán thất bại hoặc đã bị hủy.');
        }
      })
      .catch((err) => {
        setState('failed');
        setMessage(err.message || 'Không thể xác nhận giao dịch. Vui lòng thử lại.');
      });
  }, []);

  const handleComplete = () => {
    // Chỉ khi bấm nút này mới thực sự cho phép người dùng vào trang đăng nhập
    sessionStorage.removeItem('pendingLandlord');
    navigate('/login', { replace: true });
  };

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '2rem' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
        {state === 'loading' && (
          <>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Đang xác nhận thanh toán...</h2>
            <p style={{ color: 'var(--text-muted)' }}>Vui lòng đợi trong giây lát.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
              🎉 Thanh toán thành công!
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Nhấn <strong>"Hoàn thành"</strong> để hoàn tất kích hoạt và chuyển đến trang đăng nhập.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleComplete}>
              Hoàn thành
            </button>
          </>
        )}

        {state === 'failed' && (
          <>
            <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Thanh toán chưa thành công</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/activate-account" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
              Thử lại
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivateAccountCallback;