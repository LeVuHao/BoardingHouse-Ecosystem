import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/apiClient';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register({ email, password, fullName, phoneNumber });
      alert('Đăng ký tài khoản người dùng thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '2.5rem' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Tạo Tài Khoản Người Thuê</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Họ và tên</label><input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="form-group"><label>Số điện thoại</label><input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></div>
          <div className="form-group"><label>Mật khẩu</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
