import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { propertyApi } from '../api/apiClient';
import {
  Search, MapPin, Maximize2, Users, SlidersHorizontal, X, Eye
} from 'lucide-react';

const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'AVAILABLE', label: 'Còn trống' },
  { value: 'FULL', label: 'Đã đầy' },
];

const SearchRooms = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [city, setCity] = useState(searchParams.get('city') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilter, setShowFilter] = useState(true);

  const fetchRooms = async (pg = 0) => {
    setLoading(true);
    try {
      const params = {
        city: city || undefined,
        district: district || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minArea: minArea || undefined,
        status: status || undefined,
        page: pg,
        size: 9,
      };
      // sync to URL
      const urlParams = {};
      if (city) urlParams.city = city;
      if (district) urlParams.district = district;
      if (minPrice) urlParams.minPrice = minPrice;
      if (maxPrice) urlParams.maxPrice = maxPrice;
      if (minArea) urlParams.minArea = minArea;
      if (status) urlParams.status = status;
      setSearchParams(urlParams);

      const res = await propertyApi.searchRooms(params);
      const data = res.data;
      setRooms(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
      setPage(data.number || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(0);
  }, []);

  const handleSearch = (e) => {
    e && e.preventDefault();
    fetchRooms(0);
  };

  const handleClear = () => {
    setCity(''); setDistrict(''); setMinPrice(''); setMaxPrice(''); setMinArea(''); setStatus('');
    setSearchParams({});
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showFilter ? '280px 1fr' : '1fr', gap: '2rem', padding: '1.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>

      {/* Sidebar Filter */}
      {showFilter && (
        <aside>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '1.5rem',
            boxShadow: 'var(--shadow)', position: 'sticky', top: '5.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} /> Bộ lọc
              </h3>
              <button onClick={handleClear} style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <X size={14} /> Xóa lọc
              </button>
            </div>

            <form onSubmit={handleSearch}>
              <div className="form-group">
                <label>Thành phố / Tỉnh</label>
                <input placeholder="VD: Hồ Chí Minh, Hà Nội..." value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Quận / Huyện</label>
                <input placeholder="VD: Quận 1, Cầu Giấy..." value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Giá thuê tối thiểu (đ)</label>
                <input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Giá thuê tối đa (đ)</label>
                <input type="number" placeholder="Không giới hạn" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Diện tích tối thiểu (m²)</label>
                <input type="number" placeholder="VD: 15" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Tình trạng phòng</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{
                  width: '100%', padding: '0.6rem', borderRadius: '8px',
                  border: '1px solid var(--border)', fontSize: '0.9rem'
                }}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Search size={16} /> Tìm kiếm
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* Results */}
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Danh sách phòng trọ</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.3rem 0 0' }}>
              {loading ? 'Đang tải...' : `Tìm thấy ${totalElements} phòng`}
            </p>
          </div>
          <button onClick={() => setShowFilter(f => !f)} className="btn btn-outline" style={{ padding: '0.5rem 0.9rem' }}>
            <SlidersHorizontal size={16} /> {showFilter ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ background: '#f3f4f6', borderRadius: '16px', height: '320px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
            <Search size={56} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <h3>Không tìm thấy phòng nào</h3>
            <p>Hãy thử thay đổi điều kiện tìm kiếm</p>
          </div>
        ) : (
          <>
            <div className="rooms-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {rooms.map((room) => (
                <div key={room.id} className="room-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/rooms/${room.id}`)}>
                  <img
                    src={room.images?.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'}
                    alt={room.roomNumber}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600'; }}
                    className="room-img"
                  />
                  <div className="room-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h3 style={{ fontSize: '1rem', margin: 0 }}>Phòng {room.roomNumber}</h3>
                      <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                        {room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đầy'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{room.propertyTitle}</div>
                    <div className="room-price">{Number(room.price).toLocaleString('vi-VN')} đ/tháng</div>
                    <div className="room-meta">
                      <span><MapPin size={13} style={{ display: 'inline', marginRight: '3px' }} />{room.district}, {room.city}</span>
                      <span><Maximize2 size={13} style={{ display: 'inline', marginRight: '3px' }} />{room.area} m²</span>
                      <span><Users size={13} style={{ display: 'inline', marginRight: '3px' }} />{room.currentOccupants}/{room.capacity}</span>
                    </div>
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.8rem', padding: '0.45rem', fontSize: '0.85rem' }}>
                      <Eye size={14} /> Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button disabled={page === 0} onClick={() => fetchRooms(page - 1)} className="btn btn-outline" style={{ padding: '0.4rem 0.9rem' }}>← Trước</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => fetchRooms(i)} className={`btn ${i === page ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.4rem 0.9rem', minWidth: '40px' }}>
                    {i + 1}
                  </button>
                ))}
                <button disabled={page >= totalPages - 1} onClick={() => fetchRooms(page + 1)} className="btn btn-outline" style={{ padding: '0.4rem 0.9rem' }}>Tiếp →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchRooms;
