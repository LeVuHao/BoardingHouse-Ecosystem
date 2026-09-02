import React, { useState, useEffect } from 'react';
import { propertyApi, rentalApi } from '../api/apiClient';
import { Plus, Home, Eye, Check, X } from 'lucide-react';

const LandlordProperties = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);

  // Form Property
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [utilities, setUtilities] = useState('WiFi,Máy lạnh,Máy giặt,Bãi xe');

  // Form Room
  const [roomNumber, setRoomNumber] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [imageUrl, setImageUrl] = useState('');

  // Requests of selected Room
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [requests, setRequests] = useState([]);

  const loadProperties = async () => {
    try {
      const res = await propertyApi.getMyProperties();
      setProperties(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleSelectProperty = async (prop) => {
    setSelectedProperty(prop);
    setSelectedRoomId(null);
    try {
      const res = await propertyApi.getPropertyRooms(prop.id);
      setRooms(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      await propertyApi.createProperty({
        title, description, address, city, district, ward, utilities
      });
      alert('Tạo khu trọ thành công!');
      setShowAddProperty(false);
      loadProperties();
    } catch (err) {
      alert(err.message || 'Lỗi tạo khu trọ');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await propertyApi.createRoom({
        propertyId: selectedProperty.id,
        roomNumber,
        price: Number(price),
        area: Number(area),
        capacity: Number(capacity),
        imageUrls: imageUrl ? [imageUrl] : []
      });
      alert('Thêm phòng thành công!');
      setShowAddRoom(false);
      handleSelectProperty(selectedProperty);
    } catch (err) {
      alert(err.message || 'Lỗi thêm phòng');
    }
  };

  const loadRoomRequests = async (roomId) => {
    setSelectedRoomId(roomId);
    try {
      const res = await rentalApi.getRequestsByRoom(roomId);
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await rentalApi.approveRentalRequest(requestId);
      alert('Đã duyệt yêu cầu thuê phòng và kích hoạt hợp đồng thành công!');
      loadRoomRequests(selectedRoomId);
      handleSelectProperty(selectedProperty);
    } catch (err) {
      alert(err.message || 'Lỗi duyệt');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Quản Lý Khu Trọ & Phòng Trọ Của Tôi</h2>
        <button onClick={() => setShowAddProperty(true)} className="btn btn-primary">
          <Plus size={18} /> Thêm Khu Trọ Mới
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Properties List */}
        <div>
          <h3>Danh sách Khu trọ ({properties.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProperty(p)}
                style={{
                  background: selectedProperty?.id === p.id ? 'var(--primary-light)' : 'white',
                  border: selectedProperty?.id === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  padding: '1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                <h4>{p.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.address}, {p.district}, {p.city}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem', fontWeight: 'bold' }}>
                  Số phòng: {p.totalRooms}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms Details */}
        <div>
          {selectedProperty ? (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Các phòng thuộc: {selectedProperty.title}</h3>
                <button onClick={() => setShowAddRoom(true)} className="btn btn-outline">
                  <Plus size={16} /> Thêm phòng
                </button>
              </div>

              <div className="rooms-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {rooms.map((r) => (
                  <div key={r.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Phòng {r.roomNumber}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', margin: '0.3rem 0' }}>
                      {Number(r.price).toLocaleString('vi-VN')} đ
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Ở: {r.currentOccupants}/{r.capacity} người
                    </div>
                    <button
                      onClick={() => loadRoomRequests(r.id)}
                      className="btn btn-outline"
                      style={{ width: '100%', marginTop: '0.8rem', fontSize: '0.8rem', padding: '0.3rem' }}
                    >
                      <Eye size={14} /> Xem yêu cầu
                    </button>
                  </div>
                ))}
              </div>

              {/* Requests for room */}
              {selectedRoomId && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <h4>Yêu cầu thuê phòng ({requests.length})</h4>
                  {requests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Chưa có yêu cầu thuê nào.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                      {requests.map((req) => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                          <div>
                            <div><strong>Người dùng ID #{req.userId}</strong> - Trạng thái: <span className="badge badge-warning">{req.status}</span></div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lời nhắn: {req.note || 'Không có'}</div>
                          </div>
                          {req.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleApproveRequest(req.id)} className="btn btn-success" style={{ padding: '0.3rem 0.6rem' }}>
                                <Check size={16} /> Duyệt
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Vui lòng chọn 1 khu trọ bên trái để xem danh sách phòng.
            </div>
          )}
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Thêm Khu Trọ Mới</h3>
            <form onSubmit={handleAddProperty} style={{ marginTop: '1rem' }}>
              <div className="form-group"><label>Tên khu trọ</label><input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="form-group"><label>Địa chỉ cụ thể</label><input required value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div className="form-group"><label>Thành phố</label><input required value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div className="form-group"><label>Quận / Huyện</label><input required value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
              <div className="form-group"><label>Phường / Xã</label><input required value={ward} onChange={(e) => setWard(e.target.value)} /></div>
              <div className="form-group"><label>Tiện ích (phân tách dấu phẩy)</label><input value={utilities} onChange={(e) => setUtilities(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddProperty(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu khu trọ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Thêm phòng mới cho {selectedProperty.title}</h3>
            <form onSubmit={handleAddRoom} style={{ marginTop: '1rem' }}>
              <div className="form-group"><label>Số phòng (VD: P101)</label><input required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} /></div>
              <div className="form-group"><label>Giá thuê (VNĐ/tháng)</label><input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} /></div>
              <div className="form-group"><label>Diện tích (m²)</label><input type="number" required value={area} onChange={(e) => setArea(e.target.value)} /></div>
              <div className="form-group"><label>Sức chứa tối đa (người)</label><input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
              <div className="form-group"><label>Link ảnh demo</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddRoom(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordProperties;
