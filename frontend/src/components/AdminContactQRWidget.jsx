import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  QrCode, 
  X, 
  Copy, 
  CheckCircle2, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  Info,
  Download
} from "lucide-react";
import toast from "react-hot-toast";
import qrBidvImage from "../assets/qr_bidv_admin.png";

const AdminContactQRWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [qrImageSrc, setQrImageSrc] = useState(qrBidvImage);

  const bankInfo = {
    bankName: "BIDV (PGD Phù Cát)",
    bankCode: "BIDV",
    bankAccount: "8890014407",
    accountHolder: "LE VU HAO",
    amount: "199.000",
    phone: "0348.108.630",
    email: "levuhao10jq@gmail.com",
    transferSyntax: "NAP_TIEN_CHU_TRO",
    qrUrl: qrBidvImage
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <>
      {/* Nút bấm tròn cố định góc phải màn hình */}
      <div
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 990,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            background: "linear-gradient(135deg, #4F46E5 0%, #312E81 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 30,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.9)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: "pulse 3s infinite",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05) translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) translateY(0)")}
          title="Quét QR & Liên hệ Admin mở quyền Chủ trọ"
        >
          <div style={{ background: "rgba(255,255,255,0.2)", padding: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCode size={18} color="#FDE047" />
          </div>
          <span>Mở Quyền Chủ Trọ / Quét QR</span>
        </button>
      </div>

      {/* MODAL POPUP HIỂN THỊ MÃ QR VÀ THÔNG TIN ADMIN */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 24,
              width: "100%",
              maxWidth: 580,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px 24px",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--ink)" }}>
                    Nạp Tiền & Kích Hoạt Quyền Chủ Trọ
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                    Dành cho khách vãng lai / người dùng muốn đăng bài cho thuê trọ
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "var(--bg-primary)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Thông báo chính sách */}
            <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, fontSize: 13, color: "var(--accent, #f59e0b)" }}>
              <Info size={18} color="var(--accent, #f59e0b)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Quy định:</strong> Để chống tin ảo và bảo vệ người thuê, tài khoản Chủ trọ cần được nạp phí kích hoạt trọn đời (<strong>199.000đ</strong>) hoặc liên hệ Admin tạo trực tiếp.
              </div>
            </div>

            {/* Grid Nội dung: QR Code + Thông tin chuyển khoản */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "center" }}>
              {/* QR Code */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "var(--bg-primary)", padding: 16, borderRadius: 18, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>
                  Mã VietQR Ngân hàng BIDV
                </div>
                <div style={{ background: "#FFFFFF", padding: 8, borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.06)", border: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
                  <img
                    src={qrImageSrc}
                    onError={() => {
                      if (qrImageSrc !== "/qr_bidv_admin.png") {
                        setQrImageSrc("/qr_bidv_admin.png");
                      }
                    }}
                    alt="Mã VietQR BIDV LE VU HAO 8890014407"
                    style={{ width: "100%", maxWidth: 210, height: "auto", maxHeight: 240, objectFit: "contain", display: "block", borderRadius: 8 }}
                  />
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={14} color="#10B981" /> Quét bằng App Ngân hàng bất kỳ
                </div>
              </div>

              {/* Chi tiết chuyển khoản & liên hệ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "var(--bg-primary)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Ngân hàng</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{bankInfo.bankName}</div>
                </div>

                <div style={{ background: "var(--bg-primary)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Số tài khoản / Mã ID QR</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: 0.5 }}>{bankInfo.bankAccount}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.bankAccount, "Số tài khoản / Mã ID QR")}
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--ink)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Copy size={12} /> {copiedField === "Số tài khoản / Mã ID QR" ? "Đã chép" : "Chép"}
                  </button>
                </div>

                <div style={{ background: "var(--bg-primary)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Chủ tài khoản</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{bankInfo.accountHolder}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.accountHolder, "Chủ tài khoản")}
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--ink)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Copy size={12} /> {copiedField === "Chủ tài khoản" ? "Đã chép" : "Chép"}
                  </button>
                </div>

                <div style={{ background: "rgba(245, 158, 11, 0.1)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600 }}>Cú pháp chuyển khoản gợi ý</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#D97706", fontFamily: "monospace" }}>{bankInfo.transferSyntax}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bankInfo.transferSyntax, "Cú pháp chuyển khoản")}
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#D97706", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Copy size={12} /> {copiedField === "Cú pháp chuyển khoản" ? "Đã chép" : "Chép"}
                  </button>
                </div>

                <div style={{ background: "rgba(59, 130, 246, 0.12)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                  <div style={{ fontSize: 11, color: "var(--primary)" }}>Hotline / Zalo hỗ trợ Admin</div>
                  <a href={`tel:${bankInfo.phone}`} style={{ fontSize: 14, fontWeight: 800, color: "#EF4444", textDecoration: "none" }}>
                    {bankInfo.phone} ({bankInfo.accountHolder})
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <Link
                to="/register-landlord"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: "var(--primary)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                Vào Trang Đăng Ký Chủ Trọ Chi Tiết <ExternalLink size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminContactQRWidget;
