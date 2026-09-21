import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyApi, rentalApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Maximize2, Users, CheckCircle2, ShieldCheck,
  ArrowLeft, Send, Sparkles, ChevronLeft, ChevronRight, Home
} from 'lucide-react';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [images, setImages] = useState(fallbackImages);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("info");
  const [roommatePost, setRoommatePost] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await propertyApi.getRoomDetail(id);
        setRoom(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const submitRequest = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      if (modalType === "rental")
        await rentalApi.createRentalRequest({
          roomId: Number(id),
          note: message,
        });
      else
        await rentalApi.sendJoinRequest(roommatePost?.id || Number(id), {
          introduction: message,
        });
      setResult({
        type: "success",
        text:
          modalType === "rental"
            ? "Đã gửi yêu cầu thuê. Bạn sẽ nhận thông báo khi chủ trọ duyệt."
            : "Đã gửi yêu cầu ở ghép, chờ người thuê hiện tại và chủ trọ duyệt.",
      });
      setModalType(null);
      setMessage("");
    } catch (error) {
      const isConflict =
        error?.status === 409 || error?.response?.status === 409;
      setResult({
        type: "error",
        text:
          modalType === "join" && isConflict
            ? "Rất tiếc, phòng vừa đủ người. Vui lòng tìm phòng khác."
            : error?.message || "Không thể gửi yêu cầu lúc này.",
      });
      setModalType(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (room === null)
    return (
      <div className="wrap page-shell">
        <div className="empty-state">Đang tải thông tin phòng...</div>
      </div>
    );
  if (room === undefined)
    return (
      <div className="wrap page-shell">
        <div className="empty-state">
          <b>Không tìm thấy phòng</b>
          <Link to="/rooms" className="btn btn-primary">
            Quay lại tìm phòng
          </Link>
        </div>
      </div>
    );
  }

  const images = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000',
  ];

  const utilitiesList = room.utilities
    ? room.utilities.split(',')
    : ['Wifi tốc độ cao', 'Điều hòa', 'Bình nóng lạnh', 'Bãi giữ xe máy', 'Camera an ninh 24/7', 'Giờ giấc tự do'];

  const prevImage = () => setActiveImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextImage = () => setActiveImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="container" style={{ maxWidth: '1050px', padding: '1.5rem 1rem' }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem' }}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* Gallery Section */}
      <div style={{ display: 'grid', gridTemplateColumns: images.length > 1 ? '2fr 1fr' : '1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', height: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)', background: '#111' }}>
          <img
            src={images[activeImg]}
            alt="Room Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {images.slice(0, 3).map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImg(idx)}
                style={{
                  height: '124px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: activeImg === idx ? '3px solid var(--primary)' : '1px solid var(--border)',
                  opacity: activeImg === idx ? 1 : 0.75,
                  transition: 'all 0.2s ease',
                }}
              >
                <img src={img} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="wrap detail-layout">
        <main>
          <div className="gallery">
            <div className="gallery-main">
              <img
                src={images[activeImage]}
                alt={room.propertyTitle || "Chi tiết phòng"}
              />
              <span className="verified">Chủ trọ đã xác thực</span>
            </div>
            <div className="gallery-thumbs">
              {images.slice(0, 5).map((image, index) => (
                <button
                  className={index === activeImage ? "active" : ""}
                  key={image}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={image} alt={`Ảnh phòng ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="title-block">
            <div>
              <h1>
                Phòng {room.roomNumber || ""}{" "}
                {room.propertyTitle || "Phòng trọ"}
              </h1>
              <div className="room-address">
                {room.address || `${room.district || ""}, ${room.city || ""}`}
              </div>
            </div>
            <div className="price-block">
              <b>{formatVnd(room.price)}</b>
              <span>/tháng</span>
            </div>
          </div>
          <div className="meta-strip">
            <div>
              <b>{room.area || "--"}m²</b>
              <span>Diện tích</span>
            </div>
            <div>
              <b>
                {room.currentOccupants || 0}/{room.capacity || "--"}
              </b>
              <span>Đang ở / sức chứa</span>
            </div>
            <div>
              <b>{statusLabel[room.status] || room.status}</b>
              <span>Trạng thái</span>
            </div>
          </div>
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Thông tin phòng
            </button>
            {hasRoommate && (
              <button
                className={`tab-btn ${activeTab === "roommate" ? "active" : ""}`}
                onClick={() => setActiveTab("roommate")}
              >
                Ở ghép
              </button>
            )}
          </div>
          {activeTab === "info" ? (
            <div>
              <div className="section-title">Mô tả</div>
              <p className="desc">
                {room.description ||
                  "Phòng trọ được cập nhật từ chủ trọ đã xác thực, có thông tin rõ ràng và hỗ trợ hợp đồng số khi được duyệt."}
              </p>
              <div className="section-title">Tiện ích đi kèm</div>
              <div className="amenity-grid">
                {utilities.map((utility) => (
                  <div className="amenity-item" key={utility}>
                    {utility.trim()}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="section-title">Đang tìm người ở ghép</div>
              <div className="roommate-band">
                <div>
                  <h2>Chia sẻ chi phí minh bạch</h2>
                  <p>
                    Yêu cầu của bạn sẽ được gửi tới người thuê hiện tại và chủ
                    trọ để cùng duyệt.
                  </p>
                </div>
                <div className="split-box">
                  <div className="split-row">
                    <span>Tiền phòng / tháng</span>
                    <b>{formatVnd(room.price)}</b>
                  </div>
                  <div className="split-row">
                    <span>Chia cho</span>
                    <b>{room.capacity || 2} người</b>
                  </div>
                  <div className="split-row total">
                    <span>Ước tính mỗi người</span>
                    <b>
                      {formatVnd(
                        (Number(room.price || 0) + 450000) /
                          (room.capacity || 2),
                      )}
                    </b>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--success)" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success)' }}>Chủ trọ đã xác thực VNPay</span>
              </div>
            </div>
            <button
              className="btn-block btn-primary"
              disabled={rentalDisabled || room.status === "FULL"}
              onClick={() => setModalType("rental")}
            >
              {room.status === "FULL"
                ? "Phòng đã đủ người"
                : rentalDisabled
                  ? "Đã gửi yêu cầu - chờ duyệt"
                  : "Gửi yêu cầu thuê"}
            </button>
            {hasRoommate && (
              <button
                className="btn-block btn-accent"
                disabled={Boolean(
                  result?.type === "success" && result.text.includes("ở ghép"),
                )}
                onClick={() => setModalType("join")}
              >
                {result?.type === "success" && result.text.includes("ở ghép")
                  ? "Đã gửi yêu cầu"
                  : "Xin tham gia ở ghép"}
              </button>
            )}
            {result && (
              <div className={`result-banner ${result.type}`}>
                {result.text}
              </div>
            )}
            <div className="trust-line">
              Miễn phí cho người thuê · Hợp đồng số tự động khi được duyệt
            </div>
          </div>
        </aside>
      </div>
      {modalType && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {modalType === "rental"
                ? "Gửi yêu cầu thuê"
                : "Xin tham gia ở ghép"}
            </h3>
            <p className="modal-sub">
              {modalType === "rental"
                ? "Lời nhắn sẽ được gửi kèm tới chủ trọ."
                : "Lời nhắn sẽ gửi tới người đang thuê và chủ trọ để duyệt."}
            </p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Giới thiệu ngắn hoặc thời gian dự kiến chuyển vào..."
            />
            <div className="modal-actions">
              <button
                className="btn"
                onClick={() => setModalType(null)}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={submitRequest}
                disabled={submitting}
              >
                {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetail;
