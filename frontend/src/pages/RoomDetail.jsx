import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyApi, rentalApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Maximize2, Users, DollarSign, ArrowLeft,
  Send, CheckCircle, ChevronLeft, ChevronRight, Home
} from 'lucide-react';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await propertyApi.getRoomDetail(id);
        setRoom(res.data);
      } catch {
        setError('Không tìm thấy thông tin phòng trọ.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const images = room?.images?.length > 0
    ? room.images
    : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'];

  const handlePrevImg = () => setCurrentImg((p) => (p === 0 ? images.length - 1 : p - 1));
  const handleNextImg = () => setCurrentImg((p) => (p === images.length - 1 ? 0 : p + 1));

  const handleRent = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await rentalApi.createRentalRequest({ roomId: Number(id), note });
      setSent(true);
      setTimeout(() => { setShowModal(false); setSent(false); setNote(''); }, 2500);
    } catch (err) {
      alert(err?.message || 'Lỗi gửi yêu cầu. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Đang tải thông tin phòng...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <Home size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
        <p>{error || 'Không tìm thấy phòng trọ.'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    );
  }

  const utilities = room.utilities ? room.utilities.split(',') : [];

  return (
    <div className="container" style={{ maxWidth: '960px' }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Quay lại tìm kiếm
      </button>

      {/* Image Gallery */}
      <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', marginBottom: '2rem', background: '#000' }}>
        <img
          src={images[currentImg]}
          alt={`Phòng ${room.roomNumber}`}
          style={{ width: '100%', height: '420px', objectFit: 'cover', opacity: 0.95 }}
        />
        {images.length > 1 && (
          <>
            <button onClick={handlePrevImg} style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNextImg} style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ChevronRight size={20} />
            </button>
            <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
              {images.map((_, i) => (
                <span key={i} onClick={() => setCurrentImg(i)} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i === currentImg ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer'
                }} />
              ))}
            </div>
          </>
        )}
        {/* Status badge */}
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-success' : 'badge-danger'}`}
            style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem' }}>
            {room.status === 'AVAILABLE' ? '✅ Còn trống' : room.status === 'FULL' ? '🔴 Đã đầy' : '🔧 Bảo trì'}
          </span>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {images.map((img, i) => (
            <img key={i} src={img} alt={`thumb-${i}`} onClick={() => setCurrentImg(i)}
              style={{
                width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px',
                cursor: 'pointer', border: i === currentImg ? '3px solid var(--primary)' : '3px solid transparent',
                flexShrink: 0, transition: 'border-color 0.2s'
              }} />
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* Left: Info */}
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>
            Phòng {room.roomNumber} – {room.propertyTitle}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <MapPin size={16} />
            <span>{room.address && `${room.address}, `}{room.ward && `${room.ward}, `}{room.district}, {room.city}</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: <DollarSign size={20} />, label: 'Giá thuê', value: `${Number(room.price).toLocaleString('vi-VN')} đ/tháng`, color: 'var(--primary)' },
              { icon: <Maximize2 size={20} />, label: 'Diện tích', value: `${room.area} m²`, color: '#06b6d4' },
              { icon: <Users size={20} />, label: 'Người ở', value: `${room.currentOccupants}/${room.capacity} người`, color: '#8b5cf6' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'white', padding: '1.2rem', borderRadius: '14px',
                boxShadow: 'var(--shadow)', textAlign: 'center'
              }}>
                <div style={{ color: stat.color, display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{stat.label}</div>
                <div style={{ fontWeight: '700', color: stat.color, fontSize: '1rem' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Utilities */}
          {utilities.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.8rem' }}>Tiện ích</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {utilities.map((u, i) => (
                  <span key={i} style={{
                    background: 'var(--primary-light)', color: 'var(--primary-dark)',
                    padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500'
                  }}>
                    {u.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: CTA Card */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '1.8rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', position: 'sticky', top: '6rem'
        }}>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.3rem' }}>
            {Number(room.price).toLocaleString('vi-VN')} đ
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>/ tháng</div>

          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            <div>📍 {room.district}, {room.city}</div>
            <div>📐 {room.area} m² · {room.capacity} người tối đa</div>
            <div>👥 Hiện: {room.currentOccupants} người đang ở</div>
          </div>

          {room.status === 'AVAILABLE' ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: '700' }}
            >
              <Send size={18} /> Gửi yêu cầu thuê
            </button>
          ) : (
            <button disabled className="btn" style={{
              width: '100%', padding: '0.9rem', background: '#e5e7eb',
              color: '#9ca3af', cursor: 'not-allowed', borderRadius: '10px'
            }}>
              {room.status === 'FULL' ? 'Phòng đã đầy' : 'Đang bảo trì'}
            </button>
          )}

          {!user && room.status === 'AVAILABLE' && (
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>
              Bạn cần <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate('/login')}>đăng nhập</span> để gửi yêu cầu
            </p>
          )}
        </div>
      </div>

      {/* Modal gửi yêu cầu */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle size={56} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: 'var(--success)' }}>Gửi yêu cầu thành công!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Chủ trọ sẽ liên hệ với bạn sớm.</p>
              </div>
            ) : (
              <>
                <h3>Gửi yêu cầu thuê – Phòng {room.roomNumber}</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 1.5rem' }}>
                  {room.propertyTitle} · {Number(room.price).toLocaleString('vi-VN')} đ/tháng
                </p>
                <div className="form-group">
                  <label>Lời nhắn tới chủ trọ (tùy chọn)</label>
                  <textarea
                    rows={4}
                    placeholder="Giới thiệu bản thân, ngày dự kiến chuyển vào..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button onClick={() => setShowModal(false)} className="btn btn-outline">Hủy</button>
                  <button onClick={handleRent} className="btn btn-primary">
                    <Send size={16} /> Xác nhận gửi
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
