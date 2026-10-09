import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  QrCode,
  CreditCard,
  Building,
  Plus,
  RefreshCw,
  ExternalLink,
  Clock,
  Check,
  X
} from "lucide-react";
import { adminApi } from "../api/apiClient";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Pagination,
  Spinner,
  StatusBadge,
  buttonStyle,
  cardStyle,
  errorMessage,
  formatDateTime,
  inputStyle,
  useDebounced,
} from "../components/admin/AdminUi";

const PAGE_SIZE = 10;

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 12,
  color: "#64748B",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  background: "#F8FAFC",
  borderBottom: "1px solid #E2E8F0",
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: 14,
  color: "#334155",
  borderBottom: "1px solid #F1F5F9",
  verticalAlign: "middle",
};

const STATUS_BADGE = {
  PENDING: { color: "#D97706", bg: "#FEF3C7", label: "Chờ duyệt" },
  APPROVED: { color: "#059669", bg: "#D1FAE5", label: "Đã duyệt" },
  REJECTED: { color: "#DC2626", bg: "#FEE2E2", label: "Từ chối" },
};

const AdminLandlordRequests = () => {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);

  // Modal Direct Create Landlord
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [directForm, setDirectForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    idCardNumber: "",
    password: "",
    adminNote: "",
  });
  const [creating, setCreating] = useState(false);

  // Confirm Approve / Reject
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'approve' | 'reject', item, note: '' }
  const [acting, setActing] = useState(false);

  const debouncedKeyword = useDebounced(keyword);
  const reqId = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      if (status !== "ALL") params.status = status;
      const res = await adminApi.getLandlordRequests(params);
      if (id === reqId.current) setData(res.data?.data || res.data);
    } catch (err) {
      if (id === reqId.current) toast.error(errorMessage(err, "Không tải được danh sách đơn đăng ký"));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, debouncedKeyword, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, status]);

  const handleCreateDirect = async (e) => {
    e.preventDefault();
    if (directForm.password.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    setCreating(true);
    try {
      await adminApi.createLandlordDirectly(directForm);
      toast.success("Tạo tài khoản Chủ trọ trực tiếp thành công!");
      setShowCreateModal(false);
      setDirectForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        idCardNumber: "",
        password: "",
        adminNote: "",
      });
      fetchData();
    } catch (err) {
      toast.error(errorMessage(err, "Không thể tạo tài khoản"));
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setActing(true);
    try {
      if (confirmModal.type === "approve") {
        await adminApi.approveLandlordRequest(confirmModal.item.id, { note: confirmModal.note });
        toast.success("Đã phê duyệt và kích hoạt tài khoản Chủ trọ thành công!");
      } else {
        await adminApi.rejectLandlordRequest(confirmModal.item.id, { reason: confirmModal.note });
        toast.success("Đã từ chối đơn đăng ký.");
      }
      setConfirmModal(null);
      fetchData();
    } catch (err) {
      toast.error(errorMessage(err, "Thao tác thất bại"));
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <PageHeader
          icon={<ShieldCheck size={28} color="#4F46E5" />}
          title="Duyệt Đăng Ký Chủ Trọ (VietQR & Trực Tiếp)"
          subtitle="Quản lý toàn bộ danh sách nạp tiền kích hoạt chủ trọ qua VietQR SePay hoặc tạo tài khoản chủ trọ theo yêu cầu trực tiếp."
        />

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            ...buttonStyle("primary"),
            background: "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 12,
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          <Plus size={18} /> + Tạo Tài Khoản Chủ Trọ Trực Tiếp
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ ...cardStyle, padding: "16px 24px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 10, padding: "0 14px", flex: "1 1 280px", maxWidth: 420 }}>
          <Search size={18} color="#94A3B8" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT hoặc mã SePay..."
            style={{ border: "none", background: "transparent", outline: "none", padding: "10px 8px", width: "100%", fontSize: 14 }}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING">Chờ phê duyệt</option>
          <option value="APPROVED">Đã duyệt / Đã tạo</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>

        <button
          onClick={fetchData}
          style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Requests Table */}
      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading && (!data.content || data.content.length === 0) ? (
          <Spinner />
        ) : !data.content || data.content.length === 0 ? (
          <EmptyState message="Không tìm thấy đơn đăng ký chủ trọ nào" />
        ) : (
          <div style={{ overflowX: "auto", opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr>
                  {["Chủ trọ đăng ký", "Liên hệ & CCCD", "Mã đơn & Số tiền", "Kênh / Nguồn", "Trạng thái", "Thời gian", "Hành động"].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.content.map((req) => {
                  const sBadge = STATUS_BADGE[req.status] || STATUS_BADGE.PENDING;
                  const isPending = req.status === "PENDING";
                  return (
                    <tr key={req.id}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", color: "#4F46E5", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {(req.fullName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0F172A" }}>{req.fullName}</div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>ID Đơn: #{req.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5 }}>
                          <Mail size={13} color="#94A3B8" /> {req.email}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                          <Phone size={13} color="#94A3B8" /> {req.phoneNumber || "—"}
                          {req.idCardNumber && <span style={{ marginLeft: 6, background: "#F1F5F9", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>CCCD: {req.idCardNumber}</span>}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#1E293B", fontSize: 13 }}>
                          {req.paymentCode}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginTop: 2 }}>
                          {Number(req.amount || 0).toLocaleString("vi-VN")} đ
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {req.channel === "OFFLINE_DIRECT" ? (
                          <span style={{ display: "inline-block", background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            📞 Offline Admin
                          </span>
                        ) : (
                          <span style={{ display: "inline-block", background: "#EDE9FE", color: "#6D28D9", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            🏦 VietQR SePay
                          </span>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: sBadge.color, background: sBadge.bg }}>
                          {sBadge.label}
                        </span>
                        {req.rejectionReason && (
                          <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, maxWidth: 160 }}>
                            Lý do: {req.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td style={{ ...tdStyle, whiteSpace: "nowrap", fontSize: 12.5, color: "#64748B" }}>
                        {formatDateTime(req.createdAt)}
                      </td>

                      <td style={tdStyle}>
                        {isPending ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setConfirmModal({ type: "approve", item: req, note: "" })}
                              style={{ background: "#10B981", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <Check size={14} /> Duyệt
                            </button>
                            <button
                              onClick={() => setConfirmModal({ type: "reject", item: req, note: "" })}
                              style={{ background: "#EF4444", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <X size={14} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94A3B8" }}>— Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.number ?? page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
      </div>

      {/* MODAL: DIRECT CREATE LANDLORD */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, width: "100%", maxWidth: 520, padding: 28, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0F172A" }}>Tạo Tài Khoản Chủ Trọ Trực Tiếp</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDirect} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Họ và tên chủ trọ <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  required
                  value={directForm.fullName}
                  onChange={(e) => setDirectForm({ ...directForm, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Email đăng nhập <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={directForm.email}
                    onChange={(e) => setDirectForm({ ...directForm, email: e.target.value })}
                    placeholder="chutro@gmail.com"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Số điện thoại <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    required
                    value={directForm.phoneNumber}
                    onChange={(e) => setDirectForm({ ...directForm, phoneNumber: e.target.value })}
                    placeholder="0912345678"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Số CCCD / CMND
                  </label>
                  <input
                    value={directForm.idCardNumber}
                    onChange={(e) => setDirectForm({ ...directForm, idCardNumber: e.target.value })}
                    placeholder="077099xxxxxx"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                    Mật khẩu khởi tạo <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={directForm.password}
                    onChange={(e) => setDirectForm({ ...directForm, password: e.target.value })}
                    placeholder="Đặt mật khẩu tùy thích"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Ghi chú Admin (Tùy chọn)
                </label>
                <input
                  value={directForm.adminNote}
                  onChange={(e) => setDirectForm({ ...directForm, adminNote: e.target.value })}
                  placeholder="Ví dụ: Khách gọi hotline chuyển tiền mặt..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#4F46E5", color: "#FFFFFF", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer" }}
                >
                  {creating ? "Đang tạo..." : "Xác nhận tạo Chủ trọ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM APPROVE / REJECT */}
      {confirmModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "1.2rem", fontWeight: 700, color: confirmModal.type === "approve" ? "#059669" : "#DC2626" }}>
              {confirmModal.type === "approve" ? "Phê duyệt kích hoạt Chủ trọ" : "Từ chối đơn đăng ký"}
            </h3>
            <p style={{ margin: "0 0 14px 0", fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
              {confirmModal.type === "approve"
                ? `Bạn có chắc chắn đã nhận được tiền và muốn kích hoạt quyền Chủ trọ cho "${confirmModal.item.fullName}" (${confirmModal.item.email})?`
                : `Từ chối đơn đăng ký của "${confirmModal.item.fullName}"?`}
            </p>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                {confirmModal.type === "approve" ? "Ghi chú phê duyệt (Tùy chọn)" : "Lý do từ chối"}
              </label>
              <textarea
                rows={3}
                value={confirmModal.note}
                onChange={(e) => setConfirmModal({ ...confirmModal, note: e.target.value })}
                placeholder={confirmModal.type === "approve" ? "Đã đối soát ngân hàng BIDV..." : "Ví dụ: Chưa nhận được chuyển khoản / sai nội dung..."}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13.5, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={acting}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: confirmModal.type === "approve" ? "#10B981" : "#EF4444",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  cursor: acting ? "not-allowed" : "pointer",
                }}
              >
                {acting ? "Đang xử lý..." : confirmModal.type === "approve" ? "Xác nhận Duyệt" : "Xác nhận Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLandlordRequests;
