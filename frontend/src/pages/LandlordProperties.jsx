import React, { useState, useEffect } from 'react';
import { propertyApi, rentalApi } from '../api/apiClient';
import { Plus, Home, Eye, Check, X, Edit2, Image } from 'lucide-react';

const LandlordProperties = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

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

  // Edit Room form
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');

  // Requests
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

  useEffect(() => { loadProperties(); }, []);

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
      await propertyApi.createProperty({ title, description, address, city, district, ward, utilities });
      alert('Tạo khu trọ thành công!');
      setShowAddProperty(false);
      resetPropertyForm();
      loadProperties();
    } catch (err) {
      alert(err.message || 'Lỗi tạo khu trọ');
    }
  };

  const handleEditProperty = async (e) => {
    e.preventDefault();
    try {
      await propertyApi.updateProperty(selectedProperty.id, { title, description, address, city, district, ward, utilities });
      alert('Cập nhật khu trọ thành công!');
      setShowEditProperty(false);
      loadProperties();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật khu trọ');
    }
  };

  const openEditProperty = () => {
    setTitle(selectedProperty.title);
    setDescription(selectedProperty.description || '');
    setAddress(selectedProperty.address);
    setCity(selectedProperty.city);
    setDistrict(selectedProperty.district);
    setWard(selectedProperty.ward);
    setUtilities(selectedProperty.utilities || '');
    setShowEditProperty(true);
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
      resetRoomForm();
      handleSelectProperty(selectedProperty);
    } catch (err) {
      alert(err.message || 'Lỗi thêm phòng');
    }
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setEditRoomNumber(room.roomNumber);
    setEditPrice(room.price);
    setEditArea(room.area);
    setEditCapacity(room.capacity);
    setEditStatus(room.status);
    setAddImageUrl('');
    setShowEditRoom(true);
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    try {
      await propertyApi.updateRoom(editingRoom.id, {
        roomNumber: editRoomNumber,
        price: Number(editPrice),
        area: Number(editArea),
        capacity: Number(editCapacity),
        status: editStatus,
      });
      if (addImageUrl) {
        await propertyApi.addRoomImages(editingRoom.id, { imageUrls: [addImageUrl] });
      }
      alert('Cập nhật phòng thành công!');
      setShowEditRoom(false);
      handleSelectProperty(selectedProperty);
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật phòng');
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

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm('Bạn chắc chắn muốn từ chối yêu cầu này?')) return;
    try {
      await rentalApi.rejectRentalRequest(requestId);
      alert('Đã từ chối yêu cầu!');
      loadRoomRequests(selectedRoomId);
    } catch (err) {
      alert(err.message || 'Lỗi từ chối');
    }
  };

  const resetPropertyForm = () => {
    setTitle(''); setDescription(''); setAddress('');
    setCity(''); setDistrict(''); setWard(''); setUtilities('WiFi,Máy lạnh,Máy giặt,Bãi xe');
  };

  const resetRoomForm = () => {
    setRoomNumber(''); setPrice(''); setArea(''); setCapacity('2'); setImageUrl('');
  };

  const statusColor = (status) => ({
    AVAILABLE: { bg: '#d1fae5', color: '#065f46', label: 'Còn trống' },
    FULL: { bg: '#fee2e2', color: '#991b1b', label: 'Đầy' },
    MAINTENANCE: { bg: '#fef3c7', color: '#92400e', label: 'Bảo trì' },
  }[status] || { bg: '#f3f4f6', color: '#374151', label: status });

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Quản Lý Khu Trọ & Phòng Trọ Của Tôi</h2>
        <button onClick={() => { resetPropertyForm(); setShowAddProperty(true); }} className="btn btn-primary">
          <Plus size={18} /> Thêm Khu Trọ Mới
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Properties List */}
        <div>
          <h3>Danh sách Khu trọ ({properties.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {properties.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'white', borderRadius: '12px' }}>
                <Home size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Chưa có khu trọ nào. Hãy thêm khu trọ đầu tiên!</p>
              </div>
            )}
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProperty(p)}
                style={{
                  background: selectedProperty?.id === p.id ? 'var(--primary-light)' : 'white',
                  border: selectedProperty?.id === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  padding: '1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <h4 style={{ margin: '0 0 0.3rem' }}>{p.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{p.address}, {p.district}, {p.city}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
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
                <h3>Các phòng: {selectedProperty.title}</h3>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button onClick={openEditProperty} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    <Edit2 size={14} /> Sửa khu trọ
                  </button>
                  <button onClick={() => { resetRoomForm(); setShowAddRoom(true); }} className="btn btn-outline">
                    <Plus size={16} /> Thêm phòng
                  </button>
                </div>
              </div>

              <div className="rooms-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {rooms.map((r) => {
                  const st = statusColor(r.status);
                  return (
                    <div key={r.id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '10px' }}>
                      {r.images?.[0] && (
                        <img src={r.images[0]} alt={r.roomNumber} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.6rem' }} />
                      )}
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.2rem' }}>Phòng {r.roomNumber}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                        {Number(r.price).toLocaleString('vi-VN')} đ
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {r.area} m² · {r.currentOccupants}/{r.capacity} người
                      </div>
                      <span style={{ background: st.bg, color: st.color, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: '600' }}>
                        {st.label}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.7rem' }}>
                        <button
                          onClick={() => loadRoomRequests(r.id)}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '0.3rem' }}
                        >
                          <Eye size={13} /> Yêu cầu
                        </button>
                        <button
                          onClick={() => openEditRoom(r)}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '0.3rem' }}
                        >
                          <Edit2 size={13} /> Sửa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Requests for room */}
              {selectedRoomId && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <h4>Yêu cầu thuê phòng ({requests.length})</h4>
                  {requests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Chưa có yêu cầu thuê nào.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                      {requests.map((req) => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                          <div>
                            <div><strong>Người dùng ID #{req.userId}</strong> – <span className="badge badge-warning">{req.status}</span></div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lời nhắn: {req.note || 'Không có'}</div>
                          </div>
                          {req.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => handleApproveRequest(req.id)} className="btn btn-success" style={{ padding: '0.3rem 0.7rem' }}>
                                <Check size={15} /> Duyệt
                              </button>
                              <button onClick={() => handleRejectRequest(req.id)} className="btn" style={{ padding: '0.3rem 0.7rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                <X size={15} /> Từ chối
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
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              <Home size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Vui lòng chọn 1 khu trọ bên trái để xem danh sách phòng.</p>
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
              <div className="form-group"><label>Mô tả</label><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="form-group"><label>Địa chỉ cụ thể</label><input required value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group"><label>Thành phố</label><input required value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div className="form-group"><label>Quận/Huyện</label><input required value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
                <div className="form-group"><label>Phường/Xã</label><input required value={ward} onChange={(e) => setWard(e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Tiện ích (phân tách dấu phẩy)</label><input value={utilities} onChange={(e) => setUtilities(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddProperty(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu khu trọ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditProperty && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Chỉnh Sửa Khu Trọ</h3>
            <form onSubmit={handleEditProperty} style={{ marginTop: '1rem' }}>
              <div className="form-group"><label>Tên khu trọ</label><input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="form-group"><label>Mô tả</label><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="form-group"><label>Địa chỉ cụ thể</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group"><label>Thành phố</label><input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div className="form-group"><label>Quận/Huyện</label><input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
                <div className="form-group"><label>Phường/Xã</label><input value={ward} onChange={(e) => setWard(e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Tiện ích</label><input value={utilities} onChange={(e) => setUtilities(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditProperty(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Cập nhật</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group"><label>Giá thuê (đ/tháng)</label><input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                <div className="form-group"><label>Diện tích (m²)</label><input type="number" required value={area} onChange={(e) => setArea(e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Sức chứa tối đa (người)</label><input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
              <div className="form-group"><label>Link ảnh phòng</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddRoom(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoom && editingRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Chỉnh sửa Phòng {editingRoom.roomNumber}</h3>
            <form onSubmit={handleEditRoom} style={{ marginTop: '1rem' }}>
              <div className="form-group"><label>Số phòng</label><input value={editRoomNumber} onChange={(e) => setEditRoomNumber(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group"><label>Giá thuê (đ/tháng)</label><input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /></div>
                <div className="form-group"><label>Diện tích (m²)</label><input type="number" value={editArea} onChange={(e) => setEditArea(e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Sức chứa</label><input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} /></div>
              <div className="form-group">
                <label>Trạng thái phòng</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <option value="AVAILABLE">Còn trống</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>
              <div className="form-group">
                <label><Image size={14} style={{ display: 'inline', marginRight: '4px' }} /> Thêm ảnh mới (URL)</label>
                <input value={addImageUrl} onChange={(e) => setAddImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditRoom(false)} className="btn btn-outline">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordProperties;
