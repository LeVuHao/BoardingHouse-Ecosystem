import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, billingApi } from '../api/apiClient';

const ACTIVATION_FEE = 100000;

const ActivateAccount = () => {
  const [landlord, setLandlord] = useState(null);
  const [status, setStatus] = useState(null); // 'PENDING_PAYMENT' | 'ACTIVE'
  const [checking, setChecking] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingLandlord');
    if (!stored) {
      // Không có thông tin chủ trọ vừa đăng ký -> quay lại trang đăng ký
      navigate('/register-landlord', { replace: true });
      return;
    }
    const parsed = JSON.parse(stored);
    setLandlord(parsed);

    // Luôn kiểm tra trạng thái thật từ server, không tin tưởng dữ liệu cũ trong session
    authApi.getLandlordStatus(parsed.id)
      .then((res) => setStatus(res.data.status))
      .catch(() => setError('Không thể kiểm tra trạng thái tài khoản. Vui lòng thử lại.'))
      .finally(() => setChecking(false));
  }, [navigate]);

  const handlePay = async () => {
    if (!landlord) return;
    setError('');
    setPaying(true);
    try {
      const res = await billingApi.createActivationUrl(landlord.id);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (err) {
      setError(err.message || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
      setPaying(false);
    }
  };

  if (checking) {
    return (
      <div className="container" style={{ maxWidth: '500px', marginTop: '2rem', textAlign: 'center' }}>
        Đang kiểm tra trạng thái tài khoản...
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '2rem' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>
          Kích Hoạt Tài Khoản Chủ Trọ
        </h2>

        {landlord && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Xin chào <strong>{landlord.fullName}</strong> ({landlord.email})
          </p>
        )}

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        {status === 'ACTIVE' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
              ✅ Tài khoản đã được kích hoạt
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Bạn có thể đăng nhập ngay bây giờ để bắt đầu đăng tin cho thuê.
            </p>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ width: '100%', display: 'block', textAlign: 'center' }}
              onClick={() => sessionStorage.removeItem('pendingLandlord')}
            >
              Đến trang đăng nhập
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px',
              background: '#fff3cd', color: '#856404', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1rem'
            }}>
              PENDING_PAYMENT
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Tài khoản của bạn đã được tạo nhưng <strong>chưa thể đăng nhập</strong>. Vui lòng thanh toán phí
              kích hoạt <strong>{ACTIVATION_FEE.toLocaleString('vi-VN')} VNĐ</strong> qua VNPay Sandbox để hoàn tất.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? 'Đang chuyển đến VNPay...' : `Thanh toán ${ACTIVATION_FEE.toLocaleString('vi-VN')} VNĐ qua VNPay`}
            </button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
              Sau khi thanh toán thành công, bạn cần nhấn nút <strong>"Hoàn thành"</strong> ở bước tiếp theo mới
              có thể đăng nhập.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateAccount;