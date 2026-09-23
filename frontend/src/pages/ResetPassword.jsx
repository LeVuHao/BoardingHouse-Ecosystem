import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/apiClient";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "450px", marginTop: "3rem" }}>
      <div style={{ background: "white", padding: "2.5rem", borderRadius: "16px", boxShadow: "var(--shadow)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "0.5rem", color: "var(--primary)" }}>Đặt lại mật khẩu</h2>
        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Nhập mã xác thực và mật khẩu mới
        </p>
        {error && <div style={{ color: "var(--danger)", marginBottom: "1rem", textAlign: "center" }}>{error}</div>}

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
            <label>Mã xác thực</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 chữ số gửi tới email"
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          Chưa có mã? <Link to="/forgot-password" style={{ color: "var(--primary)", fontWeight: "bold" }}>Gửi lại mã</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;