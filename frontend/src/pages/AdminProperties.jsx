import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Building2, Search, Eye, EyeOff, Trash2, MapPin, Phone, Mail, User, Image as ImageIcon,
} from "lucide-react";
import { adminApi } from "../api/apiClient";
import {
  ConfirmDialog, EmptyState, Modal, PageHeader, Pagination, Spinner, StatusBadge,
  buttonStyle, cardStyle, errorMessage, formatDateTime, formatVnd, inputStyle, useDebounced,
} from "../components/admin/AdminUi";

const PAGE_SIZE = 10;

const thStyle = { textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" };
const tdStyle = { padding: "12px 16px", fontSize: 14, color: "#334155", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" };

const Gallery = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) {
    return (
      <div style={{ height: 180, borderRadius: 10, background: "#F1F5F9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94A3B8", gap: 6 }}>
        <ImageIcon size={28} />
        <span style={{ fontSize: 13 }}>Khu trọ chưa có hình ảnh</span>
      </div>
    );
  }
  const current = images[Math.min(idx, images.length - 1)];
  return (
    <div>
      <div style={{ height: 260, borderRadius: 10, overflow: "hidden", background: "#0F172A" }}>
        <img src={current} alt="Ảnh khu trọ" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      {images.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Ảnh ${i + 1}`}
              onClick={() => setIdx(i)}
              style={{
                width: 72, height: 52, objectFit: "cover", borderRadius: 6, cursor: "pointer", flexShrink: 0,
                border: i === idx ? "2px solid #8B5CF6" : "2px solid transparent", opacity: i === idx ? 1 : 0.7,
              }}
            />
          ))}
        </div>
      )}
      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{Math.min(idx, images.length - 1) + 1} / {images.length} ảnh</div>
    </div>
  );
};

const InfoRow = ({ icon, children }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, color: "#334155" }}>
    <span style={{ color: "#94A3B8", marginTop: 2, display: "flex" }}>{icon}</span>
    <span>{children}</span>
  </div>
);

const PropertyDetailModal = ({ propertyId, onClose, onAction }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    let alive = true;
    setLoading(true);
    setData(null);
    adminApi
      .getPropertyDetail(propertyId)
      .then((res) => alive && setData(res.data))
      .catch((err) => {
        toast.error(errorMessage(err, "Không tải được chi tiết khu trọ"));
        onClose();
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const isHidden = data?.status === "HIDDEN";

  return (
    <Modal
      open={!!propertyId}
      onClose={onClose}
      title="Chi tiết khu trọ"
      width={860}
      footer={
        data && (
          <>
            <button style={buttonStyle("default")} onClick={onClose}>Đóng</button>
            <button style={buttonStyle(isHidden ? "success" : "warning")} onClick={() => onAction(isHidden ? "show" : "hide", data)}>
              {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
              {isHidden ? "Hiển thị lại" : "Tạm ẩn khu trọ"}
            </button>
            <button style={buttonStyle("danger")} onClick={() => onAction("delete", data)}>
              <Trash2 size={15} /> Xóa khu trọ
            </button>
          </>
        )
      }
    >
      {loading || !data ? (
        <Spinner />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Gallery images={data.gallery} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 20, color: "#0F172A" }}>{data.title}</h2>
                <StatusBadge status={data.status} />
              </div>
              <InfoRow icon={<MapPin size={15} />}>
                {[data.address, data.ward, data.district, data.city].filter(Boolean).join(", ")}
              </InfoRow>
              {data.utilities && <InfoRow icon={<Building2 size={15} />}>Tiện ích: {data.utilities}</InfoRow>}
              {data.description && <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#64748B", lineHeight: 1.6 }}>{data.description}</p>}
              <span style={{ fontSize: 12, color: "#94A3B8" }}>Tạo lúc {formatDateTime(data.createdAt)}</span>
              {isHidden && data.statusReason && (
                <div style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
                  Lý do ẩn: {data.statusReason}
                </div>
              )}
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.4 }}>Chủ trọ</div>
              <InfoRow icon={<User size={15} />}>
                <b>{data.landlordName || `Chủ trọ #${data.landlordId}`}</b>
                {data.landlordStatus === "SUSPENDED" && <span style={{ marginLeft: 8 }}><StatusBadge status="REJECTED" label="Tài khoản bị khóa" /></span>}
              </InfoRow>
              {data.landlordPhone && <InfoRow icon={<Phone size={15} />}>{data.landlordPhone}</InfoRow>}
              {data.landlordEmail && <InfoRow icon={<Mail size={15} />}>{data.landlordEmail}</InfoRow>}
              {!data.landlordName && <span style={{ fontSize: 12, color: "#94A3B8" }}>Không lấy được thông tin chi tiết từ Auth-Service.</span>}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <h4 style={{ margin: 0, fontSize: 15, color: "#0F172A" }}>Danh sách phòng ({data.totalRooms})</h4>
              <div style={{ display: "flex", gap: 6 }}>
                <StatusBadge status="AVAILABLE" label={`Trống: ${data.availableRooms}`} />
                <StatusBadge status="OCCUPIED" label={`Đang thuê: ${data.occupiedRooms}`} />
                {data.maintenanceRooms > 0 && <StatusBadge status="MAINTENANCE" label={`Bảo trì: ${data.maintenanceRooms}`} />}
              </div>
            </div>
            {data.rooms.length === 0 ? (
              <EmptyState message="Khu trọ chưa có phòng nào" />
            ) : (
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Phòng", "Giá thuê", "Diện tích", "Người ở", "Trạng thái"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rooms.map((r) => (
                      <tr key={r.id}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{r.roomNumber}</td>
                        <td style={tdStyle}>{formatVnd(r.price)}</td>
                        <td style={tdStyle}>{r.area} m²</td>
                        <td style={tdStyle}>{r.currentOccupants ?? 0}/{r.capacity}</td>
                        <td style={tdStyle}><StatusBadge status={r.rentalState} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

const AdminProperties = () => {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState(null);

  // Dialog xác nhận: { type: 'hide' | 'show' | 'delete', property }
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
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
      const res = await adminApi.getProperties(params);
      if (id === reqId.current) setData(res.data);
    } catch (err) {
      if (id === reqId.current) toast.error(errorMessage(err, "Không tải được danh sách khu trọ"));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, debouncedKeyword, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [debouncedKeyword, status]);

  const openConfirm = (type, property) => { setReason(""); setConfirm({ type, property }); };

  const runConfirm = async () => {
    if (!confirm) return;
    const { type, property } = confirm;
    setActing(true);
    try {
      if (type === "delete") {
        await adminApi.deleteProperty(property.id, reason.trim());
        toast.success("Đã xóa khu trọ");
      } else {
        await adminApi.updatePropertyStatus(property.id, {
          status: type === "hide" ? "HIDDEN" : "ACTIVE",
          reason: type === "hide" ? reason.trim() : undefined,
        });
        toast.success(type === "hide" ? "Đã tạm ẩn khu trọ" : "Đã hiển thị lại khu trọ");
      }
      setConfirm(null);
      setDetailId(null);
      fetchData();
    } catch (err) {
      toast.error(errorMessage(err, "Thao tác thất bại"));
    } finally {
      setActing(false);
    }
  };

  const dialogs = {
    hide: { title: "Tạm ẩn khu trọ", variant: "warning", confirmText: "Tạm ẩn", reasonLabel: "Lý do (hiển thị cho chủ trọ)", msg: (p) => `Khu trọ "${p.title}" sẽ không còn xuất hiện trong kết quả tìm kiếm và diễn đàn. Bạn có thể hiển thị lại bất cứ lúc nào.` },
    show: { title: "Hiển thị lại khu trọ", variant: "success", confirmText: "Hiển thị", msg: (p) => `Khu trọ "${p.title}" sẽ được hiển thị trở lại với người dùng.` },
    delete: { title: "Xóa khu trọ", variant: "danger", confirmText: "Xóa khu trọ", reasonLabel: "Lý do xóa (hiển thị cho chủ trọ)", msg: (p) => `Bạn chắc chắn muốn xóa khu trọ "${p.title}"? Các bài đăng liên quan sẽ bị đóng. Không thể xóa nếu khu trọ đang có hợp đồng hoặc người thuê.` },
  };
  const d = confirm ? dialogs[confirm.type] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        icon={<Building2 size={28} color="#8B5CF6" />}
        title="Quản lý Khu Trọ & Phòng"
        subtitle="Theo dõi toàn bộ khu trọ trên hệ thống và can thiệp khi phát hiện khu trọ ảo hoặc vi phạm."
      />

      <div style={{ ...cardStyle, padding: "16px 24px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 8, padding: "0 14px", flex: "1 1 280px", maxWidth: 420 }}>
          <Search size={18} color="#94A3B8" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên hoặc địa chỉ khu trọ..."
            style={{ border: "none", background: "transparent", outline: "none", padding: "10px 8px", width: "100%", fontSize: 14 }}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: 190 }}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="HIDDEN">Đang ẩn</option>
        </select>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {loading && data.content.length === 0 ? (
          <Spinner />
        ) : data.content.length === 0 ? (
          <EmptyState message="Không tìm thấy khu trọ nào phù hợp" />
        ) : (
          <div style={{ overflowX: "auto", opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr>
                  {["Khu trọ", "Chủ trọ", "Phòng (trống / tổng)", "Trạng thái", "Ngày tạo", ""].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.content.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setDetailId(p.id)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt="" style={{ width: 52, height: 42, borderRadius: 6, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 52, height: 42, borderRadius: 6, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                            <Building2 size={20} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: "#0F172A" }}>{p.title}</div>
                          <div style={{ fontSize: 12.5, color: "#64748B" }}>{[p.address, p.district, p.city].filter(Boolean).join(", ")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{p.landlordName || `#${p.landlordId}`}</div>
                      {p.landlordPhone && <div style={{ fontSize: 12.5, color: "#64748B" }}>{p.landlordPhone}</div>}
                    </td>
                    <td style={tdStyle}>{p.availableRooms} / {p.totalRooms}</td>
                    <td style={tdStyle}><StatusBadge status={p.status} /></td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{formatDateTime(p.createdAt)}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          title={p.status === "HIDDEN" ? "Hiển thị lại" : "Tạm ẩn"}
                          style={buttonStyle("default", { padding: "6px 9px" })}
                          onClick={() => openConfirm(p.status === "HIDDEN" ? "show" : "hide", p)}
                        >
                          {p.status === "HIDDEN" ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button title="Xóa" style={buttonStyle("ghostDanger", { padding: "6px 9px" })} onClick={() => openConfirm("delete", p)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.number ?? page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
      </div>

      <PropertyDetailModal
        propertyId={detailId}
        onClose={() => setDetailId(null)}
        onAction={(type, property) => openConfirm(type, property)}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={acting}
        title={d?.title}
        message={d && confirm ? d.msg(confirm.property) : ""}
        confirmText={d?.confirmText}
        variant={d?.variant}
        reasonLabel={d?.reasonLabel}
        reason={reason}
        onReasonChange={setReason}
      />
    </div>
  );
};

export default AdminProperties;
