import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/apiClient";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || "Không thể gửi mã xác thực");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="container" style={{ maxWidth: "450px", marginTop: "3rem" }}>
        <div style={{ background: "white", padding: "2.5rem", borderRadius: "16px", boxShadow: "var(--shadow)", textAlign: "center" }}>
          <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>Đã gửi mã xác thực</h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Kiểm tra email <strong>{email}</strong> để lấy mã đặt lại mật khẩu. Mã có hiệu lực trong 10 phút.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => navigate("/reset-password", { state: { email } })}
          >
            Nhập mã đặt lại mật khẩu
          </button>
          <div style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
            <Link to="/login" style={{ color: "var(--text-muted)" }}>Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: "450px", marginTop: "3rem" }}>
      <div style={{ background: "white", padding: "2.5rem", borderRadius: "16px", boxShadow: "var(--shadow)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "0.5rem", color: "var(--primary)" }}>Quên mật khẩu</h2>
        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Nhập email đã đăng ký để nhận mã xác thực
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
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi mã xác thực"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <Link to="/login" style={{ color: "var(--text-muted)" }}>Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;