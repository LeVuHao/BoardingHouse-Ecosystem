import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { propertyApi, rentalApi, contractApi } from '../api/apiClient';
import { Plus, Home, Eye, Check, X, Edit2, Image, Building, TrendingUp, Users, CheckCircle2, Sparkles, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AmenityPicker from '../components/AmenityPicker';
import RoomLocationPicker from '../components/RoomLocationPicker';
import AddressAutocomplete from '../components/AddressAutocomplete';

const LandlordProperties = ({ hideAnalytics = false, embedded = false }) => {
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
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

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
  const [contracts, setContracts] = useState([]);

  const loadProperties = async () => {
    try {
      const res = await propertyApi.getMyProperties();
      setProperties(res.data || []);
      try {
        const cRes = await contractApi.getLandlordContracts();
        setContracts(cRes.data || []);
      } catch (e) {
        // im lặng nếu chưa có hợp đồng
      }
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
    if (latitude == null || longitude == null) {
      alert('Hãy chọn vị trí khu trọ trên bản đồ trước khi lưu.');
      return;
    }

    try {
      await propertyApi.createProperty({ title, description, address, city, district, ward, utilities, latitude, longitude });
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
    if (latitude == null || longitude == null) {
      alert('Hãy chọn lại vị trí khu trọ trên bản đồ trước khi cập nhật.');
      return;
    }

    try {
      await propertyApi.updateProperty(selectedProperty.id, { title, description, address, city, district, ward, utilities, latitude, longitude });
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
    setLatitude(selectedProperty.latitude ?? null);
    setLongitude(selectedProperty.longitude ?? null);
    setShowEditProperty(true);
  };

  const handlePropertyLocationChange = ({ latitude: nextLatitude, longitude: nextLongitude }) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
  };

  const handlePropertyAddressChange = (setter) => (event) => {
    setter(event.target.value);
    setLatitude(null);
    setLongitude(null);
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
      toast.success('Đã từ chối yêu cầu!');
      loadRoomRequests(selectedRoomId);
    } catch (err) {
      toast.error(err.message || 'Lỗi từ chối');
    }
  };

  const handleDeleteProperty = async (prop) => {
    if (!prop) return;
    const confirmed = window.confirm(
      `XÁC NHẬN XÓA KHU TRỌ:\n\nBạn có chắc chắn muốn xóa khu trọ "${prop.title}"?\n\n• Lưu ý: Hệ thống chỉ cho phép xóa nếu không có phòng nào đang có hợp đồng thuê hiệu lực.`
    );
    if (!confirmed) return;

    try {
      await propertyApi.deleteProperty(prop.id);
      toast.success(`Đã xóa khu trọ "${prop.title}" thành công!`);
      setSelectedProperty(null);
      setRooms([]);
      loadProperties();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xóa khu trọ');
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!room) return;
    const confirmed = window.confirm(
      `XÁC NHẬN XÓA PHÒNG TRỌ:\n\nBạn có chắc chắn muốn xóa Phòng ${room.roomNumber}?\n\n• Lưu ý: Không thể xóa nếu phòng đang có khách thuê hoặc hợp đồng hoạt động.`
    );
    if (!confirmed) return;

    try {
      await propertyApi.deleteRoom(room.id);
      toast.success(`Đã xóa Phòng ${room.roomNumber} thành công!`);
      handleSelectProperty(selectedProperty);
      loadProperties();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xóa phòng');
    }
  };

  const resetPropertyForm = () => {
    setTitle(''); setDescription(''); setAddress('');
    setCity(''); setDistrict(''); setWard(''); setUtilities('WiFi,Máy lạnh,Máy giặt,Bãi xe');
    setLatitude(null); setLongitude(null);
  };

  const resetRoomForm = () => {
    setRoomNumber(''); setPrice(''); setArea(''); setCapacity('2'); setImageUrl('');
  };

  const statusColor = (status) => ({
    AVAILABLE: { bg: '#d1fae5', color: '#065f46', label: 'Còn trống' },
    FULL: { bg: '#fee2e2', color: '#991b1b', label: 'Đầy' },
    MAINTENANCE: { bg: '#fef3c7', color: '#92400e', label: 'Bảo trì' },
  }[status] || { bg: '#f3f4f6', color: '#374151', label: status });

  // Tính toán số liệu thống kê Mini-Analytics cho Chủ trọ
  const totalProperties = properties.length;
  const totalRoomsCount = properties.reduce((sum, p) => sum + (p.totalRooms || 0), 0);
  const occupiedRoomsCount = contracts.length > 0
    ? contracts.length
    : rooms.filter(r => r.status === 'FULL').length;
  const availableRoomsCount = Math.max(0, totalRoomsCount - occupiedRoomsCount);
  const occupancyRate = totalRoomsCount > 0
    ? Math.min(100, Math.round((occupiedRoomsCount / totalRoomsCount) * 100))
    : (properties.length > 0 ? 80 : 0);
  const monthlyRevenue = contracts.reduce((sum, c) => sum + Number(c.rentalPrice || 0), 0) ||
    rooms.filter(r => r.status === 'FULL').reduce((sum, r) => sum + Number(r.price || 0), 0);

  return (
    <div className={embedded ? "" : "container"} style={embedded ? { padding: 0 } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: embedded ? '22px' : '26px' }}>Khu Trọ & Danh Sách Phòng</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Quản lý các khu trọ, sơ đồ phòng, tiện ích, giá thuê và vị trí định vị trên bản đồ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!embedded && (
            <Link to="/contracts" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}>
              <FileText size={18} /> Quản lý Hợp đồng ({contracts.length})
            </Link>
          )}
          <button onClick={() => { resetPropertyForm(); setShowAddProperty(true); }} className="btn btn-primary" style={{ fontWeight: 700 }}>
            + Thêm Khu Trọ Mới
          </button>
        </div>
      </div>

      {/* 4 TỔNG QUAN THỐNG KÊ MINI-ANALYTICS */}
      {!hideAnalytics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '2rem',
          }}
        >
          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Khu trọ / Số phòng</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>{totalProperties} khu · {totalRoomsCount} phòng</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Phòng đang thuê</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>{occupiedRoomsCount} phòng</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Phòng còn trống</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ea580c' }}>{availableRoomsCount} phòng</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Lấp đầy & Doanh thu</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#7c3aed' }}>
                {occupancyRate}% {monthlyRevenue > 0 ? `· ${Number(monthlyRevenue).toLocaleString('vi-VN')}đ` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    Sửa khu trọ
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(selectedProperty)}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fff1f2' }}
                    title="Xóa khu trọ"
                  >
                    Xóa khu trọ
                  </button>
                  <button onClick={() => { resetRoomForm(); setShowAddRoom(true); }} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 700 }}>
                    + Thêm phòng
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Phòng {r.roomNumber}</span>
                        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px' }}>
                          Mã: MP-{r.id}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem' }}>
                        Mã phòng sự cố: <strong>MP-{r.id}</strong>
                      </div>
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
                          style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem' }}
                        >
                          Yêu cầu
                        </button>
                        <button
                          onClick={() => openEditRoom(r)}
                          className="btn btn-outline"
                          style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem' }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(r)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fff1f2' }}
                          title="Xóa phòng"
                        >
                          Xóa
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
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Thêm Khu Trọ Mới</h3>
            <form onSubmit={handleAddProperty} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Tên khu trọ</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Mô tả</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              {/* Autocomplete Gợi ý địa chỉ tự động */}
              <div style={{ marginBottom: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                  ✨ Gợi ý & Tự động điền nhanh địa chỉ:
                </label>
                <AddressAutocomplete
                  placeholder="Gõ số nhà, tên đường, chợ, trường ĐH để tự động điền các ô..."
                  onSelectAddress={(result) => {
                    if (result.address) setAddress(result.address);
                    if (result.ward) setWard(result.ward);
                    if (result.district) setDistrict(result.district);
                    if (result.city) setCity(result.city);
                    if (result.latitude) setLatitude(result.latitude);
                    if (result.longitude) setLongitude(result.longitude);
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Địa chỉ cụ thể</label>
                <input required value={address} onChange={handlePropertyAddressChange(setAddress)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Thành phố</label>
                  <input required value={city} onChange={handlePropertyAddressChange(setCity)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Quận/Huyện</label>
                  <input required value={district} onChange={handlePropertyAddressChange(setDistrict)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Phường/Xã</label>
                  <input required value={ward} onChange={handlePropertyAddressChange(setWard)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <RoomLocationPicker
                addressQuery={[address, ward, district, city].filter(Boolean).join(', ')}
                onChange={handlePropertyLocationChange}
              />
              <div className="form-group" style={{ marginTop: '14px', marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Tiện ích</label>
                <AmenityPicker value={utilities} onChange={setUtilities} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowAddProperty(false)} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lưu khu trọ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditProperty && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Chỉnh Sửa Khu Trọ</h3>
            <form onSubmit={handleEditProperty} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Tên khu trọ</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Mô tả</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              {/* Autocomplete Gợi ý địa chỉ tự động */}
              <div style={{ marginBottom: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                  ✨ Gợi ý & Tự động đổi nhanh địa chỉ:
                </label>
                <AddressAutocomplete
                  placeholder="Gõ số nhà, tên đường, chợ, trường ĐH để tự động điền các ô..."
                  onSelectAddress={(result) => {
                    if (result.address) setAddress(result.address);
                    if (result.ward) setWard(result.ward);
                    if (result.district) setDistrict(result.district);
                    if (result.city) setCity(result.city);
                    if (result.latitude) setLatitude(result.latitude);
                    if (result.longitude) setLongitude(result.longitude);
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Địa chỉ cụ thể</label>
                <input required value={address} onChange={handlePropertyAddressChange(setAddress)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Thành phố</label>
                  <input required value={city} onChange={handlePropertyAddressChange(setCity)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Quận/Huyện</label>
                  <input required value={district} onChange={handlePropertyAddressChange(setDistrict)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Phường/Xã</label>
                  <input required value={ward} onChange={handlePropertyAddressChange(setWard)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <RoomLocationPicker
                addressQuery={[address, ward, district, city].filter(Boolean).join(', ')}
                initialLocation={selectedProperty}
                onChange={handlePropertyLocationChange}
              />
              <div className="form-group" style={{ marginTop: '14px', marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Tiện ích</label>
                <AmenityPicker value={utilities} onChange={setUtilities} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowEditProperty(false)} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Thêm phòng mới cho {selectedProperty.title}</h3>
            <form onSubmit={handleAddRoom} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Số phòng (VD: P101)</label>
                <input required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Giá thuê (đ/tháng)</label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Diện tích (m²)</label>
                  <input type="number" required value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Sức chứa tối đa (người)</label>
                <input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Link ảnh phòng</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowAddRoom(false)} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lưu phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoom && editingRoom && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>Chỉnh sửa Phòng {editingRoom.roomNumber}</h3>
            <form onSubmit={handleEditRoom} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Số phòng</label>
                <input value={editRoomNumber} onChange={(e) => setEditRoomNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Giá thuê (đ/tháng)</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Diện tích (m²)</label>
                  <input type="number" value={editArea} onChange={(e) => setEditArea(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Sức chứa</label>
                <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>Trạng thái phòng</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="AVAILABLE">Còn trống</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: '#334155' }}><Image size={14} style={{ display: 'inline', marginRight: '4px' }} /> Thêm ảnh mới (URL)</label>
                <input value={addImageUrl} onChange={(e) => setAddImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowEditRoom(false)} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordProperties;
