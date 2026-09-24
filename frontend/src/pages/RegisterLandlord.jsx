import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/apiClient";

const RegisterLandlord = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.registerLandlord({
        email,
        password,
        fullName,
        phoneNumber,
        idCardNumber,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "500px", marginTop: "2rem" }}>
      <div
        style={{
          background: "white",
          padding: "2.5rem",
          borderRadius: "16px",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "0.5rem",
            color: "var(--primary)",
          }}
        >
          Đăng Ký Tài Khoản Chủ Trọ
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          Đăng ký thông tin chủ trọ để bắt đầu quản lý phòng
        </p>

        {error && (
          <div
            style={{
              color: "var(--danger)",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Số CCCD / CMND</label>
            <input
              required
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Đang khởi tạo..." : "Đăng ký Chủ trọ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterLandlord;
