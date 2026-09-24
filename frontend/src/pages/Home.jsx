import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { propertyApi, forumApi } from "../api/apiClient";

const fallbackImage =
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900";
const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const roomImage = (room) =>
  room.images?.[0] || room.thumbnailUrl || fallbackImage;

const RoomCard = ({ room }) => (
  <Link to={`/rooms/${room.id}`} className="room-card">
    <div className="room-photo">
      <img
        src={roomImage(room)}
        alt={room.propertyTitle || `Phòng ${room.roomNumber}`}
      />
      <span className="verified">Đã xác thực</span>
      <span className="price-tag">{formatVnd(room.price)}</span>
    </div>
    <div className="room-body">
      <div className="room-address">
        {room.address || `${room.district || ""}, ${room.city || ""}`}
      </div>
      <div className="room-title">
        {room.propertyTitle || `Phòng ${room.roomNumber || ""}`}
      </div>
      <div className="room-meta">
        <span>{room.area || "--"}m²</span>
        <span>
          {room.status === "ROOMMATE_OPEN" ? "🔥 Còn chỗ ở ghép" : room.status === "FULL" ? "🔒 Đã có người thuê" : "🟢 Còn trống"}
        </span>
      </div>
    </div>
  </Link>
);

const Home = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    forumApi
      .getAllPosts({ page: 0, size: 6, sort: "createdAt,desc" })
      .then((res) => {
        const list = res.data?.content || res.data || [];
        if (list.length > 0) {
          const mapped = list.map((p) => ({
            id: p.id,
            propertyTitle: p.title,
            roomNumber: p.roomType || "Phòng trọ",
            price: p.price,
            address: `${p.district ? p.district + ", " : ""}${p.city || p.address || ""}`,
            area: p.roomArea,
            status: p.isRented ? "FULL" : (p.roommateNeeded ? "ROOMMATE_OPEN" : "AVAILABLE"),
            thumbnailUrl: p.imageUrls?.[0] || fallbackImage,
            images: p.imageUrls || [],
          }));
          setRooms(mapped);
        } else {
          // Fallback
          propertyApi.searchRooms({ page: 0, size: 3 })
            .then((r) => setRooms(r.data?.content || r.data || []))
            .catch(() => setRooms([]));
        }
      })
      .catch(() => {
        propertyApi.searchRooms({ page: 0, size: 3 })
          .then((r) => setRooms(r.data?.content || r.data || []))
          .catch(() => setRooms([]));
      });
  }, []);

  const goSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (maxPrice) params.set("maxPrice", maxPrice);
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div className="page-shell">
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>Thuê phòng trọ đúng giá, đúng người thật.</h1>
            <p className="hero-sub">
              Mọi chủ trọ trên hệ thống đều được xác thực danh tính, mọi yêu cầu
              thuê đều có hợp đồng số đi kèm.
            </p>
            <form className="search-box" onSubmit={goSearch}>
              <div className="search-field">
                <label>Khu vực</label>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ví dụ: Bình Thạnh"
                />
              </div>
              <div className="search-field">
                <label>Khoảng giá</label>
                <select
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                >
                  <option value="">Tất cả mức giá</option>
                  <option value="2000000">Dưới 2 triệu</option>
                  <option value="4000000">Dưới 4 triệu</option>
                  <option value="7000000">Dưới 7 triệu</option>
                </select>
              </div>
              <div className="search-field">
                <label>Loại phòng</label>
                <span className="muted">Tất cả loại phòng</span>
              </div>
              <button className="btn btn-accent" type="submit">
                Tìm phòng
              </button>
            </form>
            <div className="stat-row">
              <div className="stat">
                <b>{rooms.length || "--"}</b>
                <span>phòng mới hiển thị</span>
              </div>
              <div className="stat">
                <b>100%</b>
                <span>chủ trọ xác thực</span>
              </div>
              <div className="stat">
                <b>0đ</b>
                <span>phí người thuê</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-room-card">
              <div className="hero-room-photo">
                <img src={roomImage(rooms[0] || {})} alt="Phòng trọ nổi bật" />
                <span className="verified">Chủ trọ đã xác thực</span>
              </div>
              <span className="hero-room-price">
                {formatVnd(rooms[0]?.price || 2800000)}/tháng
              </span>
              <div className="hero-room-body">
                <div className="room-address">
                  {rooms[0]?.address || "Khu trọ đã xác thực trên Roomily"}
                </div>
                <div className="room-title">
                  {rooms[0]?.propertyTitle ||
                    "Phòng trọ sáng thoáng, đầy đủ tiện ích"}
                </div>
                <div className="tag-list">
                  <span className="tag">Wifi</span>
                  <span className="tag">Chỗ để xe</span>
                  <span className="tag">An ninh</span>
                </div>
              </div>
            </div>
            <div className="hero-note">
              <b>Đăng ký nhanh, miễn phí</b>
              <p>
                Ai cũng có thể đăng ký làm chủ trọ và bắt đầu quản lý phòng ngay.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="pills">
            <Link to="/rooms" className="pill active">
              Tất cả
            </Link>
            <Link to="/rooms?roomType=SINGLE" className="pill">
              Phòng đơn
            </Link>
            <Link to="/rooms?roomType=LOFT" className="pill">
              Phòng có gác
            </Link>
            <Link to="/rooms?roomType=MINI_APARTMENT" className="pill">
              Chung cư mini
            </Link>
            <Link to="/rooms?roommateOnly=true" className="pill">
              Còn chỗ ở ghép
            </Link>
          </div>
          <div className="section-head">
            <div>
              <h2>Phòng mới đăng trong tuần</h2>
              <p>Cập nhật trực tiếp từ chủ trọ đã xác thực</p>
            </div>
            <Link to="/rooms" className="section-link">
              Xem tất cả phòng
            </Link>
          </div>
          <div className="room-grid">
            {rooms.length ? (
              rooms.map((room) => <RoomCard key={room.id} room={room} />)
            ) : (
              <div className="empty-state">
                <b>Chưa có dữ liệu phòng</b>Hãy thử tìm kiếm để tải danh sách
                phòng mới nhất.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="roommate-band">
            <div>
              <h2>Đang thuê một mình? Tìm người ở ghép để chia tiền phòng.</h2>
              <p>
                Chủ trọ vẫn là người duyệt cuối cùng, nên bạn có thể kết nối
                minh bạch với người ở cùng.
              </p>
              <Link to="/roommates" className="btn btn-accent">
                Tìm bạn ở ghép
              </Link>
            </div>
            <div className="split-box">
              <div className="split-row">
                <span>Tiền phòng / tháng</span>
                <b>3.200.000đ</b>
              </div>
              <div className="split-row">
                <span>Điện, nước, wifi</span>
                <b>~500.000đ</b>
              </div>
              <div className="split-row">
                <span>Chia cho 2 người</span>
                <b>÷ 2</b>
              </div>
              <div className="split-row total">
                <span>Mỗi người chỉ còn</span>
                <b>1.850.000đ/tháng</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="roommate-band" style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "#fff" }}>
            <div>
              <span className="badge" style={{ background: "#2563eb", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                TÍNH NĂNG MỚI
              </span>
              <h2 style={{ marginTop: 12, color: "#fff" }}>Diễn Đàn Cho Thuê Trọ (Facebook Feed)</h2>
              <p style={{ color: "#94a3b8" }}>
                Chủ trọ có thể tự do đăng bài kèm hình ảnh thực tế, địa chỉ, giá cả. Người thuê có thể xem trực tiếp và gửi tin nhắn liên hệ chủ trọ ngay lập tức!
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <Link to="/forum" className="btn btn-primary" style={{ background: "#2563eb" }}>
                  Khám phá diễn đàn
                </Link>
                <Link to="/forum/create" className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                  Đăng bài cho thuê ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Thuê phòng chỉ qua 3 bước</h2>
            </div>
          </div>
          <div className="process">
            <div className="process-step">
              <div className="num">Bước 1</div>
              <h3>Tìm và xem chi tiết phòng</h3>
              <p>
                Lọc theo khu vực, giá, diện tích và tiện ích với thông tin chủ
                trọ rõ ràng.
              </p>
            </div>
            <div className="process-step">
              <div className="num">Bước 2</div>
              <h3>Gửi yêu cầu thuê</h3>
              <p>
                Gửi lời nhắn trực tiếp và theo dõi trạng thái duyệt trong tài
                khoản.
              </p>
            </div>
            <div className="process-step">
              <div className="num">Bước 3</div>
              <h3>Nhận hợp đồng và dọn vào</h3>
              <p>Hợp đồng số và hóa đơn hàng tháng được quản lý minh bạch.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="trust-grid">
            <div className="trust-item">
              <b>100%</b>
              <span>chủ trọ xác thực danh tính</span>
            </div>
            <div className="trust-item">
              <b>0đ</b>
              <span>phí cho người thuê phòng</span>
            </div>
            <div className="trust-item">
              <b>24h</b>
              <span>thời gian duyệt yêu cầu trung bình</span>
            </div>
            <div className="trust-item">
              <b>60+</b>
              <span>quận / khu vực đang hoạt động</span>
            </div>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="wrap footer-line">
          <span>© 2026 Roomily. Nền tảng kết nối chủ trọ và người thuê.</span>
          <span>Tìm phòng · Đăng tin · Hướng dẫn · Liên hệ</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
