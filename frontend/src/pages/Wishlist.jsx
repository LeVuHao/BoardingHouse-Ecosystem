import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getWishlist, toggleWishlist } from "../utils/wishlist";
import { Heart, MapPin, Maximize2, Users, Eye, Trash2 } from "lucide-react";

const Wishlist = () => {
  const [savedRooms, setSavedRooms] = useState([]);

  useEffect(() => {
    setSavedRooms(getWishlist());
  }, []);

  const handleRemove = (post) => {
    const newList = toggleWishlist(post);
    setSavedRooms(newList);
  };

  return (
    <div className="page-shell" style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 20px" }}>
      <div className="wrap" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <Heart size={28} color="#e11d48" fill="#e11d48" />
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--ink)", fontWeight: "800" }}>
            Phòng đã lưu ({savedRooms.length})
          </h1>
        </div>

        {savedRooms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
            <Heart size={64} color="#cbd5e1" style={{ marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", margin: "0 0 8px 0" }}>Bạn chưa lưu phòng nào</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
              Hãy bấm vào nút thả tim ở các bài đăng để lưu lại những phòng bạn ưng ý nhé.
            </p>
            <Link to="/rooms" className="btn btn-primary" style={{ padding: "10px 24px", borderRadius: "30px", fontWeight: "600" }}>
              Khám phá phòng ngay
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {savedRooms.map((room) => (
              <div key={room.id} style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", height: "200px" }}>
                  <img 
                    src={room.images?.[0] || room.imageUrls?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600"} 
                    alt={room.title} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                  <button 
                    onClick={() => handleRemove(room)}
                    style={{ position: "absolute", top: "12px", right: "12px", width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                    title="Bỏ lưu"
                  >
                    <Trash2 size={18} color="#e11d48" />
                  </button>
                  {room.isRented && (
                    <span style={{ position: "absolute", bottom: "12px", left: "12px", background: "#ef4444", color: "white", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                      ĐÃ CHO THUÊ
                    </span>
                  )}
                </div>

                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: "16px", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                    <Link to={`/rooms/${room.id}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                      {room.title}
                    </Link>
                  </h3>
                  
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary)", marginBottom: "12px" }}>
                    {Number(room.price).toLocaleString("vi-VN")} đ<span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-muted)" }}>/tháng</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={14} /> {room.district}, {room.city}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Maximize2 size={14} /> {room.roomArea || "N/A"} m²</span>
                  </div>

                  <Link to={`/rooms/${room.id}`} className="btn btn-outline" style={{ marginTop: "auto", width: "100%", padding: "8px", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Eye size={16} /> Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
