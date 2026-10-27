import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { propertyApi, rentalApi, contractApi, billingApi } from '../api/apiClient';
import { Plus, Home, Eye, Check, X, Edit2, Image, Building, TrendingUp, Users, CheckCircle2, Sparkles, FileText, Trash2, Receipt, Zap, Droplet, CalendarDays, Wallet, UploadCloud } from 'lucide-react';
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
  const [createRoomFiles, setCreateRoomFiles] = useState([]);

  // Edit Room form
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [editRoomFiles, setEditRoomFiles] = useState([]);

  // Requests
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [contracts, setContracts] = useState([]);

  // Quick Create Bill Modal
  const [showQuickBill, setShowQuickBill] = useState(false);
  const [quickBillRoom, setQuickBillRoom] = useState(null);
  const [billMonthYear, setBillMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [billRoomAmount, setBillRoomAmount] = useState('');
  const [billElectricityAmount, setBillElectricityAmount] = useState('');
  const [billWaterAmount, setBillWaterAmount] = useState('');
  const [billOtherAmount, setBillOtherAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  const openQuickBillModal = (room) => {
    setQuickBillRoom(room);
    setBillRoomAmount(room.price || '');
    setBillElectricityAmount('');
    setBillWaterAmount('');
    setBillOtherAmount('');
    setShowQuickBill(true);
  };

  const handleCreateQuickBill = async (e) => {
    e.preventDefault();
    if (!quickBillRoom?.activeContractId || !quickBillRoom?.activeTenantId) {
      alert('Không tìm thấy thông tin hợp đồng đang hiệu lực cho phòng này để lập hóa đơn.');
      return;
    }

    setIsSubmittingBill(true);
    try {
      await billingApi.createBill({
        contractId: quickBillRoom.activeContractId,
        roomId: quickBillRoom.id,
        tenantId: quickBillRoom.activeTenantId,
        monthYear: billMonthYear,
        roomAmount: Number(billRoomAmount) || 0,
        electricityAmount: Number(billElectricityAmount) || 0,
        waterAmount: Number(billWaterAmount) || 0,
        otherAmount: Number(billOtherAmount) || 0,
        dueDate: billDueDate,
      });
      alert(`Đã xuất hóa đơn tháng ${billMonthYear} cho phòng ${quickBillRoom.roomNumber} thành công! Hệ thống đã gửi thông báo đến người thuê.`);
      setShowQuickBill(false);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi tạo hóa đơn');
    } finally {
      setIsSubmittingBill(false);
    }
  };

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
      const res = await propertyApi.createRoom({
        propertyId: selectedProperty.id,
        roomNumber,
        price: Number(price),
        area: Number(area),
        capacity: Number(capacity),
        imageUrls: imageUrl ? [imageUrl] : []
      });
      const newRoomId = res.data?.data?.id || res.data?.id;
      if (createRoomFiles && createRoomFiles.length > 0 && newRoomId) {
        const formData = new FormData();
        for (let i = 0; i < createRoomFiles.length; i++) {
          formData.append('files', createRoomFiles[i]);
        }
        await propertyApi.uploadRoomImages(newRoomId, formData);
      }
      toast.success('Thêm phòng trọ mới thành công!');
      setShowAddRoom(false);
      resetRoomForm();
      handleSelectProperty(selectedProperty);
    } catch (err) {
      toast.error(err.message || 'Lỗi thêm phòng');
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
    setEditRoomFiles([]);
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
      if (editRoomFiles && editRoomFiles.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < editRoomFiles.length; i++) {
          formData.append('files', editRoomFiles[i]);
        }
        await propertyApi.uploadRoomImages(editingRoom.id, formData);
      }
      toast.success('Cập nhật phòng thành công!');
      setShowEditRoom(false);
      handleSelectProperty(selectedProperty);
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật phòng');
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
    setRoomNumber(''); setPrice(''); setArea(''); setCapacity('2'); setImageUrl(''); setCreateRoomFiles([]);
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
            <Link to="/contracts" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, color: 'var(--primary)', borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              <FileText size={18} /> Quản lý Hợp đồng ({contracts.length})
            </Link>
          )}
          <button onClick={() => { resetPropertyForm(); setShowAddProperty(true); }} className="btn btn-primary" style={{ fontWeight: 700, background: 'var(--primary)', color: '#ffffff' }}>
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
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Khu trọ / Số phòng</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalProperties} khu · {totalRoomsCount} phòng</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Phòng đang thuê</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{occupiedRoomsCount} phòng</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Phòng còn trống</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{availableRoomsCount} phòng</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Lấp đầy & Doanh thu</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#a78bfa' }}>
                {occupancyRate}% {monthlyRevenue > 0 ? `· ${Number(monthlyRevenue).toLocaleString('vi-VN')}đ` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Properties List */}
        <div>
          <h3 style={{ color: 'var(--text-primary)' }}>Danh sách Khu trọ ({properties.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {properties.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <Home size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Chưa có khu trọ nào. Hãy thêm khu trọ đầu tiên!</p>
              </div>
            )}
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProperty(p)}
                style={{
                  background: selectedProperty?.id === p.id ? 'var(--primary-light)' : 'var(--bg-card)',
                  border: selectedProperty?.id === p.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  padding: '1.2rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                <h4 style={{ margin: '0 0 0.3rem', color: 'var(--text-primary)' }}>{p.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{p.address}, {p.district}, {p.city}</p>
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
            <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>Các phòng: {selectedProperty.title}</h3>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button onClick={openEditProperty} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                    Sửa khu trọ
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(selectedProperty)}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}
                    title="Xóa khu trọ"
                  >
                    Xóa khu trọ
                  </button>
                  <button onClick={() => { resetRoomForm(); setShowAddRoom(true); }} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 700, background: 'var(--primary)', color: '#ffffff' }}>
                    + Thêm phòng
                  </button>
                </div>
              </div>

              <div className="rooms-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {rooms.map((r) => {
                  const st = statusColor(r.status);
                  return (
                    <div key={r.id} style={{ border: '1px solid var(--border-color)', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px' }}>
                      {r.images?.[0] && (
                        <img src={r.images[0]} alt={r.roomNumber} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.6rem' }} />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>Phòng {r.roomNumber}</span>
                        <span style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, padding: '2px 7px', borderRadius: '6px' }}>
                          Mã: MP-{r.id}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                        Mã phòng sự cố: <strong style={{ color: 'var(--text-primary)' }}>MP-{r.id}</strong>
                      </div>
                      <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                        {Number(r.price).toLocaleString('vi-VN')} đ
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
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
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)' }}
                          title="Xóa phòng"
                        >
                          Xóa
                        </button>
                      </div>

                      {r.activeContractId && (
                        <button
                          onClick={() => openQuickBillModal(r)}
                          className="btn btn-primary"
                          style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', background: 'var(--primary)', color: '#ffffff', fontWeight: 700 }}
                        >
                          <Receipt size={14} /> Xuất hóa đơn tháng
                        </button>
                      )}
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
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
              <Home size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Vui lòng chọn 1 khu trọ bên trái để xem danh sách phòng.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Thêm Khu Trọ Mới</h3>
            <form onSubmit={handleAddProperty} style={{ marginTop: '1rem' }}>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tên khu trọ</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mô tả</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              {/* Autocomplete Gợi ý địa chỉ tự động */}
              <div style={{ marginBottom: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                  ✨ Gợi ý & Tự động điền nhanh địa chỉ:
                </label>
                <AddressAutocomplete
                  placeholder="Gõ số nhà, tên đường, chợ, trường ĐH để tự động điền các ô..."
                  onSelectAddress={(result) => {
                    if (result.address) setAddress(result.address);
                    setWard(result.ward || '');
                    if (result.district) setDistrict(result.district);
                    if (result.city) setCity(result.city);
                    if (result.latitude) setLatitude(result.latitude);
                    if (result.longitude) setLongitude(result.longitude);
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Địa chỉ cụ thể</label>
                <input required value={address} onChange={handlePropertyAddressChange(setAddress)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Thành phố</label>
                  <input required value={city} onChange={handlePropertyAddressChange(setCity)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Quận/Huyện</label>
                  <input required value={district} onChange={handlePropertyAddressChange(setDistrict)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Phường/Xã</label>
                  <input required value={ward} onChange={handlePropertyAddressChange(setWard)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <RoomLocationPicker
                addressQuery={[address, ward, district, city].filter(Boolean).join(', ')}
                initialLocation={latitude && longitude ? { latitude, longitude } : null}
                onChange={handlePropertyLocationChange}
              />
              <div className="form-group" style={{ marginTop: '14px', marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiện ích</label>
                <AmenityPicker value={utilities} onChange={setUtilities} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowAddProperty(false)} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lưu khu trọ</button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditProperty && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Chỉnh Sửa Khu Trọ</h3>
            <form onSubmit={handleEditProperty} style={{ marginTop: '1rem' }}>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tên khu trọ</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mô tả</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              {/* Autocomplete Gợi ý địa chỉ tự động */}
              <div style={{ marginBottom: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                  ✨ Gợi ý & Tự động đổi nhanh địa chỉ:
                </label>
                <AddressAutocomplete
                  placeholder="Gõ số nhà, tên đường, chợ, trường ĐH để tự động điền các ô..."
                  onSelectAddress={(result) => {
                    if (result.address) setAddress(result.address);
                    setWard(result.ward || '');
                    if (result.district) setDistrict(result.district);
                    if (result.city) setCity(result.city);
                    if (result.latitude) setLatitude(result.latitude);
                    if (result.longitude) setLongitude(result.longitude);
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Địa chỉ cụ thể</label>
                <input required value={address} onChange={handlePropertyAddressChange(setAddress)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Thành phố</label>
                  <input required value={city} onChange={handlePropertyAddressChange(setCity)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Quận/Huyện</label>
                  <input required value={district} onChange={handlePropertyAddressChange(setDistrict)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Phường/Xã</label>
                  <input required value={ward} onChange={handlePropertyAddressChange(setWard)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <RoomLocationPicker
                addressQuery={[address, ward, district, city].filter(Boolean).join(', ')}
                initialLocation={latitude && longitude ? { latitude, longitude } : selectedProperty}
                onChange={handlePropertyLocationChange}
              />
              <div className="form-group" style={{ marginTop: '14px', marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiện ích</label>
                <AmenityPicker value={utilities} onChange={setUtilities} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowEditProperty(false)} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cập nhật</button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Thêm phòng mới cho {selectedProperty.title}</h3>
            <form onSubmit={handleAddRoom} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Số phòng (VD: P101)</label>
                <input required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Giá thuê (đ/tháng)</label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Diện tích (m²)</label>
                  <input type="number" required value={area} onChange={(e) => setArea(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sức chứa tối đa (người)</label>
                <input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}><UploadCloud size={14} style={{ display: 'inline', marginRight: '4px' }} /> Tải ảnh trực tiếp từ máy (PNG, JPG, WEBP)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setCreateRoomFiles(Array.from(e.target.files || []))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px dashed var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
                {createRoomFiles.length > 0 && (
                  <small style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                    ✓ Đã chọn {createRoomFiles.length} file ảnh
                  </small>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Hoặc link ảnh phòng (URL)</label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowAddRoom(false)} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lưu phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoom && editingRoom && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Chỉnh sửa Phòng {editingRoom.roomNumber}</h3>
            <form onSubmit={handleEditRoom} style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Số phòng</label>
                <input value={editRoomNumber} onChange={(e) => setEditRoomNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Giá thuê (đ/tháng)</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Diện tích (m²)</label>
                  <input type="number" value={editArea} onChange={(e) => setEditArea(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sức chứa</label>
                <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng thái phòng</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="AVAILABLE">Còn trống</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}><UploadCloud size={14} style={{ display: 'inline', marginRight: '4px' }} /> Tải ảnh mới từ máy (PNG, JPG, WEBP)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setEditRoomFiles(Array.from(e.target.files || []))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px dashed var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
                {editRoomFiles.length > 0 && (
                  <small style={{ color: '#10b981', display: 'block', marginTop: '4px' }}>
                    ✓ Đã chọn {editRoomFiles.length} file ảnh tải lên thêm
                  </small>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}><Image size={14} style={{ display: 'inline', marginRight: '4px' }} /> Hoặc thêm link ảnh mới (URL)</label>
                <input value={addImageUrl} onChange={(e) => setAddImageUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button type="button" onClick={() => setShowEditRoom(false)} style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Create Bill Modal */}
      {showQuickBill && quickBillRoom && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '10px', color: 'var(--primary)' }}>
                <Receipt size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Xuất Hóa Đơn Tháng</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Phòng {quickBillRoom.roomNumber} · HĐ #{quickBillRoom.activeContractId}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateQuickBill}>
              <div className="form-group">
                <label><CalendarDays size={14} style={{ display: 'inline', marginRight: '4px' }} /> Tháng thu tiền</label>
                <input
                  type="month"
                  required
                  value={billMonthYear}
                  onChange={(e) => setBillMonthYear(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label><Home size={14} style={{ display: 'inline', marginRight: '4px' }} /> Tiền phòng (đ)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={billRoomAmount}
                    onChange={(e) => setBillRoomAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label><Zap size={14} style={{ display: 'inline', marginRight: '4px', color: '#f59e0b' }} /> Tiền điện (đ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={billElectricityAmount}
                    onChange={(e) => setBillElectricityAmount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label><Droplet size={14} style={{ display: 'inline', marginRight: '4px', color: '#06b6d4' }} /> Tiền nước (đ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={billWaterAmount}
                    onChange={(e) => setBillWaterAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label><Plus size={14} style={{ display: 'inline', marginRight: '4px' }} /> Phí khác (rác, wifi...)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={billOtherAmount}
                    onChange={(e) => setBillOtherAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Hạn thanh toán</label>
                <input
                  type="date"
                  required
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                />
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--primary)' }}>
                  <span>Tổng cộng:</span>
                  <span>
                    {(
                      (Number(billRoomAmount) || 0) +
                      (Number(billElectricityAmount) || 0) +
                      (Number(billWaterAmount) || 0) +
                      (Number(billOtherAmount) || 0)
                    ).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowQuickBill(false)} className="btn btn-outline" disabled={isSubmittingBill}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingBill}>
                  {isSubmittingBill ? 'Đang gửi...' : 'Gửi hóa đơn cho khách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandlordProperties;
