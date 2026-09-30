import React, { useState, useEffect } from 'react';
import { reviewApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Star, Shield, Sparkles, DollarSign, User, MessageSquare, CornerDownRight, Edit2, Trash2 } from 'lucide-react';

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

// Component chọn sao với hiệu ứng hover
const StarRating = ({ value, onChange, readonly = false, size = 18 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          fill={(hover || value) >= star ? "#f59e0b" : "transparent"}
          color={(hover || value) >= star ? "#f59e0b" : "#d1d5db"}
          style={{
            cursor: readonly ? "default" : "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange && onChange(star)}
        />
      ))}
    </div>
  );
};

const ReviewSection = ({ postId, landlordId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);

  // Form state
  const [form, setForm] = useState({
    securityRating: 0,
    cleanlinessRating: 0,
    priceRating: 0,
    landlordRating: 0,
    comment: ""
  });
  
  // Landlord reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const loadReviews = async () => {
    try {
      const res = await reviewApi.getReviewsByPost(postId);
      setReviews(res.data || res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const checkEligibility = async () => {
    if (!user) return;
    try {
      const res = await reviewApi.checkEligibility(postId);
      const data = res.data || res;
      setEligibility(data);
      if (data.existingReview) {
        setForm({
          securityRating: data.existingReview.securityRating || data.existingReview.rating || 0,
          cleanlinessRating: data.existingReview.cleanlinessRating || data.existingReview.rating || 0,
          priceRating: data.existingReview.priceRating || data.existingReview.rating || 0,
          landlordRating: data.existingReview.landlordRating || data.existingReview.rating || 0,
          comment: data.existingReview.comment || ""
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReviews(), checkEligibility()]).finally(() => setLoading(false));
  }, [postId, user]);

  const calculateAverages = () => {
    if (reviews.length === 0) return { overall: 0, security: 0, cleanliness: 0, price: 0, landlord: 0 };
    const sums = reviews.reduce((acc, r) => {
      acc.overall += r.rating || 0;
      acc.security += r.securityRating || r.rating || 0;
      acc.cleanliness += r.cleanlinessRating || r.rating || 0;
      acc.price += r.priceRating || r.rating || 0;
      acc.landlord += r.landlordRating || r.rating || 0;
      return acc;
    }, { overall: 0, security: 0, cleanliness: 0, price: 0, landlord: 0 });
    
    return {
      overall: (sums.overall / reviews.length).toFixed(1),
      security: (sums.security / reviews.length).toFixed(1),
      cleanliness: (sums.cleanliness / reviews.length).toFixed(1),
      price: (sums.price / reviews.length).toFixed(1),
      landlord: (sums.landlord / reviews.length).toFixed(1),
    };
  };

  const averages = calculateAverages();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.securityRating || !form.cleanlinessRating || !form.priceRating || !form.landlordRating) {
      toast.error("Vui lòng đánh giá đủ số sao cho cả 4 tiêu chí!");
      return;
    }
    try {
      if (isEditing || (eligibility && eligibility.existingReview)) {
        const reviewId = isEditing || eligibility.existingReview.id;
        await reviewApi.updateReview(reviewId, form);
        toast.success("Cập nhật đánh giá thành công!");
      } else {
        await reviewApi.createReview({
          postId,
          reviewerName: user.fullName || "Người thuê",
          ...form
        });
        toast.success("Đã gửi đánh giá thành công!");
      }
      setShowForm(false);
      setIsEditing(null);
      await Promise.all([loadReviews(), checkEligibility()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu đánh giá");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa đánh giá này?")) return;
    try {
      await reviewApi.deleteReview(id);
      toast.success("Đã xóa đánh giá");
      if (eligibility?.existingReview?.id === id) {
        setEligibility({ ...eligibility, existingReview: null });
        setForm({ securityRating: 0, cleanlinessRating: 0, priceRating: 0, landlordRating: 0, comment: "" });
      }
      loadReviews();
    } catch (err) {
      toast.error("Lỗi xóa đánh giá");
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    try {
      await reviewApi.replyToReview(reviewId, { replyMessage: replyText });
      toast.success("Đã gửi phản hồi");
      setReplyingTo(null);
      setReplyText("");
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi phản hồi");
    }
  };

  const canReview = eligibility?.eligible;
  const hasReviewed = !!eligibility?.existingReview;
  const isLandlord = user?.id === landlordId;

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden", marginTop: 24, boxShadow: "var(--shadow-card)" }}>
      {/* Header & Stats */}
      <div style={{ padding: "24px 30px", borderBottom: "1px solid var(--border)", background: "#fdfdfd" }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <Star size={22} color="#f59e0b" fill="#f59e0b" /> Đánh giá chân thực từ người thuê ({reviews.length})
        </h3>
        
        {reviews.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{averages.overall}</div>
              <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                <StarRating value={Math.round(averages.overall)} readonly size={16} />
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>TỔNG QUAN</div>
            </div>
            
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
              {[
                { label: "An ninh", val: averages.security, icon: <Shield size={14} color="#3b82f6" /> },
                { label: "Vệ sinh", val: averages.cleanliness, icon: <Sparkles size={14} color="#10b981" /> },
                { label: "Giá cả", val: averages.price, icon: <DollarSign size={14} color="#f59e0b" /> },
                { label: "Chủ trọ", val: averages.landlord, icon: <User size={14} color="#8b5cf6" /> },
              ].map(stat => (
                <div key={stat.label} style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{stat.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{stat.val} <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>/5</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review List */}
      <div style={{ padding: "0" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Đang tải đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <MessageSquare size={40} color="#e5e7eb" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: 500 }}>Chưa có đánh giá nào cho khu trọ này.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {reviews.map((r, i) => (
              <div key={r.id} style={{ padding: "24px 30px", borderBottom: i < reviews.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                      {r.reviewerName ? r.reviewerName[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{r.reviewerName || "Người thuê ẩn danh"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{timeAgo(r.createdAt)} {r.updatedAt && r.updatedAt !== r.createdAt && "(Đã chỉnh sửa)"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#fef3c7", padding: "4px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={14} fill="#d97706" color="#d97706" />
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>{r.rating || 5}.0</span>
                    </div>
                    {user?.id === r.reviewerId && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setIsEditing(r.id); setShowForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", padding: 4 }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 4 }}><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub ratings */}
                <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 4 }}>
                    <Shield size={14} /> An ninh: <strong style={{ color: "var(--ink)" }}>{r.securityRating || r.rating}/5</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 4 }}>
                    <Sparkles size={14} /> Vệ sinh: <strong style={{ color: "var(--ink)" }}>{r.cleanlinessRating || r.rating}/5</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 4 }}>
                    <DollarSign size={14} /> Giá cả: <strong style={{ color: "var(--ink)" }}>{r.priceRating || r.rating}/5</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 4 }}>
                    <User size={14} /> Chủ trọ: <strong style={{ color: "var(--ink)" }}>{r.landlordRating || r.rating}/5</strong>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>{r.comment}</p>

                {/* Landlord Reply */}
                {r.landlordReply && (
                  <div style={{ marginTop: 16, marginLeft: 20, padding: "12px 16px", background: "#f0fdf4", borderLeft: "3px solid #16a34a", borderRadius: "0 8px 8px 0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <CornerDownRight size={14} /> Chủ trọ phản hồi:
                    </div>
                    <div style={{ fontSize: 14, color: "#15803d", lineHeight: 1.5 }}>{r.landlordReply}</div>
                  </div>
                )}

                {/* Reply action for landlord */}
                {isLandlord && !r.landlordReply && (
                  <div style={{ marginTop: 12 }}>
                    {replyingTo === r.id ? (
                      <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                        <textarea
                          rows={2}
                          placeholder="Nhập phản hồi của bạn..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", marginBottom: 8, fontSize: 13 }}
                        />
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => setReplyingTo(null)} className="btn btn-outline" style={{ padding: "4px 12px", fontSize: 12 }}>Hủy</button>
                          <button onClick={() => handleReplySubmit(r.id)} className="btn btn-primary" style={{ padding: "4px 12px", fontSize: 12 }}>Gửi phản hồi</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReplyingTo(r.id)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <CornerDownRight size={14} /> Phản hồi đánh giá này
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write Review Action */}
      {!isLandlord && (
        <div style={{ padding: "20px 30px", background: "#f9fafb", borderTop: "1px solid var(--border)" }}>
          {!user ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              Vui lòng đăng nhập để đánh giá khu trọ này.
            </div>
          ) : !canReview ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              <Shield size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Chỉ những người đã thuê trọ tại đây mới có quyền đánh giá.
            </div>
          ) : !showForm ? (
            <div style={{ textAlign: "center" }}>
              <button 
                onClick={() => setShowForm(true)} 
                className="btn btn-primary"
                style={{ fontWeight: 700, padding: "10px 24px" }}
              >
                {hasReviewed ? "Sửa đánh giá của bạn" : "Viết đánh giá chân thực"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 24, borderRadius: 12, border: "1px solid var(--border)", animation: "fadeIn 0.3s ease" }}>
              <h4 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 800 }}>{isEditing || hasReviewed ? "Chỉnh sửa đánh giá" : "Đánh giá chi tiết"}</h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", marginBottom: 20 }}>
                {[
                  { key: "securityRating", label: "An ninh khu vực" },
                  { key: "cleanlinessRating", label: "Mức độ sạch sẽ" },
                  { key: "priceRating", label: "Giá cả hợp lý" },
                  { key: "landlordRating", label: "Thái độ chủ trọ" },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label} <span style={{ color: "red" }}>*</span></span>
                    <StarRating 
                      value={form[item.key]} 
                      onChange={(val) => setForm({...form, [item.key]: val})} 
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Chia sẻ trải nghiệm của bạn (Không bắt buộc)</label>
                <textarea
                  rows={4}
                  placeholder="Phòng có ồn không? Chủ trọ có hỗ trợ nhanh khi hỏng hóc không?..."
                  value={form.comment}
                  onChange={e => setForm({...form, comment: e.target.value})}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setShowForm(false); setIsEditing(null); }} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {isEditing || hasReviewed ? "Lưu thay đổi" : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
