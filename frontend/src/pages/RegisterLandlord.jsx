import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  QrCode,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Building,
  KeyRound,
  ArrowRight,
  ExternalLink,
  Clock,
  RefreshCw,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "../api/apiClient";

const RegisterLandlord = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("online"); // 'online' | 'offline'

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [desiredPassword, setDesiredPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // QR / Application submission result
  const [submittedData, setSubmittedData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegisterOnline = async (e) => {
    e.preventDefault();
    if (desiredPassword.length < 6) {
      toast.error("Mật khẩu mong muốn phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.createLandlordRequest({
        fullName,
        email,
        phoneNumber,
        idCardNumber,
        desiredPassword,
        amount: 199000,
      });

      const responseData = res.data?.data || res.data;
      setSubmittedData(responseData);
      toast.success("Đã tạo yêu cầu thành công! Vui lòng quét mã VietQR để hoàn tất nạp tiền.");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Đăng ký thất bại, vui lòng kiểm tra lại.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-polling kiểm tra trạng thái thanh toán mỗi 5 giây
  useEffect(() => {
    let timer = null;
    if (submittedData?.paymentCode && submittedData?.status === "PENDING") {
      timer = setInterval(async () => {
        try {
          const res = await authApi.getLandlordRequestStatus(submittedData.paymentCode);
          const data = res.data?.data || res.data;
          if (data && data.status !== submittedData.status) {
            setSubmittedData(data);
            if (data.status === "APPROVED") {
              toast.success("🎉 Tiền đã vào tài khoản! Tài khoản Chủ trọ của bạn đã được kích hoạt thành công!");
            } else if (data.status === "REJECTED") {
              toast.error("Đơn đăng ký bị từ chối: " + (data.rejectionReason || "Không hợp lệ"));
            }
          }
        } catch {
          // im lặng khi poll
        }
      }, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submittedData]);

  const checkPaymentStatus = async () => {
    if (!submittedData?.paymentCode) return;
    setCheckingStatus(true);
    try {
      const res = await authApi.getLandlordRequestStatus(submittedData.paymentCode);
      const data = res.data?.data || res.data;
      setSubmittedData(data);
      if (data.status === "APPROVED") {
        toast.success("🎉 Tài khoản Chủ trọ của bạn đã được Admin phê duyệt kích hoạt! Bạn có thể đăng nhập ngay.");
      } else if (data.status === "REJECTED") {
        toast.error("Yêu cầu của bạn đã bị từ chối: " + (data.rejectionReason || "Chưa rõ lý do"));
      } else {
        toast.info("Đơn đăng ký đang ở trạng thái: Chờ Admin phê duyệt đối soát.");
      }
    } catch (err) {
      toast.error("Không kiểm tra được trạng thái lúc này.");
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 70px)", background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        
        {/* Header banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
            borderRadius: 24,
            padding: "36px 32px",
            color: "#FFFFFF",
            boxShadow: "0 20px 35px -10px rgba(49, 46, 129, 0.3)",
            marginBottom: 32,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 620, zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, backdropFilter: "blur(8px)", marginBottom: 14 }}>
              <Sparkles size={16} color="#FDE047" /> ĐẶC QUYỀN ĐỐI TÁC CHỦ TRỌ
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: 1.25 }}>
              Trở thành Chủ Trọ Xác Thực tại Roomily
            </h1>
            <p style={{ margin: 0, color: "#E0E7FF", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Để đảm bảo môi trường phòng trọ an toàn, minh bạch và chống tin ảo, mọi tài khoản Chủ trọ đều được kiểm duyệt & cấp quyền trực tiếp bởi Ban Quản Trị Hệ Thống.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "18px 24px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", zIndex: 2, minWidth: 220, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#C7D2FE", marginBottom: 4 }}>Phí kích hoạt trọn đời</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#FDE047" }}>199.000đ</div>
            <div style={{ fontSize: 12, color: "#E0E7FF", marginTop: 4 }}>Đăng bài không giới hạn & Quản lý phòng</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, background: "#FFFFFF", padding: 6, borderRadius: 16, border: "1px solid #E2E8F0", width: "fit-content", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <button
            onClick={() => setActiveTab("online")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeTab === "online" ? "#4F46E5" : "transparent",
              color: activeTab === "online" ? "#FFFFFF" : "#64748B",
              boxShadow: activeTab === "online" ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
            }}
          >
            <QrCode size={18} /> Đăng Ký Online (VietQR SePay)
          </button>

          <button
            onClick={() => setActiveTab("offline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeTab === "offline" ? "#4F46E5" : "transparent",
              color: activeTab === "offline" ? "#FFFFFF" : "#64748B",
              boxShadow: activeTab === "offline" ? "0 4px 12px rgba(79, 70, 229, 0.25)" : "none",
            }}
          >
            <PhoneCall size={18} /> Hỗ Trợ Hotline / Tạo Trực Tiếp
          </button>
        </div>

        {/* TAB 1: ONLINE REGISTRATION */}
        {activeTab === "online" && (
          <div>
            {!submittedData ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
                {/* Form Registration */}
                <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 32, border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>Điền thông tin tài khoản</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Nhập thông tin và mật khẩu bạn mong muốn tạo</p>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterOnline} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                        Họ và tên chủ trọ <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          Email đăng nhập <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="chutro@gmail.com"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          Số điện thoại Zalo <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0912345678"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          Số CCCD / CMND
                        </label>
                        <input
                          value={idCardNumber}
                          onChange={(e) => setIdCardNumber(e.target.value)}
                          placeholder="077099xxxxxx"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                          Mật khẩu mong muốn <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          required
                          type="password"
                          value={desiredPassword}
                          onChange={(e) => setDesiredPassword(e.target.value)}
                          placeholder="Mật khẩu từ 6 ký tự"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: 12, border: "1px dashed #CBD5E1", fontSize: 13, color: "#475569", display: "flex", gap: 10 }}>
                      <Info size={18} color="#4F46E5" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        Sau khi bấm <strong>"Tiếp tục thanh toán VietQR"</strong>, hệ thống sẽ tự sinh mã QR thanh toán chuẩn ngân hàng kèm mã định danh duy nhất của bạn.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        marginTop: 10,
                        padding: "14px",
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                      }}
                    >
                      {loading ? (
                        <>Đang xử lý...</>
                      ) : (
                        <>Tiếp tục thanh toán VietQR <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                </div>

                {/* Benefits / Guide Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 28, border: "1px solid #E2E8F0" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "1.15rem", fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                      <ShieldCheck size={22} color="#10B981" /> Quyền lợi khi kích hoạt Chủ trọ
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12, color: "#334155", fontSize: 14 }}>
                      <li><strong>Tích xanh Xác thực:</strong> Bài đăng được ưu tiên top đầu diễn đàn và bản đồ tìm kiếm.</li>
                      <li><strong>Quản lý phòng trọ:</strong> Tự do thêm phòng, sửa thông tin, giá điện nước, tiện ích.</li>
                      <li><strong>Tạo hóa đơn & Hợp đồng:</strong> Hỗ trợ lập hóa đơn tiền phòng trực tuyến nhanh gọn.</li>
                      <li><strong>Hỗ trợ 24/7 từ Admin:</strong> Được hỗ trợ kỹ thuật và đẩy tin VIP khi có nhu cầu.</li>
                    </ul>
                  </div>

                  <div style={{ background: "#F1F5F9", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#0F172A", fontSize: "1rem" }}>Đã có tài khoản?</h4>
                    <p style={{ margin: "0 0 16px 0", fontSize: 13.5, color: "#64748B" }}>Nếu bạn đã được Admin cấp tài khoản hoặc đăng ký trước đó, hãy đăng nhập ngay.</p>
                    <Link to="/login" style={{ display: "inline-block", padding: "10px 18px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#0F172A", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                      Đăng nhập ngay
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* SUBMITTED STEP: VIETQR DISPLAY & PAYMENT INSTRUCTIONS */
              <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "36px 32px", border: "1px solid #E2E8F0", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                {submittedData.status === "APPROVED" && (
                  <div style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", border: "1px solid #A7F3D0", borderRadius: 16, padding: "20px 24px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#10B981", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 2px 0", fontSize: "1.1rem", fontWeight: 800, color: "#065F46" }}>
                          KÍCH HOẠT TÀI KHOẢN CHỦ TRỌ THÀNH CÔNG!
                        </h4>
                        <p style={{ margin: 0, fontSize: 13.5, color: "#047857" }}>
                          Admin đã xác nhận thanh toán. Bạn có thể sử dụng email <strong>{submittedData.email}</strong> và mật khẩu đã đặt để đăng nhập ngay bây giờ.
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/login"
                      style={{
                        padding: "12px 24px",
                        borderRadius: 12,
                        background: "#059669",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                      }}
                    >
                      Đăng nhập ngay <ArrowRight size={16} />
                    </Link>
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 20, marginBottom: 28, gap: 16 }}>
                  <div>
                    <span style={{
                      display: "inline-block",
                      background: submittedData.status === "APPROVED" ? "#D1FAE5" : submittedData.status === "REJECTED" ? "#FEE2E2" : "#FEF3C7",
                      color: submittedData.status === "APPROVED" ? "#065F46" : submittedData.status === "REJECTED" ? "#DC2626" : "#B45309",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12.5,
                      fontWeight: 700,
                      marginBottom: 8
                    }}>
                      {submittedData.status === "APPROVED" ? "✅ ĐÃ ĐƯỢC DUYỆT & KÍCH HOẠT" : submittedData.status === "REJECTED" ? "❌ ĐÃ BỊ TỪ CHỐI" : "⏳ CHỜ THANH TOÁN & ĐỐI SOÁT"}
                    </span>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0F172A" }}>
                      Thanh toán kích hoạt tài khoản Chủ Trọ
                    </h2>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={checkPaymentStatus}
                      disabled={checkingStatus}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "1px solid #CBD5E1",
                        background: "#F8FAFC",
                        color: "#0F172A",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <RefreshCw size={14} className={checkingStatus ? "animate-spin" : ""} /> Kiểm tra trạng thái
                    </button>
                    {submittedData.status === "APPROVED" && (
                      <Link
                        to="/login"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 18px",
                          borderRadius: 10,
                          background: "#10B981",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        Đăng nhập ngay <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 36, alignItems: "start" }}>
                  {/* QR Image Frame */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#F8FAFC", padding: 24, borderRadius: 20, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Quét mã VietQR bằng App Ngân hàng
                    </div>
                    <div style={{ background: "#FFFFFF", padding: 12, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid #E2E8F0" }}>
                      <img
                        src={submittedData.qrImageUrl}
                        alt="VietQR SePay"
                        style={{ width: 280, height: 280, objectFit: "contain", display: "block" }}
                      />
                    </div>
                    <div style={{ marginTop: 14, fontSize: 12.5, color: "#64748B", textAlign: "center", maxWidth: 280 }}>
                      Mở ứng dụng ngân hàng bất kỳ (BIDV, Vietcombank, MB, Techcombank,...) và quét mã trên.
                    </div>
                  </div>

                  {/* Transfer Details & Manual Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: -4 }}>
                      Hoặc chuyển khoản thủ công theo thông tin:
                    </div>

                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px 18px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>Ngân hàng thụ hưởng</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{submittedData.bankName}</div>
                      </div>
                      <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>BIDV</span>
                    </div>

                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px 18px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>Số tài khoản</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", letterSpacing: 0.5 }}>{submittedData.bankAccount}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(submittedData.bankAccount, "Số tài khoản")}
                        style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Copy size={13} /> {copiedField === "Số tài khoản" ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>

                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px 18px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>Tên chủ tài khoản</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{submittedData.accountHolder}</div>
                      </div>
                      <CheckCircle2 size={18} color="#10B981" />
                    </div>

                    <div style={{ background: "#FEF2F2", borderRadius: 14, padding: "14px 18px", border: "1px solid #FECACA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>Nội dung chuyển khoản (Bắt buộc chính xác)</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#991B1B", fontFamily: "monospace" }}>{submittedData.paymentCode}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(submittedData.paymentCode, "Nội dung chuyển khoản")}
                        style={{ background: "#FFFFFF", border: "1px solid #FCA5A5", color: "#DC2626", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Copy size={13} /> {copiedField === "Nội dung chuyển khoản" ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>

                    <div style={{ background: "#ECFDF5", borderRadius: 14, padding: "14px 18px", border: "1px solid #A7F3D0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#065F46" }}>Số tiền thanh toán</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#047857" }}>
                          {Number(submittedData.amount || 199000).toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(String(submittedData.amount || 199000), "Số tiền")}
                        style={{ background: "#FFFFFF", border: "1px solid #6EE7B7", color: "#047857", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Copy size={13} /> {copiedField === "Số tiền" ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <button
                        onClick={() => setSubmittedData(null)}
                        style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #CBD5E1", background: "#FFFFFF", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#475569" }}
                      >
                        Đăng ký đơn khác
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFLINE / HOTLINE SUPPORT & SUBMIT DIRECT REQUEST */}
        {activeTab === "offline" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 28 }}>
            {/* Form gửi yêu cầu tạo trực tiếp */}
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 32, border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneCall size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0F172A" }}>Gửi Yêu Cầu Hỗ Trợ Tạo Trực Tiếp</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Admin sẽ liên hệ gọi điện / Zalo và kích hoạt tài khoản theo yêu cầu</p>
                </div>
              </div>

              <form onSubmit={handleRegisterOnline} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Họ và tên của bạn <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      Số điện thoại Zalo <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0912345678"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      Email muốn đăng ký <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="chutro@gmail.com"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      Mật khẩu mong muốn <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      required
                      type="password"
                      value={desiredPassword}
                      onChange={(e) => setDesiredPassword(e.target.value)}
                      placeholder="Tùy chọn mật khẩu"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                      Số CCCD / CMND
                    </label>
                    <input
                      value={idCardNumber}
                      onChange={(e) => setIdCardNumber(e.target.value)}
                      placeholder="077099xxxxxx"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ background: "#EFF6FF", padding: "12px 16px", borderRadius: 12, border: "1px solid #BFDBFE", fontSize: 13, color: "#1E40AF" }}>
                  Sau khi bấm gửi, yêu cầu sẽ được gửi tới bảng điều khiển của Admin. Admin sẽ gọi điện xác nhận và hỗ trợ tạo theo ý bạn.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 6,
                    padding: "13px",
                    borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                  }}
                >
                  {loading ? "Đang gửi..." : <>Gửi Yêu Cầu Tới Admin Ngay <ArrowRight size={18} /></>}
                </button>
              </form>
            </div>

            {/* Thông tin hotline & liên hệ Admin */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 28, border: "1px solid #E2E8F0" }}>
                <h4 style={{ margin: "0 0 14px 0", color: "#0F172A", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <PhoneCall size={20} color="#EF4444" /> Hotline Gọi Điện Trực Tiếp
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "10px 14px", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>Số Hotline Admin:</span>
                    <a href="tel:0348108630" style={{ fontSize: 15, fontWeight: 800, color: "#EF4444", textDecoration: "none" }}>0348.108.630</a>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "10px 14px", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>Zalo hỗ trợ:</span>
                    <a href="https://zalo.me/0348108630" target="_blank" rel="noreferrer" style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", textDecoration: "none" }}>0348.108.630 (Lê Vũ Hảo)</a>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", padding: "10px 14px", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>Email quản trị:</span>
                    <a href="mailto:levuhao10jq@gmail.com" style={{ fontSize: 13.5, fontWeight: 600, color: "#4F46E5", textDecoration: "none" }}>levuhao10jq@gmail.com</a>
                  </div>
                </div>
              </div>

              <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 28, border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <KeyRound size={26} />
                </div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                  Bạn là Quản Trị Viên (Admin)?
                </h4>
                <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px 0" }}>
                  Vào trang quản trị nội bộ để tạo tài khoản Chủ trọ trực tiếp hoặc duyệt đơn từ khách hàng.
                </p>
                <Link
                  to="/admin/landlord-requests"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    borderRadius: 10,
                    background: "#4F46E5",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: 13.5,
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                  }}
                >
                  Vào Duyệt Đăng Ký Chủ Trọ <ExternalLink size={15} />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RegisterLandlord;
