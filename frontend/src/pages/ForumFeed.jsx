import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forumApi } from "../api/apiClient";
import { MessageCircle, Clock, MapPin, Users, Heart, Share2, Sparkles, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import WishlistButton from "../components/WishlistButton";
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

const ForumFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, ROOMMATE, AVAILABLE

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await forumApi.getAllPosts({ page: 0, size: 50, sort: "createdAt,desc" });
      const data = res.data?.content || res.data || [];
      setPosts(data);
    } catch (err) {
      toast.error("Không thể tải bảng tin diễn đàn");
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === "ROOMMATE") return post.roommateNeeded;
    if (filter === "AVAILABLE") return !post.isRented;
    return true;
  });

  return (
    <div className="page-shell" style={{ background: "#f8fafc", minHeight: "100vh", paddingTop: "24px" }}>
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "280px 1fr 300px", gap: "24px", maxWidth: "1200px" }}>
        
        {/* Sidebar Left: Menu */}
        <div style={{ position: "sticky", top: "80px", height: "fit-content" }}>
          <div style={{ background: "white", padding: "16px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="var(--primary)" /> Diễn Đàn Trọ
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <button 
                  onClick={() => setFilter("ALL")} 
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: "8px", background: filter === "ALL" ? "var(--primary-light)" : "transparent", color: filter === "ALL" ? "var(--primary)" : "var(--ink)", fontWeight: filter === "ALL" ? "600" : "500", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <MessageCircle size={18} /> Tất cả bài đăng
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setFilter("AVAILABLE")} 
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: "8px", background: filter === "AVAILABLE" ? "var(--primary-light)" : "transparent", color: filter === "AVAILABLE" ? "var(--primary)" : "var(--ink)", fontWeight: filter === "AVAILABLE" ? "600" : "500", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <MapPin size={18} /> Phòng trống mới
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setFilter("ROOMMATE")} 
                  style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: "8px", background: filter === "ROOMMATE" ? "#fff7ed" : "transparent", color: filter === "ROOMMATE" ? "#ea580c" : "var(--ink)", fontWeight: filter === "ROOMMATE" ? "600" : "500", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <Users size={18} /> Tìm bạn ở ghép
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Center: Feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "60px" }}>
          {/* Create Post Box */}
          {user?.role === "LANDLORD" && (
             <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "var(--shadow-sm)", display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {(user?.fullName || "L")[0].toUpperCase()}
                </div>
                <button 
                  onClick={() => navigate("/forum/create")}
                  style={{ flex: 1, textAlign: "left", padding: "12px 20px", borderRadius: "30px", background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", fontSize: "15px" }}
                >
                  Bạn đang có phòng trống cần cho thuê?
                </button>
             </div>
          )}

          {/* Posts List */}
          {loading ? (
             <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
               {[1, 2, 3].map(i => (
                 <div key={i} className="skeleton-shimmer" style={{ height: "300px", borderRadius: "16px" }}></div>
               ))}
             </div>
          ) : filteredPosts.length === 0 ? (
             <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "16px" }}>
               <MessageCircle size={48} color="#cbd5e1" style={{ marginBottom: "16px" }} />
               <h3 style={{ margin: 0, color: "var(--ink)" }}>Chưa có bài đăng nào</h3>
               <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>Hãy là người đầu tiên đăng bài trong mục này.</p>
             </div>
          ) : (
            <AnimatePresence>
              {filteredPosts.map(post => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="feed-post-card"
                  style={{ background: "white", borderRadius: "16px", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}
                >
                  {/* Header */}
                  <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold" }}>
                        {(post.landlordName || "C")[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--ink)" }}>
                          {post.landlordName || "Chủ trọ"}
                        </h4>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <Clock size={12} /> {timeAgo(post.createdAt)}
                        </div>
                      </div>
                    </div>
                    {post.roommateNeeded && (
                      <span style={{ background: "#ffedd5", color: "#c2410c", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={12} /> Tìm ở ghép
                      </span>
                    )}
                  </div>

                  {/* Body Text */}
                  <div style={{ padding: "0 20px 16px" }}>
                    <Link to={`/rooms/${post.id}`} style={{ textDecoration: "none" }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "var(--ink)", lineHeight: "1.4" }}>
                        {post.title}
                      </h3>
                    </Link>
                    <p style={{ margin: "0 0 12px 0", color: "#475569", fontSize: "15px", lineHeight: "1.5" }}>
                      {post.description && post.description.length > 200 ? post.description.substring(0, 200) + '...' : post.description}
                    </p>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "var(--primary)" }}>
                        💰 {Number(post.price).toLocaleString("vi-VN")} đ/tháng
                      </span>
                      <span style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", color: "#475569" }}>
                        📍 {post.district}, {post.city}
                      </span>
                    </div>
                  </div>

                  {/* Images */}
                  {(post.images || post.imageUrls) && (post.images || post.imageUrls).length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
                      {(post.images || post.imageUrls).slice(0, 2).map((img, idx) => (
                        <div key={idx} style={{ height: "200px", background: "#f1f5f9" }}>
                          <img src={img} alt="Room" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "24px" }}>
                    <WishlistButton post={post} />
                    <Link to={`/rooms/${post.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontWeight: "500", fontSize: "14px" }}>
                      <MessageCircle size={18} /> Bình luận / Nhắn tin
                    </Link>
                    <button style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>
                      <Share2 size={18} /> Chia sẻ
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Sidebar Right: Widget */}
        <div style={{ position: "sticky", top: "80px", height: "fit-content" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "var(--ink)" }}>Nổi bật hôm nay</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Fake popular items for visual completion */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                 <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: "#f1f5f9", overflow: "hidden" }}>
                    <img src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200" alt="Trending" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 </div>
                 <div>
                   <h5 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "600", color: "var(--ink)", lineHeight: "1.4" }}>Phòng trọ cao cấp Bình Thạnh</h5>
                   <p style={{ margin: 0, fontSize: "12px", color: "var(--primary)", fontWeight: "600" }}>3.500.000đ</p>
                 </div>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                 <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: "#f1f5f9", overflow: "hidden" }}>
                    <img src="https://images.unsplash.com/photo-1502672260266-1c1e525044c7?w=200" alt="Trending" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                 </div>
                 <div>
                   <h5 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "600", color: "var(--ink)", lineHeight: "1.4" }}>Chung cư mini Thủ Đức giá rẻ</h5>
                   <p style={{ margin: 0, fontSize: "12px", color: "var(--primary)", fontWeight: "600" }}>4.200.000đ</p>
                 </div>
              </div>
            </div>
            <button className="btn btn-outline" style={{ width: "100%", marginTop: "16px", padding: "8px", fontSize: "13px" }}>
              Xem thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumFeed;
