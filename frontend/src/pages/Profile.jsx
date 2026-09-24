import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  User, Mail, Phone, Shield, Camera, CheckCircle2, 
  Building2, FileText, KeyRound, Save, ArrowLeft, Sparkles, AlertCircle 
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/apiClient";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    idCardNumber: "",
    avatarUrl: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        idCardNumber: user.idCardNumber || "",
        avatarUrl: user.avatarUrl || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dung lượng dưới 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, avatarUrl: event.target.result }));
      toast.success("Đã tải ảnh lên! Hãy bấm 'Lưu thay đổi' để cập nhật.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        idCardNumber: formData.idCardNumber.trim(),
        avatarUrl: formData.avatarUrl,
      };

      const res = await authApi.updateProfile(payload);
      const updatedData = res.data?.data || res.data;
      
      updateUser(updatedData);
      toast.success("Cập nhật thông tin cá nhân thành công! ✨");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="page-shell">
        <div className="wrap" style={{ paddingTop: 60, textAlign: "center" }}>
          <h2>Vui lòng đăng nhập để xem hồ sơ</h2>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const isLandlord = user.role === "LANDLORD";
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="page-shell">
      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 70 }}>
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: 24 }}>
          <Link 
            to="/" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 8, 
              color: "var(--text-muted)", 
              fontSize: "0.9rem",
              textDecoration: "none"
            }}
          >
            <ArrowLeft size={16} /> Quay lại trang chủ
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="profile-hero-card">
          <div className="profile-hero-bg"></div>
          <div className="profile-hero-content">
            <div className="profile-avatar-wrapper">
              {formData.avatarUrl ? (
                <img 
                  src={formData.avatarUrl} 
                  alt={formData.fullName} 
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {(formData.fullName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <label className="profile-avatar-upload-btn" title="Đổi ảnh đại diện">
                <Camera size={16} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  style={{ display: "none" }} 
                />
              </label>
            </div>

            <div className="profile-hero-meta">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 className="profile-name">{formData.fullName || "Người dùng"}</h1>
                <span className={`profile-badge ${isLandlord ? "badge-landlord" : isAdmin ? "badge-admin" : "badge-user"}`}>
                  <Sparkles size={13} />
                  {isLandlord ? "Chủ Trọ Đã Xác Thực" : isAdmin ? "Quản Trị Viên" : "Cư Dân Roomily"}
                </span>
                <span className="profile-status-pill">
                  <span className="profile-status-dot"></span> Đang hoạt động
                </span>
              </div>
              <p className="profile-email">
                <Mail size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
                {formData.email}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs-bar">
          <button 
            className={`profile-tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <User size={17} /> Thông tin cá nhân
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            <Building2 size={17} /> Hoạt động & Quản lý
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content-container">
          {activeTab === "info" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Cập nhật thông tin hồ sơ</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
                    Thông tin hiển thị khi liên hệ thuê phòng hoặc đăng tin trên Diễn đàn
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label>
                      <User size={15} /> Họ và tên *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập đầy đủ họ và tên"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Mail size={15} /> Địa chỉ Email (Cố định)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      style={{ opacity: 0.7, cursor: "not-allowed", background: "var(--bg-subtle, #f8fafc)" }}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={15} /> Số điện thoại liên hệ
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="Ví dụ: 0912 345 678"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Shield size={15} /> Số Căn cước công dân / CMND {isLandlord ? "(Bắt buộc đối với Chủ trọ)" : "(Tùy chọn)"}
                    </label>
                    <input
                      type="text"
                      name="idCardNumber"
                      value={formData.idCardNumber}
                      onChange={handleChange}
                      placeholder="12 chữ số CCCD gắn chip"
                    />
                  </div>
                </div>

                {/* Avatar URL direct input */}
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>
                    <Camera size={15} /> Đường dẫn ảnh đại diện (URL trực tiếp - tùy chọn)
                  </label>
                  <input
                    type="url"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                    Bạn có thể bấm vào biểu tượng máy ảnh trên ảnh đại diện để tải ảnh từ máy tính hoặc dán link ảnh tại đây.
                  </span>
                </div>

                <div className="profile-form-actions">
                  <button type="submit" className="btn btn-primary profile-save-btn" disabled={loading}>
                    <Save size={18} />
                    {loading ? "Đang lưu thông tin..." : "Lưu thay đổi hồ sơ"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="profile-card">
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 16 }}>
                Lối tắt hoạt động dành cho {isLandlord ? "Chủ trọ" : "Người thuê"}
              </h3>

              <div className="profile-shortcut-grid">
                {isLandlord ? (
                  <>
                    <Link to="/landlord/requests" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Yêu cầu thuê phòng</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Duyệt các hồ sơ xin thuê phòng và ký hợp đồng tự động
                        </p>
                      </div>
                    </Link>

                    <Link to="/forum/messages" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                        <Mail size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Tin nhắn liên hệ</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Hộp thư nhận tin nhắn từ người dùng quan tâm bài đăng
                        </p>
                      </div>
                    </Link>

                    <Link to="/landlord/properties" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Khu trọ & Phòng</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Quản lý danh sách tòa nhà, số phòng và bảng giá
                        </p>
                      </div>
                    </Link>

                    <Link to="/landlord/create-bill" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Tạo hóa đơn tháng</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Xuất hóa đơn tiền điện, nước, dịch vụ kèm mã QR VNPay
                        </p>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/my-contracts" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Hợp đồng thuê của tôi</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Tra cứu các hợp đồng thuê phòng đã được chủ trọ duyệt
                        </p>
                      </div>
                    </Link>

                    <Link to="/my-bills" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Hóa đơn điện nước</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Thanh toán hóa đơn hàng tháng trực tuyến qua VNPay
                        </p>
                      </div>
                    </Link>

                    <Link to="/forum" className="profile-shortcut-card">
                      <div className="profile-shortcut-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem" }}>Diễn đàn trọ & Ở ghép</h4>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          Khám phá các phòng trọ mới nhất và tìm bạn ở ghép
                        </p>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
