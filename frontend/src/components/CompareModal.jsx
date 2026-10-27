import React, { useEffect } from 'react';
import { X, Check, ExternalLink, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600';

// Danh sách tiện ích cần so sánh tick/cross
const AMENITY_CHECKS = [
  { key: 'ac', label: 'Máy lạnh / Điều hoà', keywords: ['máy lạnh', 'điều hòa', 'điều hoà', 'air'] },
  { key: 'loft', label: 'Gác lửng / Gác xép', keywords: ['gác lửng', 'gác xép', 'loft'] },
  { key: 'balcony', label: 'Ban công', keywords: ['ban công', 'balcony'] },
  { key: 'pet', label: 'Nuôi thú cưng', keywords: ['thú cưng', 'pet', 'chó', 'mèo'] },
  { key: 'elevator', label: 'Thang máy', keywords: ['thang máy', 'elevator', 'lift'] },
  { key: 'freetime', label: 'Giờ giấc tự do', keywords: ['tự do', 'không giờ giới hạn', 'ra vào 24', '24/7'] },
  { key: 'parking', label: 'Bãi đậu xe / Để xe', keywords: ['để xe', 'bãi xe', 'chỗ xe', 'parking'] },
  { key: 'fridge', label: 'Tủ lạnh', keywords: ['tủ lạnh', 'fridge', 'refrigerator'] },
  { key: 'washer', label: 'Máy giặt', keywords: ['máy giặt', 'washer', 'washing'] },
  { key: 'wifi', label: 'Wifi', keywords: ['wifi', 'internet', 'mạng'] },
  { key: 'security', label: 'Camera / Bảo vệ', keywords: ['camera', 'bảo vệ', 'an ninh', 'khóa vân tay', 'thẻ từ'] },
];

const hasAmenity = (post, amenityDef) => {
  const text = [
    post.utilities || '',
    post.description || '',
    post.amenities || '',
    ...(Array.isArray(post.amenityList) ? post.amenityList : []),
  ]
    .join(' ')
    .toLowerCase();
  return amenityDef.keywords.some((kw) => text.includes(kw.toLowerCase()));
};

const getBestRoom = (rooms) => {
  // Phòng tốt nhất: giá thấp nhất nhưng nhiều tiện ích nhất
  if (!rooms || rooms.length === 0) return null;
  return rooms.reduce((best, room) => {
    const roomScore = AMENITY_CHECKS.filter((a) => hasAmenity(room, a)).length;
    const bestScore = AMENITY_CHECKS.filter((a) => hasAmenity(best, a)).length;
    if (roomScore > bestScore) return room;
    if (roomScore === bestScore && Number(room.price) < Number(best.price)) return room;
    return best;
  }, rooms[0]);
};

const CompareModal = () => {
  const { compareList, isCompareModalOpen, closeCompareModal, clearCompare } = useCompare();

  // Đóng modal bằng Escape
  useEffect(() => {
    if (!isCompareModalOpen) return;
    const handler = (e) => { if (e.key === 'Escape') closeCompareModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCompareModalOpen, closeCompareModal]);

  // Khóa scroll body khi modal mở
  useEffect(() => {
    if (isCompareModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCompareModalOpen]);

  if (!isCompareModalOpen || compareList.length < 2) return null;

  const rooms = compareList;
  const bestRoom = getBestRoom(rooms);
  const cols = rooms.length;

  return (
    <>
      <style>{`
        .cmp-overlay {
          position: fixed;
          inset: 0;
          z-index: 10001;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 20px 12px 100px;
          overflow-y: auto;
          animation: cmpFadeIn 0.22s ease;
        }
        @keyframes cmpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cmp-modal {
          background: var(--bg-card, #1e1e2e);
          border-radius: 24px;
          width: 100%;
          max-width: ${cols === 3 ? '1040px' : '760px'};
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          overflow: hidden;
          animation: cmpSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(255,255,255,0.08);
        }
        @keyframes cmpSlideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .cmp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 16px;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .cmp-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 800;
          color: white;
        }
        .cmp-header-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          font-weight: 400;
          margin-top: 2px;
        }
        .cmp-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .cmp-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .cmp-table-wrap {
          overflow-x: auto;
          padding: 0;
        }
        .cmp-table {
          width: 100%;
          border-collapse: collapse;
          min-width: ${cols === 3 ? '720px' : '520px'};
        }
        .cmp-table th, .cmp-table td {
          padding: 0;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cmp-label-col {
          width: 180px;
          min-width: 160px;
          background: rgba(255,255,255,0.02);
          padding: 14px 18px;
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          vertical-align: middle;
          border-right: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
        }
        .cmp-room-col {
          padding: 14px 16px;
          vertical-align: middle;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        .cmp-room-col:last-child {
          border-right: none;
        }
        .cmp-room-col.is-best {
          background: rgba(124, 58, 237, 0.06);
        }
        /* HEADER ROW: ảnh + tên + giá */
        .cmp-photo-row td {
          padding: 0;
        }
        .cmp-photo-wrap {
          position: relative;
          height: 160px;
          overflow: hidden;
        }
        .cmp-photo-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cmp-photo-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(transparent 40%, rgba(0,0,0,0.7));
        }
        .cmp-photo-badge-best {
          position: absolute;
          top: 10px;
          left: 10px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 10px rgba(124,58,237,0.5);
        }
        .cmp-room-title-cell {
          padding: 12px 16px 14px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cmp-room-name {
          font-size: 14px;
          font-weight: 700;
          color: white;
          line-height: 1.3;
          margin-bottom: 4px;
        }
        .cmp-room-price-main {
          font-size: 20px;
          font-weight: 800;
          color: #a78bfa;
          line-height: 1;
        }
        .cmp-room-price-unit {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.4);
          margin-left: 2px;
        }
        /* Value cells */
        .cmp-val {
          font-size: 13.5px;
          font-weight: 600;
          color: white;
        }
        .cmp-val-sub {
          font-size: 11.5px;
          color: rgba(255,255,255,0.45);
          font-weight: 400;
          margin-top: 2px;
        }
        .cmp-na {
          font-size: 13px;
          color: rgba(255,255,255,0.25);
          font-style: italic;
        }
        /* Section header rows */
        .cmp-section-row td {
          padding: 10px 18px 6px;
          background: rgba(255,255,255,0.04);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
        }
        /* Amenity tick/cross */
        .cmp-check-yes {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #34d399;
          font-size: 13px;
          font-weight: 700;
        }
        .cmp-check-yes svg {
          background: rgba(52, 211, 153, 0.15);
          border-radius: 50%;
          padding: 2px;
        }
        .cmp-check-no {
          font-size: 18px;
          color: rgba(255,255,255,0.2);
          font-weight: 300;
        }
        /* Action row */
        .cmp-action-row td {
          padding: 16px;
          border-bottom: none !important;
        }
        .cmp-btn-view {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px 16px;
          background: rgba(255,255,255,0.07);
          color: white;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 8px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .cmp-btn-view:hover {
          background: rgba(255,255,255,0.12);
        }
        .cmp-btn-rent {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(124,58,237,0.35);
        }
        .cmp-btn-rent:hover {
          background: linear-gradient(135deg, #6d28d9, #5b21b6);
          transform: translateY(-1px);
        }
        .cmp-footer {
          padding: 14px 24px;
          background: rgba(0,0,0,0.2);
          display: flex;
          justify-content: center;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .cmp-footer-clear {
          padding: 8px 20px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cmp-footer-clear:hover {
          border-color: rgba(239,68,68,0.4);
          color: #fca5a5;
          background: rgba(239,68,68,0.08);
        }
        /* Highlight best value */
        .cmp-highlight {
          color: #34d399;
          position: relative;
        }
        @media (max-width: 600px) {
          .cmp-label-col {
            width: 120px;
            min-width: 100px;
            padding: 12px 10px;
            font-size: 11.5px;
          }
          .cmp-room-col {
            padding: 12px 10px;
          }
        }
      `}</style>

      <div className="cmp-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeCompareModal(); }}>
        <div className="cmp-modal">
          {/* Header */}
          <div className="cmp-header">
            <div>
              <div className="cmp-header-title">
                ⚖️ Bảng So Sánh Chi Tiết
              </div>
              <div className="cmp-header-subtitle">
                Đang so sánh {cols} phòng — nhìn vào là biết phòng nào lợi hơn
              </div>
            </div>
            <button className="cmp-close-btn" onClick={closeCompareModal} title="Đóng">
              <X size={18} />
            </button>
          </div>

          <div className="cmp-table-wrap">
            <table className="cmp-table">
              <colgroup>
                <col style={{ width: '180px' }} />
                {rooms.map((_, i) => <col key={i} />)}
              </colgroup>

              {/* ===== HÀNG ẢNH ===== */}
              <tbody>
                <tr className="cmp-photo-row">
                  <td className="cmp-label-col" style={{ background: 'rgba(255,255,255,0.02)' }}></td>
                  {rooms.map((room) => {
                    const imgSrc = (room.images || room.imageUrls || [])[0] || FALLBACK_IMG;
                    const isBest = bestRoom?.id === room.id;
                    return (
                      <td key={room.id} style={{ padding: 0 }}>
                        <div className="cmp-photo-wrap">
                          <img src={imgSrc} alt={room.title} />
                          <div className="cmp-photo-overlay" />
                          {isBest && (
                            <div className="cmp-photo-badge-best">
                              <Check size={10} /> Đề xuất
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* ===== HÀNG TÊN + GIÁ CHÍNH ===== */}
                <tr>
                  <td className="cmp-label-col" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Phòng</td>
                  {rooms.map((room) => {
                    const isBest = bestRoom?.id === room.id;
                    return (
                      <td key={room.id} className={`cmp-room-title-cell${isBest ? ' is-best' : ''}`}
                        style={{ padding: '12px 16px 14px', background: isBest ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="cmp-room-name">{room.title || `Phòng ${room.roomNumber || room.id}`}</div>
                        <div style={{ marginTop: 6 }}>
                          <span className="cmp-room-price-main">{formatVnd(room.price)}</span>
                          <span className="cmp-room-price-unit">/tháng</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* ===== SECTION: CHI PHÍ ===== */}
                <tr className="cmp-section-row">
                  <td colSpan={cols + 1}>💰 Chi phí & Đặt cọc</td>
                </tr>

                <tr>
                  <td className="cmp-label-col">Tiền cọc</td>
                  {rooms.map((room) => {
                    const deposit = room.deposit || room.depositAmount;
                    return (
                      <td key={room.id} className={`cmp-room-col${bestRoom?.id === room.id ? ' is-best' : ''}`}>
                        {deposit ? (
                          <span className="cmp-val">{formatVnd(deposit)}</span>
                        ) : (
                          <span className="cmp-na">Chưa có thông tin</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="cmp-label-col">Giá điện</td>
                  {rooms.map((room) => {
                    const elec = room.electricityPrice || room.electricPrice;
                    return (
                      <td key={room.id} className={`cmp-room-col${bestRoom?.id === room.id ? ' is-best' : ''}`}>
                        {elec ? (
                          <>
                            <span className="cmp-val">{formatVnd(elec)}</span>
                            <div className="cmp-val-sub">đ/kWh</div>
                          </>
                        ) : (
                          <span className="cmp-na">Theo giá điện nhà nước</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="cmp-label-col">Giá nước</td>
                  {rooms.map((room) => {
                    const water = room.waterPrice;
                    return (
                      <td key={room.id} className={`cmp-room-col${bestRoom?.id === room.id ? ' is-best' : ''}`}>
                        {water ? (
                          <>
                            <span className="cmp-val">{formatVnd(water)}</span>
                            <div className="cmp-val-sub">đ/m³</div>
                          </>
                        ) : (
                          <span className="cmp-na">Chưa có thông tin</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="cmp-label-col">Phí DV / Wifi</td>
                  {rooms.map((room) => {
                    const svc = room.servicePrice || room.serviceFee || room.wifiPrice;
                    return (
                      <td key={room.id} className={`cmp-room-col${bestRoom?.id === room.id ? ' is-best' : ''}`}>
                        {svc ? (
                          <>
                            <span className="cmp-val">{formatVnd(svc)}</span>
                            <div className="cmp-val-sub">đ/tháng</div>
                          </>
                        ) : (
                          <span className="cmp-na">Miễn phí / chưa rõ</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="cmp-label-col">Diện tích</td>
                  {rooms.map((room) => {
                    const area = room.area || room.roomArea;
                    return (
                      <td key={room.id} className={`cmp-room-col${bestRoom?.id === room.id ? ' is-best' : ''}`}>
                        {area ? (
                          <span className="cmp-val">{area} m²</span>
                        ) : (
                          <span className="cmp-na">Chưa cập nhật</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* ===== SECTION: TIỆN ÍCH ===== */}
                <tr className="cmp-section-row">
                  <td colSpan={cols + 1}>🏠 Tiện ích đi kèm</td>
                </tr>

                {AMENITY_CHECKS.map((amenity) => (
                  <tr key={amenity.key}>
                    <td className="cmp-label-col">{amenity.label}</td>
                    {rooms.map((room) => {
                      const has = hasAmenity(room, amenity);
                      return (
                        <td key={room.id} className={`cmp-room-col${bestRoom?.id === room.id ? ' is-best' : ''}`}>
                          {has ? (
                            <span className="cmp-check-yes">
                              <Check size={14} /> Có
                            </span>
                          ) : (
                            <span className="cmp-check-no">✕</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* ===== SECTION: ĐIỂM TỔNG KẾT ===== */}
                <tr className="cmp-section-row">
                  <td colSpan={cols + 1}>📊 Điểm tổng hợp</td>
                </tr>

                <tr>
                  <td className="cmp-label-col">Tiện ích đầy đủ</td>
                  {rooms.map((room) => {
                    const score = AMENITY_CHECKS.filter((a) => hasAmenity(room, a)).length;
                    const total = AMENITY_CHECKS.length;
                    const pct = Math.round((score / total) * 100);
                    const isBest = bestRoom?.id === room.id;
                    return (
                      <td key={room.id} className={`cmp-room-col${isBest ? ' is-best' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: isBest ? '#34d399' : '#7c3aed', borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <span className={`cmp-val${isBest ? ' cmp-highlight' : ''}`} style={{ fontSize: 13, flexShrink: 0 }}>
                            {score}/{total}
                          </span>
                        </div>
                        {isBest && <div style={{ fontSize: 10.5, color: '#34d399', marginTop: 4, fontWeight: 700 }}>⭐ Tiện ích tốt nhất</div>}
                      </td>
                    );
                  })}
                </tr>

                {/* ===== ACTION ROW ===== */}
                <tr className="cmp-action-row">
                  <td className="cmp-label-col" style={{ background: 'rgba(0,0,0,0.15)' }}></td>
                  {rooms.map((room) => (
                    <td key={room.id} style={{ padding: '16px', background: bestRoom?.id === room.id ? 'rgba(124,58,237,0.06)' : 'rgba(0,0,0,0.1)', borderBottom: 'none' }}>
                      <Link to={`/rooms/${room.id}`} className="cmp-btn-view" onClick={closeCompareModal}>
                        <ExternalLink size={13} />
                        Xem chi tiết
                      </Link>
                      <Link to={`/rooms/${room.id}`} className="cmp-btn-rent" onClick={closeCompareModal}>
                        <Zap size={13} />
                        Thuê ngay
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="cmp-footer">
            <button className="cmp-footer-clear" onClick={() => { clearCompare(); }}>
              Xóa tất cả & đóng bảng so sánh
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompareModal;
