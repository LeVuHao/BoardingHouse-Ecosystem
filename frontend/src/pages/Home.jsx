import React, { useState, useEffect } from 'react';
import { propertyApi, rentalApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Maximize2, Users, Send } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal Request
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [note, setNote] = useState('');
  const [requestMsg, setRequestMsg] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await propertyApi.searchRooms({
        city: city || undefined,
        district: district || undefined,
        maxPrice: maxPrice || undefined,
      });
      setRooms(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSendRentalRequest = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để gửi yêu cầu thuê phòng!');
      return;
    }
    try {
      await rentalApi.createRentalRequest({
        roomId: selectedRoom.id,
        note: note,
      });
      setRequestMsg('Gửi yêu cầu thuê thành công! Chủ trọ sẽ sớm phản hồi.');
      setTimeout(() => {
        setSelectedRoom(null);
        setRequestMsg('');
        setNote('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Lỗi gửi yêu cầu');
    }
  };

  return (
    <div className="container">
      <div className="hero-banner">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>Tìm Phòng Trọ & Bạn Ở Ghép Lý Tưởng</h1>
        <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>
          Hàng ngàn phòng trọ giá tốt, kiểm duyệt minh bạch, kết nối trực tiếp với chủ trọ
        </p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Thành phố (VD: Hà Nội, Hồ Chí Minh)..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Quận / Huyện..."
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        />
        <input
          type="number"
          placeholder="Giá tối đa (VNĐ)..."
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <button onClick={fetchRooms} className="btn btn-primary">
          <Search size={18} /> Tìm kiếm
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách phòng...</div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div key={room.id} className="room-card">
              <img
                src={room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'}
                alt={room.roomNumber}
                className="room-img"
              />
              <div className="room-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>Phòng {room.roomNumber} - {room.propertyTitle}</h3>
                  <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-success' : 'badge-danger'}`}>
                    {room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đầy'}
                  </span>
                </div>

                <div className="room-price">
                  {Number(room.price).toLocaleString('vi-VN')} đ/tháng
                </div>

                <div className="room-meta">
                  <span><MapPin size={15} style={{ display: 'inline' }} /> {room.district}, {room.city}</span>
                  <span><Maximize2 size={15} style={{ display: 'inline' }} /> {room.area} m²</span>
                  <span><Users size={15} style={{ display: 'inline' }} /> {room.currentOccupants}/{room.capacity}</span>
                </div>

                <button
                  onClick={() => setSelectedRoom(room)}
                  disabled={room.status !== 'AVAILABLE'}
                  className="btn btn-primary"
                  style={{ marginTop: 'auto', width: '100%' }}
                >
                  <Send size={16} /> Thuê phòng này
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Gửi yêu cầu thuê phòng {selectedRoom.roomNumber}</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>
              {selectedRoom.propertyTitle} - {Number(selectedRoom.price).toLocaleString('vi-VN')} đ/tháng
            </p>

            {requestMsg ? (
              <div style={{ color: 'var(--success)', fontWeight: 'bold', textAlign: 'center', padding: '1rem' }}>
                {requestMsg}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Lời nhắn tới chủ trọ</label>
                  <textarea
                    rows={4}
                    placeholder="Giới thiệu bản thân, thời gian dự kiến chuyển đến..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelectedRoom(null)} className="btn btn-outline">Hủy</button>
                  <button onClick={handleSendRentalRequest} className="btn btn-primary">Xác nhận gửi</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
