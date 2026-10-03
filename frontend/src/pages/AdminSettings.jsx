import React, { useState } from "react";
import { Settings, Save, AlertTriangle, Info, Wrench, Percent, FileText } from "lucide-react";
import toast from "react-hot-toast";

const AdminSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    MAX_FREE_POSTS_PER_MONTH: 3,
    PLATFORM_FEE_PERCENTAGE: 5.0,
    MAINTENANCE_MODE: false,
    REQUIRE_IDENTITY_VERIFICATION: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Đã lưu cấu hình hệ thống thành công!");
    }, 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <Settings size={28} color="#8B5CF6" />
          Cài Đặt Hệ Thống (Global Settings)
        </h1>
        <p style={{ color: "#64748B", margin: "4px 0 0 0", fontSize: "14px" }}>
          Quản lý các thông số cấu hình cốt lõi của nền tảng. Thay đổi sẽ có hiệu lực ngay lập tức.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Section 1: Business Logic */}
        <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", color: "#0F172A", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} color="#3B82F6" /> Cấu hình Nội dung & Phí
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Input 1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                Số bài đăng miễn phí/tháng
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                  <FileText size={18} />
                </div>
                <input
                  type="number"
                  name="MAX_FREE_POSTS_PER_MONTH"
                  value={settings.MAX_FREE_POSTS_PER_MONTH}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "15px",
                    color: "#0F172A",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8B5CF6"}
                  onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Áp dụng cho tài khoản Chủ trọ (Landlord) chưa nâng cấp VIP.</p>
            </div>

            {/* Input 2 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                Phí hoa hồng nền tảng (%)
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}>
                  <Percent size={18} />
                </div>
                <input
                  type="number"
                  step="0.1"
                  name="PLATFORM_FEE_PERCENTAGE"
                  value={settings.PLATFORM_FEE_PERCENTAGE}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "15px",
                    color: "#0F172A",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8B5CF6"}
                  onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Phần trăm chiết khấu thu từ các giao dịch thanh toán qua cổng VNPay.</p>
            </div>
          </div>
        </div>

        {/* Section 2: System Status */}
        <div style={{ background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", color: "#0F172A", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Wrench size={20} color="#F59E0B" /> Trạng thái Hệ thống
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Toggle 1 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: settings.MAINTENANCE_MODE ? "#FEF2F2" : "#F8FAFC", borderRadius: "12px", border: `1px solid ${settings.MAINTENANCE_MODE ? "#FECACA" : "#E2E8F0"}`, transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ marginTop: "2px", color: settings.MAINTENANCE_MODE ? "#EF4444" : "#64748B" }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0F172A" }}>Chế độ Bảo trì (Maintenance Mode)</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B", maxWidth: "500px" }}>
                    Khi bật, toàn bộ người dùng và chủ trọ sẽ không thể truy cập hệ thống. Chỉ Admin mới có thể đăng nhập. Hãy cẩn thận khi sử dụng chức năng này.
                  </p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input
                  type="checkbox"
                  name="MAINTENANCE_MODE"
                  checked={settings.MAINTENANCE_MODE}
                  onChange={handleChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: settings.MAINTENANCE_MODE ? "#EF4444" : "#CBD5E1",
                  transition: ".4s",
                  borderRadius: "34px"
                }}>
                  <span style={{
                    position: "absolute", height: "20px", width: "20px", left: "3px", bottom: "3px",
                    backgroundColor: "white", transition: ".4s", borderRadius: "50%",
                    transform: settings.MAINTENANCE_MODE ? "translateX(24px)" : "translateX(0)"
                  }}></span>
                </span>
              </label>
            </div>

            {/* Toggle 2 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ marginTop: "2px", color: "#3B82F6" }}>
                  <Info size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0F172A" }}>Bắt buộc xác thực CMND/CCCD</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B", maxWidth: "500px" }}>
                    Yêu cầu Chủ trọ phải tải lên giấy tờ tùy thân và được Admin duyệt trước khi đăng bài đầu tiên.
                  </p>
                </div>
              </div>
              
              <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input
                  type="checkbox"
                  name="REQUIRE_IDENTITY_VERIFICATION"
                  checked={settings.REQUIRE_IDENTITY_VERIFICATION}
                  onChange={handleChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: settings.REQUIRE_IDENTITY_VERIFICATION ? "#10B981" : "#CBD5E1",
                  transition: ".4s",
                  borderRadius: "34px"
                }}>
                  <span style={{
                    position: "absolute", height: "20px", width: "20px", left: "3px", bottom: "3px",
                    backgroundColor: "white", transition: ".4s", borderRadius: "50%",
                    transform: settings.REQUIRE_IDENTITY_VERIFICATION ? "translateX(24px)" : "translateX(0)"
                  }}></span>
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px", marginTop: "10px" }}>
          <button style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", color: "#475569", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
            Hủy Bỏ
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: "#8B5CF6", color: "white", fontWeight: "600", cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s", opacity: isSaving ? 0.7 : 1 }}
            onMouseEnter={e => !isSaving && (e.currentTarget.style.background = "#7C3AED")} 
            onMouseLeave={e => !isSaving && (e.currentTarget.style.background = "#8B5CF6")}
          >
            <Save size={18} />
            {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
