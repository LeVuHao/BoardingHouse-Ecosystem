import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyApi, rentalApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { MapPin, Maximize2, Users, CheckCircle2, ShieldCheck, ArrowLeft, Send, Sparkles } from 'lucide-react';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  // Modal Request
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [requestMsg, setRequestMsg] = useState('');
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

  const handleSendRentalRequest = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để gửi yêu cầu thuê phòng!');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await rentalApi.createRentalRequest({
        roomId: Number(id),
        note,
      });
      setRequestMsg('Gửi yêu cầu thuê thành công! Chủ trọ sẽ sớm liên hệ xác nhận.');
      setTimeout(() => {
        setShowModal(false);
        setRequestMsg('');
        setNote('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Lỗi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ height: '350px', marginBottom: '2rem' }} className="skeleton" />
        <div style={{ height: '40px', width: '60%', marginBottom: '1rem' }} className="skeleton" />
        <div style={{ height: '20px', width: '40%', marginBottom: '2rem' }} className="skeleton" />
        <div style={{ height: '120px' }} className="skeleton" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h3>Không tìm thấy thông tin phòng trọ này</h3>
        <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>
      </div>
    );
  }

  const images = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000',
  ];

  const utilitiesList = room.utilities ? room.utilities.split(',') : ['Wifi tốc độ cao', 'Điều hòa', 'Bình nóng lạnh', 'Bãi giữ xe máy', 'Camera an ninh 24/7', 'Giờ giấc tự do'];

  return (
    <div className="container" style={{ maxWidth: '1050px' }}>
      <button onClick={() => navigate('/')} className="btn btn-outline" style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem' }}>
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      {/* Gallery Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ height: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <img src={images[activeImg]} alt="Room Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {images.map((img, idx) => (
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
      </div>

      {/* Main Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Phòng {room.roomNumber} - {room.propertyTitle || 'Khu trọ cao cấp'}</h1>
            <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem' }}>
              {room.status === 'AVAILABLE' ? 'Đang còn chỗ' : 'Đã kín'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <MapPin size={18} color="var(--primary)" />
            <span>{room.address || `${room.district}, ${room.city}`}</span>
          </div>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Diện tích</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Maximize2 size={16} color="var(--primary)" /> {room.area} m²
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sức chứa</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={16} color="var(--primary)" /> {room.currentOccupants}/{room.capacity} người
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Giá thuê gốc</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                {Number(room.price).toLocaleString('vi-VN')} đ/th
              </div>
            </div>
          </div>

          {/* Utilities */}
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--primary)" /> Tiện ích & Cơ sở vật chất
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {utilitiesList.map((util, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={16} color="var(--success)" />
                  <span>{util.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Action Card */}
        <div>
          <div style={{ background: 'white', padding: '1.75rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', position: 'sticky', top: '100px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Giá thuê niêm yết</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', margin: '0.4rem 0 1.25rem' }}>
              {Number(room.price).toLocaleString('vi-VN')} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>đ / tháng</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--success)" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--success)' }}>Chủ trọ đã xác thực VNPay</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hệ thống tự động kích hoạt hợp đồng & quản lý minh bạch sau khi được duyệt.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              disabled={room.status !== 'AVAILABLE'}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              <Send size={18} /> Gửi yêu cầu thuê phòng
            </button>
          </div>
        </div>
      </div>

      {/* Modal Rental Request */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Gửi yêu cầu thuê phòng {room.roomNumber}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem', fontSize: '0.9rem' }}>
              {room.propertyTitle} - {Number(room.price).toLocaleString('vi-VN')} đ/tháng
            </p>

            {requestMsg ? (
              <div style={{ color: 'var(--success)', fontWeight: 'bold', textAlign: 'center', padding: '1.5rem' }}>
                {requestMsg}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Lời nhắn / Giới thiệu gửi đến chủ trọ</label>
                  <textarea
                    rows={4}
                    placeholder="Em chào anh/chị, em là sinh viên dự kiến chuyển vào từ đầu tháng tới..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button onClick={() => setShowModal(false)} className="btn btn-outline" disabled={submitting}>Hủy</button>
                  <button onClick={handleSendRentalRequest} className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Xác nhận gửi'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetail;
