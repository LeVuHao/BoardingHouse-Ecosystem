import React, { useEffect, useRef, useState } from "react";
import { authApi } from "../api/apiClient";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleButton = ({ defaultRole = "USER", onSuccess }) => {
  const buttonRef = useRef(null);
  const handleRef = useRef(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [credential, setCredential] = useState("");
  const [role, setRole] = useState(defaultRole === "LANDLORD" ? "LANDLORD" : "USER");
  const [phone, setPhone] = useState("");
  const [idCard, setIdCard] = useState("");

  const handleGoogleToken = async (idToken) => {
    setLoading(true);
    setError("");
    try {
      const res = await authApi.loginWithGoogle({ idToken });
      if (res.data && res.data.needsProfile) {
        setCredential(idToken);
        setRole(defaultRole === "LANDLORD" ? "LANDLORD" : "USER");
        setDialogOpen(true);
      } else {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };
  handleRef.current = handleGoogleToken;

  useEffect(() => {
    if (!CLIENT_ID) return;

    const render = () => {
      if (!window.google || !window.google.accounts) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          if (response && response.credential) handleRef.current(response.credential);
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: "100%",
          logo_alignment: "left",
        });
      }
    };

    if (document.getElementById("gsi-script")) {
      setScriptLoaded(true);
      render();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = "gsi-script";
    script.onload = () => {
      setScriptLoaded(true);
      render();
    };
    document.body.appendChild(script);
  }, []);

  const submitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { idToken: credential, role, phoneNumber: phone };
      if (role === "LANDLORD") payload.idCardNumber = idCard;
      const res = await authApi.loginWithGoogle(payload);
      setDialogOpen(false);
      onSuccess(res.data);
    } catch (err) {
      setError(err.message || "Hoàn tất hồ sơ thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {CLIENT_ID ? (
        <div
          ref={buttonRef}
          style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}
        />
      ) : (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "8px",
            background: "#fff8e1",
            color: "#8a6d00",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          Google login chưa được cấu hình (VITE_GOOGLE_CLIENT_ID)
        </div>
      )}
      {error && (
        <div style={{ color: "var(--danger)", marginTop: "0.75rem", textAlign: "center" }}>{error}</div>
      )}

      {dialogOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={submitProfile}
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "16px",
              width: "min(420px, 92vw)",
              boxShadow: "var(--shadow)",
            }}
          >
            <h3 style={{ marginBottom: "0.25rem", color: "var(--primary)" }}>Hoàn tất hồ sơ</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Tài khoản Google mới cần bổ sung thông tin để kích hoạt
            </p>

            <div className="form-group">
              <label>Bạn sử dụng Roomily với vai trò</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: "10px",
                    border: role === "USER" ? "2px solid var(--primary)" : "1px solid #d0d0d0",
                    background: role === "USER" ? "var(--primary-light)" : "white",
                    fontWeight: role === "USER" ? 700 : 400,
                    color: role === "USER" ? "var(--primary)" : "inherit",
                    cursor: "pointer",
                  }}
                >
                  Người thuê
                </button>
                <button
                  type="button"
                  onClick={() => setRole("LANDLORD")}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: "10px",
                    border: role === "LANDLORD" ? "2px solid var(--primary)" : "1px solid #d0d0d0",
                    background: role === "LANDLORD" ? "var(--primary-light)" : "white",
                    fontWeight: role === "LANDLORD" ? 700 : 400,
                    color: role === "LANDLORD" ? "var(--primary)" : "inherit",
                    cursor: "pointer",
                  }}
                >
                  Chủ trọ
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
              />
            </div>

            {role === "LANDLORD" && (
              <div className="form-group">
                <label>Số CCCD / CMND</label>
                <input
                  required
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  placeholder="Số CCCD / CMND của chủ trọ"
                />
              </div>
            )}

            {error && (
              <div style={{ color: "var(--danger)", marginBottom: "0.75rem", textAlign: "center" }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                disabled={loading}
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? "Đang xử lý..." : "Xác nhận và tiếp tục"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default GoogleButton;