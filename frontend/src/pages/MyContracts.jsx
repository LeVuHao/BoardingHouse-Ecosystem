import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, DollarSign, Home, MapPin, Phone, 
  MessageSquare, Star, CheckCircle2, Shield, Users, 
  ChevronLeft, ChevronRight, ExternalLink, Zap, Clock, 
  AlertCircle, Receipt, Edit3, Trash2, ShieldCheck, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { contractApi, reviewApi } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const fallbackImages = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
];

const MyContracts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState({});

  // Review states per contract
  const [reviewsMap, setReviewsMap] = useState({});
  const [ratingMap, setRatingMap] = useState({});
  const [hoverRatingMap, setHoverRatingMap] = useState({});
  const [commentMap, setCommentMap] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [contractModal, setContractModal] = useState(null);

  const fetchContracts = async () => {
    try {
      const res = user?.role === 'LANDLORD'
        ? await contractApi.getLandlordContracts()
        : await contractApi.getMyContracts();
      const list = res.data || [];
      setContracts(list);

      // Tải reviews cho các bài đăng gắn với hợp đồng
      list.forEach(async (c) => {
        if (c.postId) {
          try {
            const rRes = await reviewApi.getReviewsByPost(c.postId);
            const rList = rRes.data?.data || rRes.data || [];
            setReviewsMap((prev) => ({ ...prev, [c.id]: rList }));
            const myRev = rList.find((r) => r.reviewerId === user?.id);
            if (myRev) {
              setRatingMap((prev) => ({ ...prev, [c.id]: myRev.rating || 5 }));
              setCommentMap((prev) => ({ ...prev, [c.id]: myRev.comment || '' }));
            }
          } catch (e) {
            console.warn(e);
          }
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin trọ của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  // Gửi hoặc cập nhật đánh giá 5 sao
  const handleSaveReview = async (contract) => {
    if (!user) return;
    const postId = contract.postId;
    if (!postId) {
      toast.error('Chưa liên kết bài đăng diễn đàn cho phòng này');
      return;
    }
    const myRating = ratingMap[contract.id] || 5;
    const myComment = commentMap[contract.id] || '';
    const existing = (reviewsMap[contract.id] || []).find((r) => r.reviewerId === user?.id);

    setSubmittingReview(true);
    try {
      if (existing) {
        await reviewApi.updateReview(existing.id, {
          rating: myRating,
          comment: myComment,
        });
        toast.success('Cập nhật đánh giá thành công! ✨');
      } else {
        await reviewApi.createReview({
          postId: Number(postId),
          reviewerName: user.fullName || 'Người thuê trọ',
          rating: myRating,
          comment: myComment,
        });
        toast.success('Cảm ơn bạn đã gửi đánh giá 5 sao cho phòng trọ! ⭐');
      }
      fetchContracts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      await reviewApi.deleteReview(reviewId);
      toast.success('Đã xóa đánh giá thành công!');
      fetchContracts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa đánh giá');
    }
  };

  if (loading) {
    return (
      <div className="page-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3 style={{ fontWeight: 700, color: 'var(--ink)' }}>Đang tải không gian trọ của bạn...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ background: '#f8fafc', paddingBottom: '60px' }}>
      <div className="wrap" style={{ maxWidth: '1120px' }}>
        
        {/* TOP HERO HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)',
          borderRadius: '24px',
          padding: '36px 32px',
          color: 'white',
          marginTop: '24px',
          marginBottom: '28px',
          boxShadow: '0 12px 36px rgba(37, 99, 235, 0.22)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '14px' }}>
              <Zap size={15} color="#fbbf24" fill="#fbbf24" />
              <span>CỔNG THÔNG TIN CƯ DÂN CHÍNH THỨC</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
              Trọ của tôi & Không gian sinh hoạt
            </h1>
            <p style={{ margin: 0, fontSize: '15px', opacity: 0.92, maxWidth: '640px', lineHeight: 1.5 }}>
              Quản lý hợp đồng số, thông tin chi tiết phòng trọ đang thuê, hóa đơn tiền điện nước hàng tháng và trao đổi trực tiếp với chủ trọ.
            </p>
          </div>
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />
        </div>

        {contracts.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '70px 24px',
            textAlign: 'center',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#2563eb'
            }}>
              <Home size={40} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 8px 0', color: 'var(--ink)' }}>
              Bạn chưa có hợp đồng thuê trọ nào đang kích hoạt
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Khi chủ trọ phê duyệt yêu cầu thuê của bạn, toàn bộ hợp đồng điện tử và không gian phòng trọ sẽ tự động xuất hiện tại đây.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/rooms" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
                Khám phá phòng trọ ngay
              </Link>
              <Link to="/forum" className="btn btn-outline" style={{ padding: '10px 24px', fontWeight: '700' }}>
                Xem diễn đàn trọ
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {contracts.map((c) => {
              const photoList = (c.images && c.images.length > 0) ? c.images : fallbackImages;
              const curIdx = activePhotoIdx[c.id] || 0;
              const existingReview = (reviewsMap[c.id] || []).find((r) => r.reviewerId === user?.id);
              const curRating = ratingMap[c.id] || (existingReview ? existingReview.rating : 5);
              const curHover = hoverRatingMap[c.id] || 0;
              const curComment = commentMap[c.id] !== undefined ? commentMap[c.id] : (existingReview ? existingReview.comment : '');

              return (
                <div key={c.id} style={{
                  background: 'white',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
                  
                  {/* CARD TOP BAR: CONTRACT BADGE & ROOM TITLE */}
                  <div style={{
                    padding: '20px 28px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    background: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.82rem',
                        fontWeight: '800'
                      }}>
                        <CheckCircle2 size={15} />
                        HỢP ĐỒNG ĐÃ KÍCH HOẠT (ACTIVE)
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Mã hợp đồng: <strong>#HD-{c.id}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setContractModal(c)}
                        className="btn btn-outline"
                        style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileText size={14} /> Xem Hợp đồng điện tử
                      </button>
                      <Link
                        to="/my-bills"
                        className="btn btn-primary"
                        style={{ padding: '6px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                      >
                        <Receipt size={14} /> Hóa đơn phòng
                      </Link>
                    </div>
                  </div>

                  {/* 4 QUICK METRIC TILES */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1px',
                    background: 'var(--border)',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <div style={{ background: '#ffffff', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tiền phòng mỗi tháng</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#2563eb', fontFamily: 'Manrope, sans-serif' }}>
                        {formatVnd(c.rentalPrice)}
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tiền cọc an toàn</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#059669', fontFamily: 'Manrope, sans-serif' }}>
                        {formatVnd(c.depositAmount || c.rentalPrice)}
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ngày bắt đầu ở</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--ink)' }}>
                        {c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : 'Đã dọn vào'}
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '18px 24px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Thời hạn hợp đồng</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#7c3aed' }}>
                        {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : '12 tháng (Dài hạn)'}
                      </div>
                    </div>
                  </div>

                  {/* MAIN CONTENT: PHOTO GALLERY & ROOM DETAILS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', padding: '28px' }}>
                    
                    {/* LEFT COLUMN: INTERACTIVE PHOTO GALLERY */}
                    <div>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '360px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#0f172a',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                      }}>
                        <img
                          src={photoList[curIdx]}
                          alt="Ảnh phòng trọ đang thuê"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />

                        {photoList.length > 1 && (
                          <>
                            <button
                              onClick={() => setActivePhotoIdx({
                                ...activePhotoIdx,
                                [c.id]: curIdx === 0 ? photoList.length - 1 : curIdx - 1
                              })}
                              style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              onClick={() => setActivePhotoIdx({
                                ...activePhotoIdx,
                                [c.id]: curIdx === photoList.length - 1 ? 0 : curIdx + 1
                              })}
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <ChevronRight size={20} />
                            </button>
                          </>
                        )}

                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '12px',
                          background: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(6px)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: '700'
                        }}>
                          📷 Ảnh {curIdx + 1} / {photoList.length} - Phòng đang ở
                        </div>
                      </div>

                      {/* THUMBNAIL STRIP */}
                      {photoList.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {photoList.map((img, i) => (
                            <button
                              key={i}
                              onClick={() => setActivePhotoIdx({ ...activePhotoIdx, [c.id]: i })}
                              style={{
                                width: '70px',
                                height: '52px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: curIdx === i ? '2.5px solid #2563eb' : '1px solid var(--border)',
                                padding: 0,
                                cursor: 'pointer',
                                opacity: curIdx === i ? 1 : 0.65,
                                flexShrink: 0
                              }}
                            >
                              <img src={img} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: ROOM DETAILS & LANDLORD CARD */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '800' }}>
                            {c.roomNumber ? `PHÒNG ${c.roomNumber}` : 'PHÒNG TRỌ CAO CẤP'}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            📐 {c.roomArea || 25} m² • Tối đa {c.capacity || 2} người
                          </span>
                        </div>

                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--ink)', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                          {c.propertyTitle || `Phòng trọ tiện nghi #${c.roomNumber || c.roomId}`}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '18px', lineHeight: 1.5 }}>
                          <MapPin size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{c.address ? `${c.address}, ${c.ward || ''}, ${c.district || ''}, ${c.city || ''}` : 'Khu vực Dĩ An, gần các trường đại học TP.HCM'}</span>
                        </div>

                        {/* Tiện ích phòng trọ */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                            Tiện ích phòng đã trang bị:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(c.utilities ? c.utilities.split(',') : ['Wifi tốc độ cao', 'Máy giặt', 'Điều hòa', 'Chỗ để xe', 'Gác lửng', 'Giờ giấc tự do', 'Camera an ninh']).map((u, idx) => (
                              <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600' }}>
                                ✓ {u.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Bạn cùng phòng */}
                        {c.roommates && c.roommates.length > 0 && (
                          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '4px' }}>
                              <Users size={16} color="#059669" />
                              <span>Bạn cùng phòng đang lưu trú ({c.roommates.length}):</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                              {c.roommates.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* LANDLORD CONTACT BOX */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            color: 'white',
                            fontWeight: '900',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {(c.landlordName || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--ink)' }}>
                              {c.landlordName || 'Chủ nhà trọ'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={13} /> Đã xác minh chính chủ
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {c.landlordPhone && (
                            <a
                              href={`tel:${c.landlordPhone}`}
                              className="btn btn-outline"
                              style={{ padding: '8px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Phone size={14} color="#2563eb" /> Gọi điện
                            </a>
                          )}
                          <Link
                            to="/forum/messages"
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                          >
                            <MessageSquare size={14} /> Nhắn tin
                          </Link>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 5-STAR RATING & REVIEW SECTION EMBEDDED DIRECTLY IN MY ROOM */}
                  <div style={{
                    padding: '24px 28px',
                    background: '#fdfcfe',
                    borderTop: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Star size={18} color="#f59e0b" fill="#f59e0b" />
                          Đánh giá 5 sao & Cảm nhận của bạn về trọ này
                        </h4>
                        <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                          Vì bạn là cư dân đã ký hợp đồng ở trọ, đánh giá của bạn sẽ mang huy hiệu xác thực trên diễn đàn Roomily.
                        </p>
                      </div>

                      {c.postId && (
                        <Link
                          to={`/rooms/${c.postId}`}
                          style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Xem bài đăng trọ trên diễn đàn <ExternalLink size={13} />
                        </Link>
                      )}
                    </div>

                    {/* Interactive review box */}
                    <div style={{
                      background: 'white',
                      border: '1.5px solid #e0e7ff',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 2px 12px rgba(99, 102, 241, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ink)' }}>Chấm điểm:</span>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setRatingMap({ ...ratingMap, [c.id]: s })}
                                onMouseEnter={() => setHoverRatingMap({ ...hoverRatingMap, [c.id]: s })}
                                onMouseLeave={() => setHoverRatingMap({ ...hoverRatingMap, [c.id]: 0 })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                              >
                                <Star
                                  size={24}
                                  color="#f59e0b"
                                  fill={s <= (curHover || curRating) ? '#f59e0b' : 'none'}
                                />
                              </button>
                            ))}
                          </div>
                          <span style={{ fontWeight: '800', color: '#d97706', fontSize: '13.5px', marginLeft: '6px' }}>
                            {curRating === 5 ? '⭐⭐⭐⭐⭐ Rất hài lòng / Tuyệt vời' : `${curRating} Sao`}
                          </span>
                        </div>

                        {existingReview && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                              ✓ Đã có đánh giá của bạn
                            </span>
                            <button
                              onClick={() => handleDeleteReview(existingReview.id)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fca5a5', fontSize: '12px' }}
                              title="Xóa đánh giá này"
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        )}
                      </div>

                      <textarea
                        rows={3}
                        value={curComment}
                        onChange={(e) => setCommentMap({ ...commentMap, [c.id]: e.target.value })}
                        placeholder="Chia sẻ trải nghiệm thực tế của bạn: phòng có thoáng không, thái độ chủ trọ thế nào, an ninh khu vực, tiền điện nước..."
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveReview(c)}
                          disabled={submittingReview}
                          className="btn btn-primary"
                          style={{ padding: '8px 22px', fontSize: '13.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Star size={15} />
                          {existingReview ? 'Lưu cập nhật đánh giá' : 'Gửi đánh giá 5 sao cho phòng này'}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* MODAL XEM CHI TIẾT HỢP ĐỒNG ĐIỆN TỬ */}
        {contractModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', letterSpacing: '0.5px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: '900', color: 'var(--ink)' }}>
                    HỢP ĐỒNG THUÊ PHÒNG TRỌ ĐIỆN TỬ
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mã số: #ROOMILY-CONTRACT-{contractModal.id}</div>
                </div>
                <button
                  onClick={() => setContractModal(null)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: '700' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
                <p><strong>BÊN CHO THUÊ (BÊN A):</strong> {contractModal.landlordName || 'Chủ nhà trọ'}</p>
                <p><strong>BÊN THUÊ (BÊN B):</strong> {user?.fullName || 'Người thuê phòng'} (CCCD/SĐT: {user?.phoneNumber || 'Đã xác thực'})</p>
                <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '14px 0' }} />
                <p><strong>ĐIỀU 1. ĐỐI TƯỢNG THUÊ:</strong></p>
                <p>- Phòng số: <strong>{contractModal.roomNumber || contractModal.roomId}</strong></p>
                <p>- Địa chỉ: {contractModal.address || 'Khu trọ Roomily Ecosystem'}</p>
                <p>- Diện tích: {contractModal.roomArea || 25} m²</p>
                <p><strong>ĐIỀU 2. GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN:</strong></p>
                <p>- Giá thuê cố định: <strong>{formatVnd(contractModal.rentalPrice)}/tháng</strong></p>
                <p>- Tiền đặt cọc bảo đảm: <strong>{formatVnd(contractModal.depositAmount || contractModal.rentalPrice)}</strong></p>
                <p>- Thời hạn thuê: Từ ngày {contractModal.startDate} đến ngày {contractModal.endDate || 'Gia hạn hàng năm'}.</p>
                <p><strong>ĐIỀU 3. TRẠNG THÁI HIỆU LỰC:</strong></p>
                <p style={{ color: '#16a34a', fontWeight: '700' }}>✓ Hợp đồng đã được ký số và có giá trị pháp lý trên nền tảng Roomily.</p>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setContractModal(null)}
                  className="btn btn-primary"
                  style={{ padding: '8px 24px', fontWeight: '700' }}
                >
                  Đã hiểu & Đóng
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyContracts;
