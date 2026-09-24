import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Clock, Phone, Send, MessageCircle, ArrowLeft, 
  User, Maximize2, Home, Sparkles, Users, CheckCircle2, 
  AlertCircle, Calendar, FileText, Settings, X, Tag,
  Star, Edit3, Trash2, ShieldCheck, ThumbsUp
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { forumApi, rentalApi, reviewApi } from "../api/apiClient";

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const ForumPostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [msgForm, setMsgForm] = useState({ content: "", senderName: "", senderPhone: "" });
  const [sending, setSending] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  // Đánh giá 5 sao & Bình luận
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [eligibility, setEligibility] = useState({ eligible: false, reason: "", existingReview: null });
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  // Modal Yêu Cầu Thuê Phòng
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [rentalForm, setRentalForm] = useState({
    occupants: 1,
    moveInDate: "",
    note: "",
  });
  const [submittingRental, setSubmittingRental] = useState(false);

  // Modal Cài Đặt Nhu Cầu Ở Ghép (Chủ trọ)
  const [roommateModalOpen, setRoommateModalOpen] = useState(false);
  const [roommateForm, setRoommateForm] = useState({
    roommateNeeded: false,
    roommateCount: 1,
    roommateNote: "",
  });
  const [savingRoommate, setSavingRoommate] = useState(false);

  // Tải chi tiết bài đăng & tin nhắn
  const loadPostDetail = async () => {
    try {
      const res = await forumApi.getPostDetail(id);
      const postData = res.data || res;
      setPost(postData);
      setRoommateForm({
        roommateNeeded: Boolean(postData.roommateNeeded),
        roommateCount: postData.roommateCount || 1,
        roommateNote: postData.roommateNote || "",
      });
    } catch {
      toast.error("Không tìm thấy bài đăng");
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách đánh giá
  const loadReviews = async () => {
    try {
      const res = await reviewApi.getReviewsByPost(id);
      setReviews(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Kiểm tra quyền đánh giá (phải là người đã được duyệt vào ở trọ)
  const checkReviewEligibility = async () => {
    if (!user) return;
    try {
      const res = await reviewApi.checkEligibility(id);
      const data = res.data?.data || res.data || {};
      setEligibility(data);
      if (data.existingReview) {
        setEditRating(data.existingReview.rating || 5);
        setEditComment(data.existingReview.comment || "");
      }
    } catch (err) {
      console.warn("Lỗi kiểm tra quyền đánh giá:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadPostDetail();
    loadReviews();

    if (user) {
      checkReviewEligibility();
      forumApi
        .getMessages(id)
        .then((res) => setMessages(res.data || res || []))
        .catch(() => {});
    }
  }, [id, user]);

  useEffect(() => {
    if (user) {
      setMsgForm((prev) => ({
        ...prev,
        senderName: prev.senderName || user.fullName || "",
        senderPhone: prev.senderPhone || user.phoneNumber || "",
      }));
    }
  }, [user]);

  // Gửi đánh giá mới
  const handleCreateReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá");
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewApi.createReview({
        postId: Number(id),
        reviewerName: user.fullName || "Người thuê trọ",
        rating,
        comment,
      });
      toast.success("Cảm ơn bạn đã gửi đánh giá 5 sao cho phòng trọ! ⭐");
      setComment("");
      await loadReviews();
      await checkReviewEligibility();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Cập nhật đánh giá
  const handleUpdateReview = async (reviewId) => {
    try {
      await reviewApi.updateReview(reviewId, {
        rating: editRating,
        comment: editComment,
      });
      toast.success("Cập nhật đánh giá thành công! ✨");
      setEditingReviewId(null);
      await loadReviews();
      await checkReviewEligibility();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật đánh giá");
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài đánh giá này không?")) return;
    try {
      await reviewApi.deleteReview(reviewId);
      toast.success("Đã xóa đánh giá thành công!");
      await loadReviews();
      await checkReviewEligibility();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa đánh giá");
    }
  };

  // Gửi tin nhắn liên hệ
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi tin nhắn");
      return;
    }
    if (!msgForm.content.trim()) {
      toast.error("Vui lòng nhập nội dung tin nhắn");
      return;
    }
    setSending(true);
    try {
      await forumApi.sendMessage(id, msgForm);
      toast.success("Gửi tin nhắn thành công! Chủ trọ đã nhận được thông báo 💬");
      setMsgForm({ ...msgForm, content: "" });
      const res = await forumApi.getMessages(id);
      setMessages(res.data || res || []);
    } catch (err) {
      toast.error(err?.message || "Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  };

  // Nhanh chóng gửi tin nhắn xin ở ghép với mẫu có sẵn
  const handleQuickRoommateMessage = () => {
    const text = `Xin chào chủ trọ, mình thấy phòng đang có nhu cầu tìm ${post.roommateCount || 1} bạn ở ghép. Mình muốn liên hệ trao đổi thêm thông tin để ghép phòng ạ!`;
    setMsgForm((prev) => ({ ...prev, content: text }));
    const textarea = document.querySelector(".forum-send-msg textarea");
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Gửi yêu cầu thuê phòng
  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê");
      return;
    }

    setSubmittingRental(true);
    try {
      const formattedNote = `[YÊU CẦU THUÊ TỪ BÀI ĐĂNG #${id} - ${post.title}] | Số người: ${rentalForm.occupants} | Ngày dọn vào: ${rentalForm.moveInDate || "Sớm nhất"} | Ghi chú: ${rentalForm.note || "Khách sẵn sàng ký hợp đồng"}`;

      // 1. Tạo yêu cầu thuê phòng chính thức gửi đến chủ trọ
      await rentalApi.createRentalRequest({
        postId: Number(id),
        roomId: post.roomId || null,
        senderName: user.fullName || "Khách thuê",
        senderPhone: user.phoneNumber || "",
        note: formattedNote,
      });

      // 2. Gửi tin nhắn qua Messenger cho chủ trọ
      try {
        await forumApi.sendMessage(id, {
          senderName: user.fullName || "Khách thuê",
          senderPhone: user.phoneNumber || "",
          content: `⚡ ${formattedNote}`,
        });
        const res = await forumApi.getMessages(id);
        setMessages(res.data || res || []);
      } catch (msgErr) {
        console.warn("Message sending fallback:", msgErr);
      }

      toast.success("Đã gửi yêu cầu thuê phòng thành công! Chủ trọ sẽ duyệt yêu cầu của bạn 🎉");
      setRentalModalOpen(false);
      setRentalForm({ occupants: 1, moveInDate: "", note: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Gửi yêu cầu thuê thất bại");
    } finally {
      setSubmittingRental(false);
    }
  };

  // Cập nhật nhu cầu ở ghép (Dành cho Chủ trọ)
  const handleSaveRoommateStatus = async (e) => {
    e.preventDefault();
    setSavingRoommate(true);
    try {
      await forumApi.updateRoommateStatus(id, {
        roommateNeeded: roommateForm.roommateNeeded,
        roommateCount: parseInt(roommateForm.roommateCount, 10) || 1,
        roommateNote: roommateForm.roommateNote,
      });
      toast.success("Đã cập nhật nhu cầu ở ghép cho bài đăng!");
      setRoommateModalOpen(false);
      loadPostDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật nhu cầu ở ghép");
    } finally {
      setSavingRoommate(false);
    }
  };

  // Bật/tắt trạng thái Đã có người thuê (Dành cho Chủ trọ)
  const handleToggleRented = async () => {
    const nextStatus = !post.isRented;
    try {
      await forumApi.updateRentalStatus(id, { isRented: nextStatus });
      toast.success(nextStatus ? "Đã đánh dấu phòng: ĐÃ CÓ NGƯỜI THUÊ ⚡" : "Đã mở lại trạng thái phòng đang tìm khách!");
      loadPostDetail();
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái thuê phòng");
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <div className="wrap" style={{ paddingTop: 40 }}>
          <div className="empty-state">
            <b>Đang tải bài đăng...</b>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page-shell">
        <div className="wrap" style={{ paddingTop: 40 }}>
          <div className="empty-state">
            <b>Không tìm thấy bài đăng</b>
            <Link to="/forum" className="btn btn-primary" style={{ marginTop: 16 }}>
              Quay lại diễn đàn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === post.landlordId;

  return (
    <div className="page-shell">
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 60 }}>
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb" style={{ marginBottom: 20 }}>
          <Link to="/forum" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={14} /> Quay lại diễn đàn
          </Link>
        </div>

        {/* TOP FLASH BANNER: NẾU PHÒNG ĐÃ CÓ NGƯỜI THUÊ */}
        {post.isRented && (
          <div className="rented-alert-banner">
            <div className="rented-pulse-indicator">
              <span className="rented-dot-pulse"></span>
              <strong style={{ fontSize: "1rem", letterSpacing: "0.5px" }}>
                ⚡ THÔNG BÁO: PHÒNG NÀY ĐÃ CÓ NGƯỜI THUÊ / ĐẶT CỌC
              </strong>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.86rem", opacity: 0.9 }}>
              Phòng vừa được chủ trọ duyệt cho thuê. Bạn vẫn có thể nhắn tin cho chủ trọ để hỏi thêm về các phòng tương tự hoặc đặt chỗ dự phòng!
            </p>
          </div>
        )}

        {/* HIGHLIGHT BANNER: NHU CẦU Ở GHÉP (TO - ĐẬM - RÕ RÀNG) */}
        {post.roommateNeeded && (
          <div className="roommate-highlight-banner">
            <div className="roommate-banner-left">
              <div className="roommate-fire-icon">🔥</div>
              <div>
                <div className="roommate-headline">
                  ĐANG CẦN TÌM {post.roommateCount || 1} BẠN Ở GHÉP CÙNG!
                </div>
                <div className="roommate-subtext">
                  {post.roommateNote 
                    ? `Tiêu chí: "${post.roommateNote}"` 
                    : "Chia sẻ tiền phòng, điện nước minh bạch, giảm gánh nặng chi phí hàng tháng."}
                </div>
              </div>
            </div>
            {!isOwner && (
              <button 
                onClick={handleQuickRoommateMessage}
                className="btn roommate-cta-btn"
              >
                🤝 Xin ở ghép ngay
              </button>
            )}
          </div>
        )}

        <div className="forum-detail-layout">
          {/* Main content */}
          <div className="forum-detail-main">
            {/* Author Section */}
            <div className="forum-detail-author">
              <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "white" }}>
                {(post.landlordName || "C")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{post.landlordName || "Chủ trọ"}</span>
                  <span className="badge-landlord-verified">✓ Chủ trọ chính chủ</span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                  <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  {timeAgo(post.createdAt)}
                </div>
              </div>

              {/* Owner Quick Controls */}
              {isOwner && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button 
                    onClick={() => setRoommateModalOpen(true)}
                    className="btn btn-outline"
                    style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                  >
                    <Users size={14} /> Cài đặt ở ghép
                  </button>
                  <button 
                    onClick={handleToggleRented}
                    className={`btn ${post.isRented ? "btn-outline" : "btn-warning"}`}
                    style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                  >
                    {post.isRented ? "Bỏ đánh dấu Đã thuê" : "Đánh dấu: Đã thuê ⚡"}
                  </button>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <h1 className="forum-detail-title" style={{ margin: 0 }}>{post.title}</h1>
              {post.isRented && (
                <span className="post-pill-rented">⚡ ĐÃ CÓ NGƯỜI THUÊ</span>
              )}
              {post.roommateNeeded && (
                <span className="post-pill-roommate">👥 TÌM Ở GHÉP: {post.roommateCount || 1} BẠN</span>
              )}
            </div>

            {post.description && <p className="forum-detail-desc">{post.description}</p>}

            {/* Info Grid */}
            <div className="forum-detail-info-grid">
              <div className="forum-detail-info-item">
                <span className="forum-detail-info-label">Giá thuê niêm yết</span>
                <span className="forum-detail-info-value forum-detail-price">{formatVnd(post.price)}/tháng</span>
              </div>
              {post.roomArea && (
                <div className="forum-detail-info-item">
                  <span className="forum-detail-info-label">
                    <Maximize2 size={14} /> Diện tích
                  </span>
                  <span className="forum-detail-info-value">{post.roomArea}m²</span>
                </div>
              )}
              {post.roomType && (
                <div className="forum-detail-info-item">
                  <span className="forum-detail-info-label">
                    <Home size={14} /> Loại phòng
                  </span>
                  <span className="forum-detail-info-value">{post.roomType}</span>
                </div>
              )}
              <div className="forum-detail-info-item">
                <span className="forum-detail-info-label">
                  <MapPin size={14} /> Địa chỉ
                </span>
                <span className="forum-detail-info-value">
                  {post.address}, {post.ward}, {post.district}, {post.city}
                </span>
              </div>
            </div>

            {/* Utilities */}
            {post.utilities && (
              <div style={{ marginBottom: 24 }}>
                <h3 className="section-title">Tiện ích đi kèm</h3>
                <div className="tag-list" style={{ marginTop: 8 }}>
                  {post.utilities.split(",").map((u, i) => (
                    <span key={i} className="tag">{u.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {post.images && post.images.length > 0 && (
              <div className="forum-detail-gallery">
                <div className="forum-detail-main-img">
                  <img src={post.images[selectedImg]} alt="Ảnh phòng trọ" />
                </div>
                {post.images.length > 1 && (
                  <div className="forum-detail-thumbs">
                    {post.images.map((img, i) => (
                      <button
                        key={i}
                        className={`forum-thumb ${i === selectedImg ? "active" : ""}`}
                        onClick={() => setSelectedImg(i)}
                      >
                        <img src={img} alt={`Ảnh ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages Section */}
            <div className="forum-messages-section">
              <h3 className="section-title">
                <MessageCircle size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
                Tin nhắn trao đổi trực tiếp ({messages.length})
              </h3>

              {/* Message list */}
              {messages.length > 0 && (
                <div className="forum-messages-list">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`forum-msg ${msg.senderId === user?.id ? "forum-msg-mine" : ""}`}
                    >
                      <div className="forum-msg-header">
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {(msg.senderName || "U")[0]}
                        </div>
                        <div>
                          <span className="forum-msg-name">{msg.senderName || "Người dùng"}</span>
                          {msg.senderPhone && (
                            <span className="forum-msg-phone">
                              <Phone size={11} /> {msg.senderPhone}
                            </span>
                          )}
                        </div>
                        <span className="forum-msg-time">{timeAgo(msg.createdAt)}</span>
                      </div>
                      <div className="forum-msg-content">{msg.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Send message form */}
              {user && !isOwner && (
                <form className="forum-send-msg" onSubmit={handleSendMessage}>
                  <div className="forum-send-msg-inputs">
                    <input
                      placeholder="Tên của bạn"
                      value={msgForm.senderName}
                      onChange={(e) => setMsgForm({ ...msgForm, senderName: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <input
                      placeholder="SĐT liên hệ"
                      value={msgForm.senderPhone}
                      onChange={(e) => setMsgForm({ ...msgForm, senderPhone: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="forum-send-msg-row">
                    <textarea
                      placeholder="Nhập câu hỏi hoặc lời nhắn liên hệ chủ trọ..."
                      value={msgForm.content}
                      onChange={(e) => setMsgForm({ ...msgForm, content: e.target.value })}
                      rows={3}
                    />
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      <Send size={16} />
                      {sending ? "Đang gửi..." : "Gửi tin"}
                    </button>
                  </div>
                </form>
              )}

              {!user && (
                <div className="forum-login-prompt">
                  <Link to="/login" className="btn btn-primary">
                    Đăng nhập để gửi tin nhắn & yêu cầu thuê
                  </Link>
                </div>
              )}
            </div>

            {/* 6. ĐÁNH GIÁ 5 SAO & BÌNH LUẬN TỪ NGƯỜI THUÊ ĐÃ DUYỆT */}
            <div className="forum-reviews-section" style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", padding: "24px", marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Star size={20} color="#f59e0b" fill="#f59e0b" />
                    Đánh giá & Trải nghiệm thực tế ({reviews.length})
                  </h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                    Đánh giá khách quan từ những người thuê đã được chủ trọ duyệt hợp đồng vào ở
                  </p>
                </div>
                {reviews.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", padding: "6px 14px", borderRadius: 9999, border: "1px solid #fef3c7" }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#d97706" }}>
                      {(reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)}
                    </span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} color="#f59e0b" fill={s <= Math.round(reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length) ? "#f59e0b" : "transparent"} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>/ 5.0</span>
                  </div>
                )}
              </div>

              {/* Form viết đánh giá hoặc Banner quyền hạn */}
              {user ? (
                eligibility.eligible ? (
                  !eligibility.existingReview || editingReviewId ? (
                    <form onSubmit={(e) => { e.preventDefault(); editingReviewId ? handleUpdateReview(editingReviewId) : handleCreateReview(e); }} style={{ background: "#f8fafc", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          {editingReviewId ? "Chỉnh sửa đánh giá của bạn:" : "Chọn số sao đánh giá phòng trọ này:"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => editingReviewId ? setEditRating(s) : setRating(s)}
                              onMouseEnter={() => editingReviewId ? setEditHoverRating(s) : setHoverRating(s)}
                              onMouseLeave={() => editingReviewId ? setEditHoverRating(0) : setHoverRating(0)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                            >
                              <Star
                                size={26}
                                color="#f59e0b"
                                fill={s <= (editingReviewId ? (editHoverRating || editRating) : (hoverRating || rating)) ? "#f59e0b" : "none"}
                              />
                            </button>
                          ))}
                          <span style={{ marginLeft: 8, fontWeight: 800, color: "#d97706", fontSize: 14 }}>
                            {editingReviewId 
                              ? (editRating === 5 ? "⭐⭐⭐⭐⭐ Tuyệt vời" : `${editRating} Sao`) 
                              : (rating === 5 ? "⭐⭐⭐⭐⭐ Tuyệt vời" : `${rating} Sao`)}
                          </span>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={editingReviewId ? editComment : comment}
                        onChange={(e) => editingReviewId ? setEditComment(e.target.value) : setComment(e.target.value)}
                        placeholder="Nhập cảm nhận của bạn về phòng trọ (an ninh, độ sạch sẽ, thái độ chủ trọ, điện nước, internet...)"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                      />

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                        {editingReviewId && (
                          <button
                            type="button"
                            onClick={() => setEditingReviewId(null)}
                            className="btn btn-outline"
                            style={{ padding: "8px 16px", fontSize: 13 }}
                          >
                            Hủy bỏ
                          </button>
                        )}
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submittingReview}
                          style={{ padding: "8px 20px", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          <Star size={15} />
                          {editingReviewId ? "Lưu thay đổi đánh giá" : "Đăng đánh giá 5 sao"}
                        </button>
                      </div>
                    </form>
                  ) : null
                ) : (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 18px", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13.5, color: "#166534" }}>
                      <strong>Chính sách đánh giá minh bạch:</strong> Chỉ những người thuê đã được chủ trọ duyệt hợp đồng vào ở tại phòng này mới có thể viết đánh giá & chấm sao. Bạn có thể gửi <strong>"Yêu cầu thuê"</strong> hoặc liên hệ chủ trọ để được xét duyệt!
                    </div>
                  </div>
                )
              ) : (
                <div style={{ background: "#f8fafc", border: "1px solid var(--border)", padding: "14px 18px", borderRadius: 12, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                    Đăng nhập bằng tài khoản người thuê để gửi đánh giá phòng.
                  </span>
                  <Link to="/login" className="btn btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>
                    Đăng nhập ngay
                  </Link>
                </div>
              )}

              {/* Danh sách các review */}
              {loadingReviews ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                  Đang tải đánh giá...
                </div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc", borderRadius: 12, border: "1px dashed var(--border)" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Chưa có bài đánh giá nào</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                    Người thuê phòng đầu tiên được chủ trọ duyệt vào ở sẽ có thể để lại đánh giá tại đây.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {reviews.map((r) => {
                    const isMyReview = user && (r.reviewerId === user.id || user.role === "ADMIN");
                    return (
                      <div
                        key={r.id}
                        style={{
                          border: isMyReview ? "1.5px solid #60a5fa" : "1px solid var(--border)",
                          background: isMyReview ? "#f0f9ff" : "#ffffff",
                          borderRadius: 12,
                          padding: "16px 20px",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: isMyReview ? "#2563eb" : "#64748b", color: "#fff", fontWeight: 700 }}>
                              {(r.reviewerName || "N")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <strong style={{ fontSize: 14 }}>{r.reviewerName || "Người thuê trọ"}</strong>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999 }}>
                                  <CheckCircle2 size={11} /> Cư dân đã xác thực
                                </span>
                                {isMyReview && (
                                  <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999 }}>
                                    Đánh giá của bạn
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                                {timeAgo(r.createdAt)} {r.updatedAt && "(Đã chỉnh sửa)"}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Stars */}
                            <div style={{ display: "flex", gap: 2 }}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={16}
                                  color="#f59e0b"
                                  fill={s <= (r.rating || 5) ? "#f59e0b" : "transparent"}
                                />
                              ))}
                            </div>

                            {/* Actions nếu là chủ bài đánh giá */}
                            {isMyReview && (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingReviewId(r.id);
                                    setEditRating(r.rating || 5);
                                    setEditComment(r.comment || "");
                                  }}
                                  title="Chỉnh sửa đánh giá"
                                  style={{ background: "#e0f2fe", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#0284c7", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                                >
                                  <Edit3 size={13} /> Sửa
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(r.id)}
                                  title="Xóa đánh giá"
                                  style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#b91c1c", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}
                                >
                                  <Trash2 size={13} /> Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Review Comment */}
                        <p style={{ margin: "10px 0 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>
                          {r.comment || "Người thuê không để lại bình luận chi tiết."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="forum-detail-sidebar">
            <div className="side-card">
              {/* Landlord info */}
              <div className="landlord">
                <div className="avatar" style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white" }}>
                  {(post.landlordName || "C")[0]}
                </div>
                <div>
                  <div className="name">{post.landlordName || "Chủ trọ"}</div>
                  <div className="verified-text">✓ Đã xác thực CCCD & Số điện thoại</div>
                </div>
              </div>

              {/* Contact info */}
              {post.contactPhone && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 4 }}>Số điện thoại hotline</div>
                  <a
                    href={`tel:${post.contactPhone}`}
                    style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}
                  >
                    <Phone size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    {post.contactPhone}
                  </a>
                </div>
              )}

              {/* Price */}
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 4 }}>Giá thuê tháng</div>
                <div style={{ fontWeight: 800, fontSize: 24, color: "var(--brand-primary, #2563eb)", fontFamily: "Manrope, sans-serif" }}>
                  {formatVnd(post.price)}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>/tháng</span>
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 4 }}>
                  <MapPin size={12} style={{ verticalAlign: "middle" }} /> Vị trí phòng
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  {post.address}, {post.ward}, {post.district}, {post.city}
                </div>
              </div>

              {/* Mã định danh trọ */}
              <div style={{ marginBottom: 16, background: "#f8fafc", padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Tag size={14} color="#2563eb" />
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink)" }}>
                  Mã định danh trọ: <span style={{ color: "#2563eb" }}>#POST-{post.id}</span>
                </span>
              </div>

              {/* ACTION BUTTONS: GỬI YÊU CẦU THUÊ PHÒNG, Ở GHÉP & NHẮN TIN */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {/* Primary CTA: Gửi yêu cầu thuê phòng (nếu là khách) hoặc Quản lý duyệt (nếu là chủ) */}
                {isOwner ? (
                  <Link
                    to="/landlord/requests"
                    className="btn-block btn-primary rental-cta-btn"
                    style={{ textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", borderRadius: "12px" }}
                  >
                    <Clock size={18} style={{ marginRight: 6 }} />
                    📥 Xem & Duyệt yêu cầu thuê trọ
                  </Link>
                ) : (
                  <button
                    className="btn-block btn-primary rental-cta-btn"
                    onClick={() => setRentalModalOpen(true)}
                  >
                    <CheckCircle2 size={18} style={{ marginRight: 6 }} />
                    ⚡ Gửi yêu cầu thuê phòng
                  </button>
                )}

                {/* Secondary CTA: Tìm người ở ghép / Bạn đồng hành */}
                <button
                  className="btn-block btn-accent"
                  style={{ fontWeight: 700, padding: 12, borderRadius: 12 }}
                  onClick={() => setRoommateModalOpen(true)}
                >
                  <Users size={18} style={{ marginRight: 6 }} />
                  👥 Tìm bạn ở ghép / Đồng hành
                </button>

                {/* Tertiary CTA: Nhắn tin trao đổi */}
                <button
                  className="btn-block btn-outline"
                  onClick={() => {
                    document.querySelector(".forum-send-msg textarea")?.focus();
                  }}
                >
                  <MessageCircle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  Nhắn tin trao đổi
                </button>
              </div>

              {isOwner && (
                <div className="owner-notice-box">
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e40af" }}>
                    Đây là bài đăng của bạn
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#3b82f6", marginTop: 4 }}>
                    Bạn có thể cập nhật nhu cầu ở ghép hoặc đánh dấu đã có người thuê tại thanh công cụ phía trên.
                  </div>
                </div>
              )}

              <p className="trust-line">
                Miễn phí cho người thuê · Chủ trọ đã ký cam kết chính sách minh bạch trên Roomily.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL GỬI YÊU CẦU THUÊ PHÒNG */}
      {rentalModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                ⚡ Gửi yêu cầu thuê phòng
              </h3>
              <button 
                onClick={() => setRentalModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <p className="modal-sub" style={{ marginBottom: 16 }}>
              Yêu cầu của bạn sẽ được chuyển trực tiếp tới mục <b>Yêu cầu thuê</b> của chủ trọ <b>{post.landlordName}</b> để duyệt hồ sơ và kích hoạt hợp đồng điện tử.
            </p>

            <form onSubmit={handleRentalSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    <Users size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Số người ở
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={rentalForm.occupants}
                    onChange={(e) => setRentalForm({ ...rentalForm, occupants: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                    required
                  />
                </div>
                <div style={{ flex: 1.4 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                    <Calendar size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Ngày dự kiến chuyển vào
                  </label>
                  <input
                    type="date"
                    value={rentalForm.moveInDate}
                    onChange={(e) => setRentalForm({ ...rentalForm, moveInDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                  <FileText size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Lời nhắn gửi chủ trọ
                </label>
                <textarea
                  rows={3}
                  value={rentalForm.note}
                  onChange={(e) => setRentalForm({ ...rentalForm, note: e.target.value })}
                  placeholder="Giới thiệu bản thân (nghề nghiệp, thời gian dự kiến thuê lâu dài...)"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setRentalModalOpen(false)}
                  disabled={submittingRental}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingRental}
                >
                  {submittingRental ? "Đang gửi yêu cầu..." : "Xác nhận gửi yêu cầu thuê"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT NHU CẦU Ở GHÉP (DÀNH CHO CHỦ TRỌ) */}
      {roommateModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                👥 Cài đặt nhu cầu ở ghép
              </h3>
              <button 
                onClick={() => setRoommateModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <p className="modal-sub" style={{ marginBottom: 16 }}>
              Khi kích hoạt, bài đăng trên Diễn đàn sẽ xuất hiện <b>Banner Nhu Cầu Ở Ghép</b> to, đậm, rõ ràng để thu hút khách thuê muốn ghép phòng.
            </p>

            <form onSubmit={handleSaveRoommateStatus}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={roommateForm.roommateNeeded}
                    onChange={(e) => setRoommateForm({ ...roommateForm, roommateNeeded: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>Đang có nhu cầu tìm người ở ghép cho phòng này</span>
                </label>
              </div>

              {roommateForm.roommateNeeded && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Số lượng người cần tìm ở ghép (bạn)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={roommateForm.roommateCount}
                      onChange={(e) => setRoommateForm({ ...roommateForm, roommateCount: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6 }}>
                      Tiêu chí / Ghi chú cho người ở ghép
                    </label>
                    <textarea
                      rows={3}
                      value={roommateForm.roommateNote}
                      onChange={(e) => setRoommateForm({ ...roommateForm, roommateNote: e.target.value })}
                      placeholder="Ví dụ: Ưu tiên sinh viên hoặc nhân viên văn phòng gọn gàng, chia đôi tiền điện nước..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setRoommateModalOpen(false)}
                  disabled={savingRoommate}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingRoommate}
                >
                  {savingRoommate ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPostDetail;
