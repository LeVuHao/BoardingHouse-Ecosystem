import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  MapPin, Clock, Plus, ChevronLeft, ChevronRight, 
  MessageCircle, Eye, Sparkles, Users, Zap, CheckCircle2, 
  Calendar, FileText, X, Tag, Search, Filter, RotateCcw,
  Phone, Home, Check
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { forumApi, rentalApi } from "../api/apiClient";

const PAGE_SIZE = 6;

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

// Carousel ảnh bài đăng
const PostImageCarousel = ({ images }) => {
  const [idx, setIdx] = useState(0);
  const imgList = (images && Array.isArray(images) && images.length > 0) ? images : [];

  if (imgList.length === 0) {
    return (
      <div className="forum-card-photo forum-card-photo-empty" style={{ position: "relative", overflow: "hidden" }}>
        <img 
          src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600" 
          alt="Ảnh phòng trọ mặc định" 
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.92)" }}
        />
        <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.65)", color: "#fff", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
          Ảnh phòng mẫu
        </span>
      </div>
    );
  }
  return (
    <div className="forum-card-photo">
      <img src={imgList[idx]} alt="Ảnh phòng trọ" />
      {imgList.length > 1 && (
        <>
          <button
            className="forum-carousel-btn forum-carousel-prev"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIdx((i) => (i === 0 ? imgList.length - 1 : i - 1));
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="forum-carousel-btn forum-carousel-next"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIdx((i) => (i === imgList.length - 1 ? 0 : i + 1));
            }}
          >
            <ChevronRight size={18} />
          </button>
          <div className="forum-carousel-dots">
            {imgList.map((_, i) => (
              <span key={i} className={`forum-dot ${i === idx ? "active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Rooms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentRentedPost, setRecentRentedPost] = useState(null);

  // Bộ lọc
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") || "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") || "");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AVAILABLE | ROOMMATE | RENTED
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(0);

  // Modal Gửi Yêu Cầu Thuê
  const [rentalModalPost, setRentalModalPost] = useState(null);
  const [rentalForm, setRentalForm] = useState({ occupants: 1, moveInDate: "", note: "" });
  const [submittingRental, setSubmittingRental] = useState(false);

  // Modal Tìm Người Ở Ghép
  const [roommateModalPost, setRoommateModalPost] = useState(null);
  const [roommateForm, setRoommateForm] = useState({
    roommateNeeded: true,
    roommateCount: 1,
    gender: "ALL",
    expectedCost: "",
    roommateNote: "",
  });
  const [savingRoommate, setSavingRoommate] = useState(false);

  // Tải danh sách phòng từ diễn đàn trọ
  const fetchPosts = () => {
    setLoading(true);
    forumApi
      .getAllPosts({ page: 0, size: 100, sort: "createdAt,desc" })
      .then((res) => {
        const data = res.data?.content || res.data || [];
        setPosts(data);

        // Tìm bài vừa được thuê để làm banner nổi bật
        const rented = data.find((p) => p.isRented);
        if (rented) {
          setRecentRentedPost(rented);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải bài đăng phòng trọ:", err);
        toast.error("Không thể tải danh sách bài đăng phòng trọ");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Xử lý gửi yêu cầu thuê
  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi yêu cầu thuê phòng");
      navigate("/login");
      return;
    }

    setSubmittingRental(true);
    try {
      const formattedNote = `[YÊU CẦU THUÊ TRỌ #${rentalModalPost.id} - ${rentalModalPost.title}] | Số người: ${rentalForm.occupants} | Ngày dọn vào: ${rentalForm.moveInDate || "Sớm nhất"} | Lời nhắn: ${rentalForm.note || "Khách sẵn sàng ký hợp đồng"}`;

      await rentalApi.createRentalRequest({
        postId: rentalModalPost.id,
        roomId: rentalModalPost.roomId || null,
        senderName: user.fullName || "Khách thuê",
        senderPhone: user.phoneNumber || "",
        note: formattedNote,
      });

      try {
        await forumApi.sendMessage(rentalModalPost.id, {
          senderName: user.fullName || "Khách thuê",
          senderPhone: user.phoneNumber || "",
          content: `⚡ ${formattedNote}`,
        });
      } catch (msgErr) {
        console.warn("Message sending fallback:", msgErr);
      }

      toast.success("Đã gửi yêu cầu thuê phòng tới chủ trọ thành công! 🎉");
      setRentalModalPost(null);
      setRentalForm({ occupants: 1, moveInDate: "", note: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi yêu cầu thuê");
    } finally {
      setSubmittingRental(false);
    }
  };

  // Xử lý lưu nhu cầu ở ghép
  const handleRoommateSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }

    setSavingRoommate(true);
    try {
      const fullCriteria = `[Giới tính: ${roommateForm.gender === "MALE" ? "Nam" : roommateForm.gender === "FEMALE" ? "Nữ" : "Tất cả"}] ${roommateForm.expectedCost ? `• Chia: ${formatVnd(roommateForm.expectedCost)}/người` : ""} • ${roommateForm.roommateNote || "Tìm bạn cùng chia sẻ chi phí phòng"}`;

      await forumApi.updateRoommateStatus(roommateModalPost.id, {
        roommateNeeded: true,
        roommateCount: Number(roommateForm.roommateCount) || 1,
        roommateNote: fullCriteria,
      });

      toast.success("Đã đăng nhu cầu tìm người ở ghép thành công! 🔥");
      setRoommateModalPost(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật nhu cầu ở ghép");
    } finally {
      setSavingRoommate(false);
    }
  };

  // Lọc và sắp xếp phòng
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Lọc theo từ khóa / khu vực
    if (city.trim()) {
      const kw = city.trim().toLowerCase();
      result = result.filter((p) => {
        const fullAddr = `${p.title || ""} ${p.address || ""} ${p.ward || ""} ${p.district || ""} ${p.city || ""}`.toLowerCase();
        return fullAddr.includes(kw);
      });
    }

    // Lọc theo giá tối thiểu
    if (minPrice) {
      const minP = Number(minPrice);
      result = result.filter((p) => Number(p.price) >= minP);
    }

    // Lọc theo giá tối đa
    if (maxPrice) {
      const maxP = Number(maxPrice);
      result = result.filter((p) => Number(p.price) <= maxP);
    }

    // Lọc theo diện tích tối thiểu
    if (minArea) {
      const minA = Number(minArea);
      result = result.filter((p) => Number(p.roomArea || 0) >= minA);
    }

    // Lọc theo diện tích tối đa
    if (maxArea) {
      const maxA = Number(maxArea);
      result = result.filter((p) => Number(p.roomArea || 0) <= maxA);
    }

    // Lọc theo trạng thái
    if (statusFilter === "AVAILABLE") {
      result = result.filter((p) => !p.isRented);
    } else if (statusFilter === "ROOMMATE") {
      result = result.filter((p) => p.roommateNeeded);
    } else if (statusFilter === "RENTED") {
      result = result.filter((p) => p.isRented);
    }

    // Lọc theo tiện ích
    if (selectedAmenities.length > 0) {
      result = result.filter((p) => {
        const utilStr = (p.utilities || "").toLowerCase();
        return selectedAmenities.every((a) => utilStr.includes(a.toLowerCase()));
      });
    }

    // Sắp xếp
    if (sort === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "area-desc") {
      result.sort((a, b) => Number(b.roomArea || 0) - Number(a.roomArea || 0));
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [posts, city, minPrice, maxPrice, minArea, maxArea, statusFilter, selectedAmenities, sort]);

  // Phân trang
  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE) || 1;
  const currentItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, page]);

  // Reset trang khi đổi filter
  useEffect(() => {
    setPage(0);
  }, [city, minPrice, maxPrice, minArea, maxArea, statusFilter, selectedAmenities, sort]);

  const clearAllFilters = () => {
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setStatusFilter("ALL");
    setSelectedAmenities([]);
    setSort("newest");
    setPage(0);
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  return (
    <div className="page-shell">
      {/* 1. TOP SEARCH BAR (Dải tìm kiếm nhanh trên cùng) */}
      <section className="search-strip" style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "18px 0" }}>
        <div className="wrap">
          <form
            className="search-box"
            style={{ margin: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
            }}
          >
            <div className="search-field" style={{ flex: 1.5 }}>
              <label>Khu vực, địa chỉ, quận huyện</label>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="VD: Bình Thạnh, Dĩ An, Thủ Đức, TP.HCM..."
                />
              </div>
            </div>

            <div className="search-field" style={{ flex: 1 }}>
              <label>Khoảng giá</label>
              <select
                value={
                  !minPrice && !maxPrice
                    ? ""
                    : maxPrice === "2000000"
                    ? "u2"
                    : minPrice === "2000000" && maxPrice === "4000000"
                    ? "2-4"
                    : minPrice === "4000000" && maxPrice === "7000000"
                    ? "4-7"
                    : minPrice === "7000000"
                    ? "o7"
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "u2") {
                    setMinPrice("");
                    setMaxPrice("2000000");
                  } else if (val === "2-4") {
                    setMinPrice("2000000");
                    setMaxPrice("4000000");
                  } else if (val === "4-7") {
                    setMinPrice("4000000");
                    setMaxPrice("7000000");
                  } else if (val === "o7") {
                    setMinPrice("7000000");
                    setMaxPrice("");
                  } else {
                    setMinPrice("");
                    setMaxPrice("");
                  }
                }}
              >
                <option value="">Tất cả mức giá</option>
                <option value="u2">Dưới 2 triệu</option>
                <option value="2-4">2 - 4 triệu</option>
                <option value="4-7">4 - 7 triệu</option>
                <option value="o7">Trên 7 triệu</option>
              </select>
            </div>

            <div className="search-field" style={{ flex: 1 }}>
              <label>Diện tích</label>
              <select
                value={
                  !minArea && !maxArea
                    ? ""
                    : maxArea === "20"
                    ? "u20"
                    : minArea === "20" && maxArea === "30"
                    ? "20-30"
                    : minArea === "30"
                    ? "o30"
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "u20") {
                    setMinArea("");
                    setMaxArea("20");
                  } else if (val === "20-30") {
                    setMinArea("20");
                    setMaxArea("30");
                  } else if (val === "o30") {
                    setMinArea("30");
                    setMaxArea("");
                  } else {
                    setMinArea("");
                    setMaxArea("");
                  }
                }}
              >
                <option value="">Tất cả diện tích</option>
                <option value="u20">Dưới 20 m²</option>
                <option value="20-30">20 - 30 m²</option>
                <option value="o30">Trên 30 m²</option>
              </select>
            </div>

            <button className="btn btn-accent" type="submit" style={{ padding: "0 28px", fontWeight: "bold" }}>
              <Search size={16} style={{ marginRight: 6 }} /> Tìm phòng
            </button>
          </form>
        </div>
      </section>

      {/* 2. MAIN LAYOUT: SIDEBAR BỘ LỌC + DANH SÁCH BÀI ĐĂNG PHÒNG TRỌ */}
      <div className="wrap results-wrap">
        {/* SIDEBAR BỘ LỌC BÊN TRÁI */}
        <aside className="filters">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={18} color="var(--primary)" /> Bộ Lọc Phòng
            </h3>
            <button onClick={clearAllFilters} className="btn-clear" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <RotateCcw size={12} /> Xóa lọc
            </button>
          </div>

          {/* Trạng thái / Nhu cầu */}
          <div className="filter-group">
            <h4>Trạng thái & Nhu cầu</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "ALL", label: "Tất cả phòng" },
                { key: "AVAILABLE", label: "🟢 Còn phòng trống" },
                { key: "ROOMMATE", label: "🔥 Đang tìm ở ghép" },
                { key: "RENTED", label: "🔒 Đã có người thuê" },
              ].map((st) => (
                <label key={st.key} className="check-row" style={{ cursor: "pointer", margin: 0 }}>
                  <input
                    type="radio"
                    name="statusFilter"
                    checked={statusFilter === st.key}
                    onChange={() => setStatusFilter(st.key)}
                  />
                  <span>{st.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Khoảng giá (Từ - Đến) */}
          <div className="filter-group">
            <h4>Khoảng giá (VNĐ)</h4>
            <div className="price-range">
              <input
                type="number"
                placeholder="Từ (VNĐ)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Đến (VNĐ)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Diện tích */}
          <div className="filter-group">
            <h4>Diện tích phòng</h4>
            <div className="area-pills">
              {[
                { label: "<20m²", min: "", max: "20" },
                { label: "20-30m²", min: "20", max: "30" },
                { label: "30-50m²", min: "30", max: "50" },
                { label: ">50m²", min: "50", max: "" },
              ].map((pill) => {
                const isActive = minArea === pill.min && maxArea === pill.max;
                return (
                  <button
                    key={pill.label}
                    type="button"
                    className={`area-pill ${isActive ? "active" : ""}`}
                    onClick={() => {
                      if (isActive) {
                        setMinArea("");
                        setMaxArea("");
                      } else {
                        setMinArea(pill.min);
                        setMaxArea(pill.max);
                      }
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tiện ích */}
          <div className="filter-group">
            <h4>Tiện ích phòng</h4>
            {["Wifi", "Máy giặt", "Chỗ để xe", "Camera an ninh", "Máy lạnh", "Gác lửng"].map((amenity) => (
              <label key={amenity} className="check-row" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>

          {/* Đăng tin trọ dành cho chủ trọ */}
          {user?.role === "LANDLORD" && (
            <div style={{ marginTop: 20 }}>
              <Link
                to="/forum/create"
                className="btn btn-primary btn-block"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700 }}
              >
                <Plus size={16} /> + Đăng Tin Cho Thuê
              </Link>
            </div>
          )}
        </aside>

        {/* NỘI DUNG CHÍNH BÊN PHẢI (DANH SÁCH BÀI ĐĂNG PHÒNG TRỌ) */}
        <main>
          {/* Header kết quả tìm kiếm */}
          <div className="results-head" style={{ marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                {filteredPosts.length} phòng trọ đang cho thuê
              </h1>
              <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: 13.5 }}>
                Đăng tin trực tiếp từ chủ trọ, duyệt hợp đồng số và trao đổi ngay trên Roomily
              </p>
            </div>

            <div className="sort">
              <span>Sắp xếp:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá thấp đến cao</option>
                <option value="price-desc">Giá cao đến thấp</option>
                <option value="area-desc">Diện tích lớn nhất</option>
              </select>
            </div>
          </div>

          {/* Flash Announcement: Nếu có phòng vừa được duyệt */}
          {recentRentedPost && (
            <div className="rented-alert-banner" style={{ marginBottom: 20 }}>
              <div className="rented-pulse-indicator">
                <span className="rented-dot-pulse"></span>
                <strong>
                  ⚡ TIN MỚI: "{recentRentedPost.title}" vừa được chủ trọ duyệt thành công!
                </strong>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                Khách thuê vẫn có thể nhắn tin hỏi thêm các phòng trống lân cận cùng khu vực!
              </p>
            </div>
          )}

          {/* Danh sách phòng */}
          {loading ? (
            <div className="empty-state" style={{ padding: "60px 0" }}>
              <div className="spinner" style={{ margin: "0 auto 16px" }} />
              <b>Đang tải danh sách phòng trọ...</b>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="empty-state" style={{ background: "white", borderRadius: 16, padding: "60px 20px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Không tìm thấy phòng phù hợp</h3>
              <p style={{ color: "var(--text-muted)", margin: "8px 0 16px 0", fontSize: 14 }}>
                Thử nới rộng khoảng giá, đổi khu vực tìm kiếm hoặc bấm xóa bộ lọc.
              </p>
              <button onClick={clearAllFilters} className="btn btn-outline">
                <RotateCcw size={14} style={{ marginRight: 6 }} /> Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="forum-posts-list" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {currentItems.map((post) => (
                <div key={post.id} className="forum-card">
                  {/* Photo Carousel */}
                  <PostImageCarousel images={post.images || post.imageUrls} />

                  {/* Body Content */}
                  <div className="forum-card-body">
                    {/* Header: Author & Badges */}
                    <div className="forum-card-header">
                      <div className="forum-card-author">
                        <div className="avatar forum-author-avatar">
                          {(post.landlordName || "C")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="forum-author-name">
                            {post.landlordName || "Chủ trọ"}
                            <span className="badge-verified">✓ Chính chủ</span>
                          </div>
                          <div className="forum-post-time">
                            <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                            {timeAgo(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Badges: ĐÃ THUÊ / Ở GHÉP */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {post.isRented && (
                          <span className="rented-badge-flashing">
                            ⚡ ĐÃ CÓ NGƯỜI THUÊ
                          </span>
                        )}
                        {post.roommateNeeded && (
                          <span className="roommate-badge-flashing">
                            🔥 TÌM {post.roommateCount || 1} BẠN Ở GHÉP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Room Title */}
                    <Link to={`/rooms/${post.id}`} className="forum-card-title">
                      {post.title}
                    </Link>

                    {/* Specs: Price, Area, Type */}
                    <div className="forum-card-specs">
                      <div className="forum-card-price">
                        {formatVnd(post.price)}
                        <span className="forum-price-unit">/tháng</span>
                      </div>
                      {post.roomArea && (
                        <div className="forum-spec-item">
                          📐 {post.roomArea} m²
                        </div>
                      )}
                      {post.roomType && (
                        <div className="forum-spec-item">
                          🏠 {post.roomType}
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="forum-card-address">
                      <MapPin size={14} style={{ color: "var(--brand-primary, #2563eb)", flexShrink: 0, marginTop: 2 }} />
                      <span>{post.address}, {post.ward}, {post.district}, {post.city}</span>
                    </div>

                    {/* Description preview */}
                    {post.description && (
                      <p className="forum-card-desc">
                        {post.description.length > 150
                          ? post.description.substring(0, 150) + "..."
                          : post.description}
                      </p>
                    )}

                    {/* Utilities tags */}
                    {post.utilities && (
                      <div className="forum-card-utilities">
                        {post.utilities.split(",").slice(0, 4).map((u, idx) => (
                          <span key={idx} className="utility-tag">
                            ✓ {u.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Roommate Note Highlight (nếu có) */}
                    {post.roommateNeeded && post.roommateNote && (
                      <div style={{ background: "#fff7ed", border: "1px dashed #fdba74", padding: "8px 12px", borderRadius: 8, margin: "10px 0", fontSize: "0.85rem", color: "#c2410c" }}>
                        <strong>🤝 Tiêu chí ở ghép:</strong> {post.roommateNote}
                      </div>
                    )}

                    {/* Contact Phone & Actions */}
                    <div className="forum-card-footer" style={{ marginTop: 12 }}>
                      {post.contactPhone && (
                        <a href={`tel:${post.contactPhone}`} className="forum-contact-phone">
                          <Phone size={14} />
                          {post.contactPhone}
                        </a>
                      )}

                      <div className="forum-card-actions">
                        {/* 1. Gửi yêu cầu thuê */}
                        <button
                          onClick={() => {
                            setRentalModalPost(post);
                            setRentalForm({ occupants: 1, moveInDate: "", note: "" });
                          }}
                          className="btn btn-primary forum-action-btn"
                          style={{ fontWeight: 700 }}
                        >
                          <Zap size={15} />
                          ⚡ Yêu cầu thuê
                        </button>

                        {/* 2. Tìm bạn ở ghép */}
                        <button
                          onClick={() => {
                            setRoommateModalPost(post);
                            setRoommateForm({
                              roommateNeeded: true,
                              roommateCount: post.roommateCount || 1,
                              gender: "ALL",
                              expectedCost: "",
                              roommateNote: post.roommateNote || "",
                            });
                          }}
                          className="btn btn-accent forum-action-btn"
                          style={{ fontWeight: 700 }}
                        >
                          <Users size={15} />
                          👥 Tìm bạn ở ghép
                        </button>

                        {/* 3. Xem chi tiết */}
                        <Link to={`/rooms/${post.id}`} className="btn forum-action-btn">
                          <Eye size={15} />
                          Xem chi tiết
                        </Link>

                        {/* 4. Nhắn tin */}
                        <Link to={`/rooms/${post.id}`} className="btn btn-outline forum-action-btn">
                          <MessageCircle size={15} />
                          Nhắn tin
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 32 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Trang trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={i === page ? "active" : ""}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Trang sau
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODAL GỬI YÊU CẦU THUÊ PHÒNG */}
      {rentalModalPost && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                ⚡ Yêu cầu thuê trọ #{rentalModalPost.id}
              </h3>
              <button
                onClick={() => setRentalModalPost(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{rentalModalPost.title}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                Chủ trọ: <strong>{rentalModalPost.landlordName}</strong> • Giá: <strong style={{ color: "#2563eb" }}>{formatVnd(rentalModalPost.price)}/tháng</strong>
              </div>
            </div>

            <form onSubmit={handleRentalSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Số người ở dự kiến
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rentalForm.occupants}
                    onChange={(e) => setRentalForm({ ...rentalForm, occupants: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Ngày dự kiến dọn vào
                  </label>
                  <input
                    type="date"
                    value={rentalForm.moveInDate}
                    onChange={(e) => setRentalForm({ ...rentalForm, moveInDate: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Lời nhắn gửi chủ trọ
                </label>
                <textarea
                  rows="3"
                  placeholder="Ví dụ: Em là sinh viên/người đi làm, muốn xem phòng vào cuối tuần..."
                  value={rentalForm.note}
                  onChange={(e) => setRentalForm({ ...rentalForm, note: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRentalModalPost(null)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingRental}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  {submittingRental ? "Đang gửi..." : "Gửi yêu cầu thuê phòng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHU CẦU Ở GHÉP */}
      {roommateModalPost && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                👥 Đăng nhu cầu tìm người ở ghép
              </h3>
              <button
                onClick={() => setRoommateModalPost(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#fff7ed", border: "1px dashed #fdba74", padding: "10px 14px", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#c2410c" }}>{roommateModalPost.title}</div>
              <div style={{ fontSize: "0.82rem", color: "#9a3412", marginTop: 2 }}>
                Giá phòng gốc: <strong>{formatVnd(roommateModalPost.price)}/tháng</strong>
              </div>
            </div>

            <form onSubmit={handleRoommateSubmit}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Cần tìm số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={roommateForm.roommateCount}
                    onChange={(e) => setRoommateForm({ ...roommateForm, roommateCount: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                    Yêu cầu giới tính
                  </label>
                  <select
                    value={roommateForm.gender}
                    onChange={(e) => setRoommateForm({ ...roommateForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                  >
                    <option value="ALL">Nam hoặc Nữ</option>
                    <option value="MALE">Chỉ Nam</option>
                    <option value="FEMALE">Chỉ Nữ</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Chi phí dự kiến mỗi bạn chia nhau (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 1500000"
                  value={roommateForm.expectedCost}
                  onChange={(e) => setRoommateForm({ ...roommateForm, expectedCost: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                  Tiêu chí & Lưu ý khi ở ghép
                </label>
                <textarea
                  rows="3"
                  placeholder="Ví dụ: Sạch sẽ, không hút thuốc, sinh viên Bách Khoa/PTIT, giờ giấc tự do..."
                  value={roommateForm.roommateNote}
                  onChange={(e) => setRoommateForm({ ...roommateForm, roommateNote: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRoommateModalPost(null)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingRoommate}
                  className="btn btn-accent"
                  style={{ fontWeight: 700 }}
                >
                  {savingRoommate ? "Đang lưu..." : "Bật tìm bạn ở ghép ngay 🔥"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
