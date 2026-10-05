import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, Search, Check, X, Trash2, MapPin, Phone, Clock, Image as ImageIcon, Users } from "lucide-react";
import { adminApi } from "../api/apiClient";
import {
  ConfirmDialog, EmptyState, Modal, PageHeader, Pagination, Spinner, StatusBadge,
  buttonStyle, cardStyle, errorMessage, formatDateTime, formatVnd, inputStyle, useDebounced,
} from "../components/admin/AdminUi";

const PAGE_SIZE = 9;

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ duyệt" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "REJECTED", label: "Bị từ chối" },
];

const summarize = (text, max = 140) => {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
};

const PostCard = ({ post, onOpen, onApprove, onReject, onDelete }) => {
  const img = post.images?.[0];
  const canApprove = post.moderationStatus !== "APPROVED";
  const canReject = post.moderationStatus !== "REJECTED";
  return (
    <div style={{ ...cardStyle, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div onClick={() => onOpen(post)} style={{ cursor: "pointer", position: "relative", height: 170, background: "#F1F5F9" }}>
        {img ? (
          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
            <ImageIcon size={30} />
          </div>
        )}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
          <StatusBadge status={post.moderationStatus} />
          {post.status === "CLOSED" && <StatusBadge status="CLOSED" />}
        </div>
        {post.images?.length > 1 && (
          <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(15,23,42,.75)", color: "white", fontSize: 12, padding: "2px 8px", borderRadius: 999 }}>
            {post.images.length} ảnh
          </span>
        )}
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h3 onClick={() => onOpen(post)} style={{ margin: 0, fontSize: 16, color: "#0F172A", cursor: "pointer", lineHeight: 1.35 }}>{post.title}</h3>
        <div style={{ fontSize: 13, color: "#64748B" }}>
          <b style={{ color: "#334155" }}>{post.landlordName || `Chủ trọ #${post.landlordId}`}</b> · <Clock size={12} style={{ verticalAlign: -1 }} /> {formatDateTime(post.createdAt)}
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: "#475569", lineHeight: 1.55, flex: 1 }}>{summarize(post.description) || "Không có mô tả"}</p>
        <div style={{ fontSize: 13, color: "#8B5CF6", fontWeight: 700 }}>{formatVnd(post.price)}/tháng</div>

        {post.moderationStatus === "REJECTED" && post.rejectReason && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", borderRadius: 8, padding: "8px 10px", fontSize: 12.5 }}>
            Lý do từ chối: {post.rejectReason}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          {canApprove && (
            <button style={buttonStyle("success", { flex: 1 })} onClick={() => onApprove(post)}>
              <Check size={15} /> {post.moderationStatus === "REJECTED" ? "Duyệt lại" : "Duyệt bài"}
            </button>
          )}
          {canReject && (
            <button style={buttonStyle("ghostDanger", { flex: 1 })} onClick={() => onReject(post)}>
              <X size={15} /> {post.moderationStatus === "APPROVED" ? "Gỡ bài" : "Từ chối"}
            </button>
          )}
          <button title="Xóa bài" style={buttonStyle("default", { padding: "8px 10px", color: "#B91C1C" })} onClick={() => onDelete(post)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PostDetailModal = ({ post, onClose, onApprove, onReject, onDelete }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [post?.id]);
  if (!post) return null;
  const images = post.images || [];
  const canApprove = post.moderationStatus !== "APPROVED";
  const canReject = post.moderationStatus !== "REJECTED";
  return (
    <Modal
      open
      onClose={onClose}
      title="Chi tiết bài đăng"
      width={780}
      footer={
        <>
          <button style={buttonStyle("default", { color: "#B91C1C" })} onClick={() => onDelete(post)}><Trash2 size={15} /> Xóa bài</button>
          {canReject && <button style={buttonStyle("ghostDanger")} onClick={() => onReject(post)}><X size={15} /> {post.moderationStatus === "APPROVED" ? "Gỡ bài" : "Từ chối"}</button>}
          {canApprove && <button style={buttonStyle("success")} onClick={() => onApprove(post)}><Check size={15} /> Duyệt bài</button>}
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {images.length > 0 && (
          <div>
            <div style={{ height: 300, background: "#0F172A", borderRadius: 10, overflow: "hidden" }}>
              <img src={images[Math.min(idx, images.length - 1)]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto" }}>
                {images.map((src, i) => (
                  <img key={i} src={src} alt="" onClick={() => setIdx(i)}
                    style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 6, cursor: "pointer", flexShrink: 0, border: i === idx ? "2px solid #8B5CF6" : "2px solid transparent" }} />
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#0F172A" }}>{post.title}</h2>
          <StatusBadge status={post.moderationStatus} />
          {post.status === "CLOSED" && <StatusBadge status="CLOSED" />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, fontSize: 14, color: "#334155" }}>
          <div><b>Người đăng:</b> {post.landlordName || `#${post.landlordId}`}</div>
          <div><Phone size={13} style={{ verticalAlign: -2 }} /> {post.contactPhone || "—"}</div>
          <div><b>Giá:</b> {formatVnd(post.price)}/tháng</div>
          <div><b>Diện tích:</b> {post.roomArea ? `${post.roomArea} m²` : "—"}</div>
          <div style={{ gridColumn: "1 / -1" }}><MapPin size={13} style={{ verticalAlign: -2 }} /> {[post.address, post.ward, post.district, post.city].filter(Boolean).join(", ")}</div>
          {post.utilities && <div style={{ gridColumn: "1 / -1" }}><b>Tiện ích:</b> {post.utilities}</div>}
          {post.roommateNeeded && (
            <div style={{ gridColumn: "1 / -1" }}><Users size={13} style={{ verticalAlign: -2 }} /> Tìm {post.roommateCount || 1} người ở ghép{post.roommateNote ? ` — ${post.roommateNote}` : ""}</div>
          )}
          <div style={{ color: "#94A3B8", fontSize: 12.5, gridColumn: "1 / -1" }}>Đăng lúc {formatDateTime(post.createdAt)}{post.moderatedAt ? ` · Kiểm duyệt lúc ${formatDateTime(post.moderatedAt)}` : ""}</div>
        </div>
        <div style={{ whiteSpace: "pre-wrap", fontSize: 14, color: "#475569", lineHeight: 1.65, background: "#F8FAFC", borderRadius: 10, padding: 14 }}>
          {post.description || "Không có mô tả"}
        </div>
        {post.moderationStatus === "REJECTED" && post.rejectReason && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", borderRadius: 8, padding: "10px 12px", fontSize: 13.5 }}>
            Lý do từ chối: {post.rejectReason}
          </div>
        )}
      </div>
    </Modal>
  );
};

const AdminForumPosts = () => {
  const [tab, setTab] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  // { type: 'approve' | 'reject' | 'delete', post }
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);

  const debouncedKeyword = useDebounced(keyword);
  const reqId = useRef(0);

  const fetchStats = useCallback(() => {
    adminApi.getForumPostStats().then((res) => setStats(res.data || {})).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, sort: "createdAt,desc" };
      if (tab !== "ALL") params.status = tab;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      const res = await adminApi.getForumPosts(params);
      if (id === reqId.current) setData(res.data);
    } catch (err) {
      if (id === reqId.current) toast.error(errorMessage(err, "Không tải được danh sách bài đăng"));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, tab, debouncedKeyword]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(0); }, [tab, debouncedKeyword]);

  const openConfirm = (type, post) => { setReason(""); setConfirm({ type, post }); };

  const runConfirm = async () => {
    if (!confirm) return;
    const { type, post } = confirm;
    setActing(true);
    try {
      if (type === "delete") {
        await adminApi.deleteForumPost(post.id, reason.trim());
        toast.success("Đã xóa bài đăng");
      } else {
        await adminApi.updateForumPostStatus(post.id, {
          status: type === "approve" ? "APPROVED" : "REJECTED",
          reason: type === "reject" ? reason.trim() : undefined,
        });
        toast.success(type === "approve" ? "Đã duyệt bài đăng" : "Đã từ chối bài đăng");
      }
      setConfirm(null);
      setDetail(null);
      fetchData();
      fetchStats();
    } catch (err) {
      toast.error(errorMessage(err, "Thao tác thất bại"));
    } finally {
      setActing(false);
    }
  };

  const dialogs = {
    approve: { title: "Duyệt bài đăng", variant: "success", confirmText: "Duyệt bài", msg: (p) => `Bài "${p.title}" sẽ được hiển thị công khai trên diễn đàn.` },
    reject: { title: "Từ chối bài đăng", variant: "danger", confirmText: "Từ chối", reasonLabel: "Lý do từ chối (gửi tới chủ trọ)", reasonRequired: true, reasonPlaceholder: "VD: Hình ảnh không đúng thực tế, thông tin liên hệ không hợp lệ...", msg: (p) => `Bài "${p.title}" sẽ không được hiển thị. Chủ trọ sẽ nhận được thông báo kèm lý do.` },
    delete: { title: "Xóa bài đăng", variant: "danger", confirmText: "Xóa bài", reasonLabel: "Lý do xóa (không bắt buộc)", msg: (p) => `Bạn chắc chắn muốn xóa bài "${p.title}"? Bài sẽ biến mất khỏi diễn đàn.` },
  };
  const d = confirm ? dialogs[confirm.type] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PageHeader
        icon={<MessageSquare size={28} color="#8B5CF6" />}
        title="Quản lý Diễn đàn & Bài đăng"
        subtitle="Kiểm duyệt bài đăng cho thuê / tìm ở ghép trước khi hiển thị cho người dùng."
      />

      <div style={{ ...cardStyle, padding: "12px 24px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = stats[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={buttonStyle(active ? "primary" : "default", { borderRadius: 999 })}
              >
                {t.label}
                {count !== undefined && (
                  <span style={{ background: active ? "rgba(255,255,255,.25)" : "#F1F5F9", color: active ? "white" : "#475569", borderRadius: 999, padding: "0 7px", fontSize: 12 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", background: "#F1F5F9", borderRadius: 8, padding: "0 14px", width: 300, maxWidth: "100%" }}>
          <Search size={18} color="#94A3B8" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm tiêu đề, người đăng, địa chỉ..."
            style={{ ...inputStyle, border: "none", background: "transparent", padding: "10px 8px" }}
          />
        </div>
      </div>

      {loading && data.content.length === 0 ? (
        <div style={cardStyle}><Spinner /></div>
      ) : data.content.length === 0 ? (
        <div style={cardStyle}><EmptyState message="Không có bài đăng nào" /></div>
      ) : (
        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {data.content.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onOpen={setDetail}
              onApprove={(post) => openConfirm("approve", post)}
              onReject={(post) => openConfirm("reject", post)}
              onDelete={(post) => openConfirm("delete", post)}
            />
          ))}
        </div>
      )}

      <div style={cardStyle}>
        <Pagination page={data.number ?? page} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
      </div>

      <PostDetailModal
        post={detail}
        onClose={() => setDetail(null)}
        onApprove={(post) => openConfirm("approve", post)}
        onReject={(post) => openConfirm("reject", post)}
        onDelete={(post) => openConfirm("delete", post)}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={acting}
        title={d?.title}
        message={d && confirm ? d.msg(confirm.post) : ""}
        confirmText={d?.confirmText}
        variant={d?.variant}
        reasonLabel={d?.reasonLabel}
        reasonRequired={d?.reasonRequired}
        reasonPlaceholder={d?.reasonPlaceholder}
        reason={reason}
        onReasonChange={setReason}
      />
    </div>
  );
};

export default AdminForumPosts;
