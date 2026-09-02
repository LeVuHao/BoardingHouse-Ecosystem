import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/apiClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      login(res.data);
      const role = res.data.user.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'LANDLORD') navigate('/landlord/properties');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '3rem' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Đăng nhập Roomily</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
